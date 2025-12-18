// Asset types
export type AssetKind = 'reference' | 'generated';
export type AssetSource = 'seed' | 'user_upload' | 'generated';
export type AssetStatus = 'processing' | 'ready' | 'failed';

export interface Asset {
  id: string;
  workspace_id: string;
  kind: AssetKind;
  source: AssetSource;
  status: AssetStatus;
  r2_key: string;
  thumb_r2_key?: string;
  mime?: string;
  width?: number;
  height?: number;
  sha256?: string;
  title?: string;
  notes?: string;
  collection?: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AssetAnnotation {
  asset_id: string;
  caption?: string;
  tags: string[];
  silhouette?: string;
  material?: string;
  pattern?: string;
  details?: string;
  mood?: string;
  color_palette: string[];
  raw: Record<string, unknown>;
  updated_at: string;
}

export interface AssetWithAnnotation extends Asset {
  annotation?: AssetAnnotation;
}

// Workspace
export interface Workspace {
  id: string;
  slug: string;
  name: string;
  created_at: string;
}

// Moodboard
export interface Board {
  id: string;
  workspace_id: string;
  name: string;
  created_at: string;
}

export interface BoardItem {
  board_id: string;
  asset_id: string;
  position: number;
}

export interface BoardWithAssets extends Board {
  assets: AssetWithAnnotation[];
}

// Generation
export interface Generation {
  id: string;
  workspace_id: string;
  board_id?: string;
  prompt: string;
  model: string;
  config: {
    aspectRatio?: string;
    imageSize?: string;
    count?: number;
  };
  created_at: string;
}

export interface GenerationOutput {
  id: string;
  generation_id: string;
  asset_id: string;
  score: number;
  liked: boolean;
  notes?: string;
  created_at: string;
  asset?: Asset;
}

export interface GenerationWithOutputs extends Generation {
  outputs: GenerationOutput[];
}

// Edit history
export interface Edit {
  id: string;
  workspace_id: string;
  parent_asset_id: string;
  child_asset_id: string;
  instruction: string;
  model: string;
  created_at: string;
}

export interface EditWithAssets extends Edit {
  parent_asset?: Asset;
  child_asset?: Asset;
}

// API Request/Response types
export interface UploadRequest {
  workspaceSlug: string;
  source: AssetSource;
  collection?: string;
  title?: string;
}

export interface AnnotateRequest {
  assetId: string;
}

export interface AnnotationResult {
  caption: string;
  tags: string[];
  silhouette: string;
  material: string;
  pattern: string;
  details: string;
  mood: string;
  color_palette: string[];
}

export interface GenerateRequest {
  workspaceSlug: string;
  boardId: string;
  prompt: string;
  count: 12 | 24 | 48;
  aspectRatio: string;
  imageSize: '2K' | '4K';
}

export interface EditRequest {
  workspaceSlug: string;
  parentAssetId: string;
  instruction: string;
  aspectRatio?: string;
  imageSize?: '2K' | '4K';
}

// Filter options for Library
export interface LibraryFilters {
  source?: AssetSource[];
  tags?: string[];
  silhouette?: string[];
  material?: string[];
  mood?: string[];
  collection?: string[];
}
