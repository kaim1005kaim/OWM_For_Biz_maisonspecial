import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getSupabase, getWorkspaceBySlug } from '@/lib/supabase';
import { uploadBufferToR2, generateR2Key, getPublicUrl } from '@/lib/r2';
import { calculateSHA256, getImageMetadata, createThumbnail, getMimeType } from '@/lib/image';
import type { AssetSource } from '@/types';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const workspaceSlug = formData.get('workspaceSlug') as string;
    const source = (formData.get('source') as AssetSource) || 'user_upload';
    const collection = formData.get('collection') as string | null;
    const title = formData.get('title') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!workspaceSlug) {
      return NextResponse.json({ error: 'workspaceSlug is required' }, { status: 400 });
    }

    // Get workspace
    const workspace = await getWorkspaceBySlug(workspaceSlug);
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Calculate SHA256 for deduplication
    const sha256 = calculateSHA256(buffer);

    // Check for duplicate
    const { data: existing } = await supabase
      .from('assets')
      .select('id, r2_key')
      .eq('workspace_id', workspace.id)
      .eq('sha256', sha256)
      .single();

    if (existing) {
      // Return existing asset
      return NextResponse.json({
        success: true,
        assetId: existing.id,
        url: getPublicUrl(existing.r2_key),
        duplicate: true,
      });
    }

    // Get image metadata
    const metadata = await getImageMetadata(buffer);
    const mimeType = await getMimeType(buffer);

    // Generate asset ID and R2 keys
    const assetId = uuidv4();
    const extension = mimeType === 'image/png' ? 'png' : 'jpg';
    const r2Key = generateR2Key(workspaceSlug, 'ref', assetId, extension);
    const thumbR2Key = generateR2Key(workspaceSlug, 'thumb', assetId, 'jpg');

    // Upload original to R2
    const publicUrl = await uploadBufferToR2(r2Key, buffer, mimeType);

    // Create and upload thumbnail
    const thumbBuffer = await createThumbnail(buffer);
    const thumbUrl = await uploadBufferToR2(thumbR2Key, thumbBuffer, 'image/jpeg');

    // Insert asset record
    const { data: asset, error } = await supabase
      .from('assets')
      .insert({
        id: assetId,
        workspace_id: workspace.id,
        kind: 'reference',
        source,
        status: 'processing', // Will be updated to 'ready' after annotation
        r2_key: r2Key,
        thumb_r2_key: thumbR2Key,
        mime: mimeType,
        width: metadata.width,
        height: metadata.height,
        sha256,
        title: title || file.name,
        collection,
        metadata: {},
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: 'Failed to save asset' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      assetId: asset.id,
      url: publicUrl,
      thumbUrl,
      duplicate: false,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
