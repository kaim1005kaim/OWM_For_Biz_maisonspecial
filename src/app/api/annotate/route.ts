import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getObjectAsBase64 } from '@/lib/r2';
import { annotateImage } from '@/lib/gemini';

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const { assetId } = await request.json();

    if (!assetId) {
      return NextResponse.json({ error: 'assetId is required' }, { status: 400 });
    }

    // Get asset from database
    const { data: asset, error: assetError } = await supabase
      .from('assets')
      .select('*')
      .eq('id', assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Get image from R2 as base64
    const base64Image = await getObjectAsBase64(asset.r2_key);
    const mimeType = asset.mime || 'image/jpeg';

    // Call Gemini to annotate the image
    const annotation = await annotateImage(base64Image, mimeType);

    // Upsert annotation
    const { error: annotationError } = await supabase
      .from('asset_annotations')
      .upsert({
        asset_id: assetId,
        caption: annotation.caption,
        tags: annotation.tags,
        silhouette: annotation.silhouette,
        material: annotation.material,
        pattern: annotation.pattern,
        details: annotation.details,
        mood: annotation.mood,
        color_palette: annotation.color_palette,
        raw: annotation,
        updated_at: new Date().toISOString(),
      });

    if (annotationError) {
      console.error('Annotation save error:', annotationError);
      return NextResponse.json({ error: 'Failed to save annotation' }, { status: 500 });
    }

    // Update asset status to ready
    await supabase
      .from('assets')
      .update({ status: 'ready' })
      .eq('id', assetId);

    return NextResponse.json({
      success: true,
      assetId,
      annotation,
    });
  } catch (error) {
    console.error('Annotate error:', error);

    // Try to update asset status to failed
    try {
      const { assetId } = await request.clone().json();
      if (assetId) {
        await supabase
          .from('assets')
          .update({ status: 'failed' })
          .eq('id', assetId);
      }
    } catch {
      // Ignore
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Annotation failed' },
      { status: 500 }
    );
  }
}
