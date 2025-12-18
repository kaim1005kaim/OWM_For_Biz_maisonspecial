import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { supabase, getWorkspaceBySlug } from '@/lib/supabase';
import { getObjectAsBase64, uploadBase64ToR2, generateR2Key, getPublicUrl } from '@/lib/r2';
import { editImage } from '@/lib/gemini';

export const maxDuration = 120;

interface EditRequest {
  workspaceSlug: string;
  parentAssetId: string;
  instruction: string;
  aspectRatio?: string;
  imageSize?: '2K' | '4K';
}

export async function POST(request: NextRequest) {
  try {
    const body: EditRequest = await request.json();
    const { workspaceSlug, parentAssetId, instruction } = body;

    if (!workspaceSlug || !parentAssetId || !instruction) {
      return NextResponse.json(
        { error: 'workspaceSlug, parentAssetId, and instruction are required' },
        { status: 400 }
      );
    }

    // Get workspace
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Get parent asset
    const { data: parentAsset, error: parentError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', parentAssetId)
      .single();

    if (parentError || !parentAsset) {
      return NextResponse.json({ error: 'Parent asset not found' }, { status: 404 });
    }

    // Get parent image as base64
    const base64Image = await getObjectAsBase64(parentAsset.r2_key);
    const mimeType = parentAsset.mime || 'image/jpeg';

    // Edit the image
    const editedImage = await editImage(base64Image, mimeType, instruction);

    if (!editedImage) {
      return NextResponse.json({ error: 'Failed to generate edited image' }, { status: 500 });
    }

    // Create new asset for the edited image
    const childAssetId = uuidv4();
    const r2Key = generateR2Key(workspaceSlug, 'gen', childAssetId, 'png');

    // Upload to R2
    const publicUrl = await uploadBase64ToR2(r2Key, editedImage.data, editedImage.mimeType);

    // Create child asset record
    const { error: assetError } = await supabase
      .from('assets')
      .insert({
        id: childAssetId,
        workspace_id: workspace.id,
        kind: 'generated',
        source: 'generated',
        status: 'ready',
        r2_key: r2Key,
        mime: editedImage.mimeType,
        metadata: {
          parentAssetId,
          instruction,
        },
      });

    if (assetError) {
      console.error('Asset save error:', assetError);
      return NextResponse.json({ error: 'Failed to save edited asset' }, { status: 500 });
    }

    // Create edit record
    const editId = uuidv4();
    const { error: editError } = await supabase
      .from('edits')
      .insert({
        id: editId,
        workspace_id: workspace.id,
        parent_asset_id: parentAssetId,
        child_asset_id: childAssetId,
        instruction,
        model: 'gemini-2.0-flash-exp-image-generation',
      });

    if (editError) {
      console.error('Edit record save error:', editError);
      // Continue anyway, the asset was saved
    }

    return NextResponse.json({
      success: true,
      editId,
      parentAssetId,
      childAssetId,
      instruction,
      url: publicUrl,
    });
  } catch (error) {
    console.error('Edit error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Edit failed' },
      { status: 500 }
    );
  }
}
