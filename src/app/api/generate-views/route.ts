import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, getWorkspaceBySlug } from '@/lib/supabase';
import {
  getObjectAsBase64,
  uploadBufferToR2,
  generateR2Key,
} from '@/lib/r2';
import { generateWithReference } from '@/lib/gemini';
import { buildGhostMannequinPrompt, buildFlatLayPrompt } from '@/lib/prompts/garment-spec';
import { splitTriptych } from '@/lib/image';
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
    // Generate Garment Spec Sheet (Triptych) - 3-view only
    // Hero is already the main output.url, no need to regenerate
    // ============================
    console.log(`[generate-views] Generating garment spec sheet (${viewStyle})...`);

    const specPrompt = viewStyle === 'ghost'
      ? buildGhostMannequinPrompt(designPrompt)
      : buildFlatLayPrompt(designPrompt);

    const specImage = await generateWithReference(
      specPrompt,
      referenceBase64,
      referenceMime
    );

    if (!specImage) {
      return NextResponse.json(
        { error: 'Garment spec sheet generation failed' },
        { status: 500 }
      );
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
      garmentViews: {
        frontAssetId: panelResults.front.assetId,
        frontUrl: panelResults.front.url,
        sideAssetId: panelResults.side.assetId,
        sideUrl: panelResults.side.url,
        backAssetId: panelResults.back.assetId,
        backUrl: panelResults.back.url,
        viewStyle,
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
