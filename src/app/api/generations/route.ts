import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { getPublicUrl } from '@/lib/r2';

/**
 * GET /api/generations?boardId=xxx OR ?workspaceSlug=xxx&textileId=xxx
 * 生成履歴を取得する
 * - generation_outputs + assets を結合
 * - 各出力のdetail view（hero_shot, garment_view）も取得
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabase();
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get('boardId');
    const workspaceSlug = searchParams.get('workspaceSlug');
    const textileId = searchParams.get('textileId');

    // Build query based on parameters
    let query = supabase
      .from('generations')
      .select('id, prompt, config, created_at, workspace_id')
      .order('created_at', { ascending: false });

    if (boardId) {
      // MAISON SPECIAL flow: filter by board
      query = query.eq('board_id', boardId);
    } else if (workspaceSlug) {
      // HERALBONY flow: filter by workspace and optionally by textile
      const { getWorkspaceBySlug } = await import('@/lib/supabase');
      const workspace = await getWorkspaceBySlug(workspaceSlug);
      if (!workspace) {
        return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
      }
      query = query.eq('workspace_id', workspace.id);

      // If textileId specified, filter by config->textileId
      if (textileId) {
        query = query.contains('config', { textileId });
      }
    } else {
      return NextResponse.json({ error: 'boardId or workspaceSlug is required' }, { status: 400 });
    }

    // Get all generations
    const { data: generations, error: genError } = await query.limit(50);

    if (genError) {
      console.error('Generations fetch error:', genError);
      return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
    }

    if (!generations || generations.length === 0) {
      return NextResponse.json({ success: true, generations: [] });
    }

    // Get all generation outputs with assets
    const genIds = generations.map((g) => g.id);
    const { data: outputs, error: outputsError } = await supabase
      .from('generation_outputs')
      .select(`
        id,
        generation_id,
        asset_id,
        liked,
        score,
        assets!inner (
          id,
          r2_key,
          mime,
          status,
          metadata
        )
      `)
      .in('generation_id', genIds);

    if (outputsError) {
      console.error('Outputs fetch error:', outputsError);
      return NextResponse.json({ error: 'Failed to fetch outputs' }, { status: 500 });
    }

    // Collect all output asset IDs for detail view lookup
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputAssetIds = (outputs || []).map((o: any) => o.asset_id);

    // Fetch garment_view assets linked to generated outputs (3-view: front/side/back)
    let detailAssets: Record<string, { garmentViews?: { frontUrl: string; sideUrl: string; backUrl: string; viewStyle: string } }> = {};

    if (outputAssetIds.length > 0) {
      const { data: detailData } = await supabase
        .from('assets')
        .select('id, r2_key, metadata')
        .in('metadata->>sourceAssetId', outputAssetIds)
        .eq('metadata->>type', 'garment_view');

      if (detailData && detailData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const asset of detailData as any[]) {
          const sourceId = asset.metadata?.sourceAssetId;
          if (!sourceId) continue;

          if (!detailAssets[sourceId]) {
            detailAssets[sourceId] = {};
          }

          const viewName = asset.metadata.viewName as string;
          const viewStyle = asset.metadata.viewStyle as string;
          if (!detailAssets[sourceId].garmentViews) {
            detailAssets[sourceId].garmentViews = {
              frontUrl: '',
              sideUrl: '',
              backUrl: '',
              viewStyle: viewStyle || 'ghost',
            };
          }
          const url = getPublicUrl(asset.r2_key);
          if (viewName === 'front') detailAssets[sourceId].garmentViews!.frontUrl = url;
          else if (viewName === 'side') detailAssets[sourceId].garmentViews!.sideUrl = url;
          else if (viewName === 'back') detailAssets[sourceId].garmentViews!.backUrl = url;
        }
      }
    }

    // Build response grouped by generation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const outputsByGen: Record<string, any[]> = {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const output of (outputs || []) as any[]) {
      const genId = output.generation_id;
      if (!outputsByGen[genId]) outputsByGen[genId] = [];

      const asset = output.assets;
      const assetId = output.asset_id;
      outputsByGen[genId].push({
        id: output.id,
        assetId,
        url: getPublicUrl(asset.r2_key),
        liked: output.liked,
        detailViews: detailAssets[assetId] || null,
      });
    }

    const result = generations.map((gen) => ({
      id: gen.id,
      prompt: gen.prompt,
      config: gen.config,
      createdAt: gen.created_at,
      // Heralbony-specific metadata
      textileId: gen.config?.textileId || null,
      artistName: gen.config?.artistName || null,
      textileTitle: gen.config?.textileTitle || null,
      category: gen.config?.category || null,
      outputs: outputsByGen[gen.id] || [],
    }));

    return NextResponse.json({ success: true, generations: result });
  } catch (error) {
    console.error('Generations history error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch history' },
      { status: 500 }
    );
  }
}
