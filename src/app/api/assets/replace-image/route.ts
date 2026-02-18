import { NextRequest, NextResponse } from 'next/server';
import { getSupabase, getWorkspaceBySlug } from '@/lib/supabase';
import { uploadBase64ToR2 } from '@/lib/r2';

export const maxDuration = 30;

interface ReplaceImageRequest {
  assetId: string;
  r2Key: string;
  imageBase64: string;
  mimeType: string;
  workspaceSlug: string;
}

/**
 * Replace an asset's image in R2
 * Used for updating existing textile images
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const body: ReplaceImageRequest = await request.json();
    const { assetId, r2Key, imageBase64, mimeType, workspaceSlug } = body;

    if (!assetId || !r2Key || !imageBase64 || !workspaceSlug) {
      return NextResponse.json(
        { error: 'assetId, r2Key, imageBase64, and workspaceSlug are required' },
        { status: 400 }
      );
    }

    // Get workspace
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Verify asset exists and belongs to workspace
    const { data: asset, error: fetchError } = await supabase
      .from('assets')
      .select('id, r2_key')
      .eq('id', assetId)
      .eq('workspace_id', workspace.id)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Upload new image to R2 (overwrites existing)
    const newUrl = await uploadBase64ToR2(r2Key, imageBase64, mimeType);

    console.log(`Replaced image for asset ${assetId}: ${newUrl}`);

    return NextResponse.json({
      success: true,
      assetId,
      url: newUrl,
    });
  } catch (error) {
    console.error('Replace image error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Replace failed' },
      { status: 500 }
    );
  }
}
