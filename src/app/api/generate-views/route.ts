import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, getWorkspaceBySlug } from '@/lib/supabase';
import {
  getObjectAsBase64,
  getObjectFromR2,
  uploadBase64ToR2,
  uploadBufferToR2,
  generateR2Key,
  getPublicUrl,
} from '@/lib/r2';
import { generateWithReference } from '@/lib/gemini';
import { constructHeroPrompt } from '@/lib/prompts/hero-prompt';
import { buildGhostMannequinPrompt, buildFlatLayPrompt } from '@/lib/prompts/garment-spec';
import { splitTriptych } from '@/lib/image';
import { annotateImage } from '@/lib/gemini';
import type { ViewStyle } from '@/types';

export const maxDuration = 300; // 5 minutes

interface GenerateViewsBody {
  workspaceSlug: string;
  assetId: string;
  viewStyle: ViewStyle;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body: GenerateViewsBody = await request.json();
    const { workspaceSlug, assetId, viewStyle } = body;

    if (!workspaceSlug || !assetId || !viewStyle) {
      return NextResponse.json(
        { error: 'workspaceSlug, assetId, and viewStyle are required' },
        { status: 400 }
      );
    }

    // Get workspace
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get the source asset
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Get the source image as base64 for reference
    const referenceBase64 = await getObjectAsBase64(asset.r2_key);
    const referenceMime = asset.mime || 'image/jpeg';

    // Get annotation for design prompt (if available)
    const { data: annotation } = await supabase
      .from('asset_annotations')
      .select('*')
      .eq('asset_id', assetId)
      .single();

    const designPrompt = annotation?.caption
      ? `${annotation.caption}. Tags: ${(annotation.tags || []).join(', ')}. Silhouette: ${annotation.silhouette || 'N/A'}. Material: ${annotation.material || 'N/A'}. Pattern: ${annotation.pattern || 'N/A'}. Details: ${annotation.details || 'N/A'}. Mood: ${annotation.mood || 'N/A'}. Colors: ${(annotation.color_palette || []).join(', ')}.`
      : 'Fashion garment design with high-end editorial quality.';

    // ============================
    // STEP 1: Generate Hero Shot
    // ============================
    console.log('[generate-views] Step 1: Hero shot generation...');

    const heroPromptResult = constructHeroPrompt(designPrompt);
    const heroImage = await generateWithReference(
      heroPromptResult.prompt,
      referenceBase64,
      referenceMime
    );

    if (!heroImage) {
      return NextResponse.json(
        { error: 'Hero shot generation failed' },
        { status: 500 }
      );
    }

    // Save hero image
    const heroAssetId = uuidv4();
    const heroR2Key = generateR2Key(workspaceSlug, 'gen', heroAssetId, 'png');
    const heroUrl = await uploadBase64ToR2(heroR2Key, heroImage.base64, heroImage.mimeType);

    await supabase.from('assets').insert({
      id: heroAssetId,
      workspace_id: workspace.id,
      kind: 'generated',
      source: 'generated',
      status: 'ready',
      r2_key: heroR2Key,
      mime: heroImage.mimeType,
      metadata: {
        type: 'hero_shot',
        sourceAssetId: assetId,
        heroStyle: heroPromptResult.styleKey,
        heroStyleName: heroPromptResult.styleName,
      },
    });

    // ============================
    // STEP 2: Generate Garment Spec Sheet (Triptych)
    // ============================
    console.log(`[generate-views] Step 2: Garment spec sheet (${viewStyle})...`);

    // Rate limit delay between requests
    await new Promise((resolve) => setTimeout(resolve, 7000));

    const specPrompt = viewStyle === 'ghost'
      ? buildGhostMannequinPrompt(designPrompt)
      : buildFlatLayPrompt(designPrompt);

    const specImage = await generateWithReference(
      specPrompt,
      referenceBase64,
      referenceMime
    );

    if (!specImage) {
      // Return hero only if spec fails
      return NextResponse.json({
        success: true,
        heroAssetId,
        heroUrl,
        garmentViews: null,
        error: 'Garment spec sheet generation failed, hero shot only',
      });
    }

    // ============================
    // STEP 3: Split Triptych into 3 panels
    // ============================
    console.log('[generate-views] Step 3: Splitting triptych...');

    const specBuffer = Buffer.from(
      specImage.base64.replace(/^data:image\/\w+;base64,/, ''),
      'base64'
    );
    const panels = await splitTriptych(specBuffer);

    // Upload each panel
    const panelNames = ['front', 'side', 'back'] as const;
    const panelBuffers = [panels.front, panels.center, panels.back];
    const panelResults: Record<string, { assetId: string; url: string }> = {};

    for (let i = 0; i < 3; i++) {
      const panelAssetId = uuidv4();
      const panelR2Key = generateR2Key(workspaceSlug, 'gen', panelAssetId, 'jpg');
      const panelUrl = await uploadBufferToR2(panelR2Key, panelBuffers[i], 'image/jpeg');

      await supabase.from('assets').insert({
        id: panelAssetId,
        workspace_id: workspace.id,
        kind: 'generated',
        source: 'generated',
        status: 'ready',
        r2_key: panelR2Key,
        mime: 'image/jpeg',
        metadata: {
          type: 'garment_view',
          viewName: panelNames[i],
          viewStyle,
          sourceAssetId: assetId,
        },
      });

      panelResults[panelNames[i]] = {
        assetId: panelAssetId,
        url: panelUrl,
      };
    }

    console.log('[generate-views] Complete!');

    return NextResponse.json({
      success: true,
      heroAssetId,
      heroUrl,
      garmentViews: {
        frontAssetId: panelResults.front.assetId,
        frontUrl: panelResults.front.url,
        sideAssetId: panelResults.side.assetId,
        sideUrl: panelResults.side.url,
        backAssetId: panelResults.back.assetId,
        backUrl: panelResults.back.url,
      },
    });
  } catch (error) {
    console.error('Generate views error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}
