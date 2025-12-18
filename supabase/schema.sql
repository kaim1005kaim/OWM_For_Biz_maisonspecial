-- OWM Biz Demo Database Schema
-- Run this in Supabase SQL Editor

-- ワークスペース（案件）
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Asset types
CREATE TYPE asset_kind AS ENUM ('reference', 'generated');
CREATE TYPE asset_source AS ENUM ('seed', 'user_upload', 'generated');
CREATE TYPE asset_status AS ENUM ('processing', 'ready', 'failed');

-- 参考画像 / 生成画像（共通で扱う）
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  kind asset_kind NOT NULL,
  source asset_source NOT NULL,
  status asset_status NOT NULL DEFAULT 'processing',

  r2_key TEXT NOT NULL,              -- オリジナル
  thumb_r2_key TEXT,                 -- サムネ（任意）
  mime TEXT,
  width INT,
  height INT,
  sha256 TEXT,                       -- 重複排除

  title TEXT,
  notes TEXT,
  collection TEXT,                   -- "maison_archive_2019_2025" 等
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS assets_ws_idx ON assets(workspace_id);
CREATE INDEX IF NOT EXISTS assets_source_idx ON assets(source);
CREATE INDEX IF NOT EXISTS assets_collection_idx ON assets(collection);
CREATE UNIQUE INDEX IF NOT EXISTS assets_ws_sha256_unique ON assets(workspace_id, sha256);

-- 自動タグ/要約
CREATE TABLE IF NOT EXISTS asset_annotations (
  asset_id UUID PRIMARY KEY REFERENCES assets(id) ON DELETE CASCADE,
  caption TEXT,
  tags TEXT[] DEFAULT '{}',
  silhouette TEXT,
  material TEXT,
  pattern TEXT,
  details TEXT,
  mood TEXT,
  color_palette TEXT[] DEFAULT '{}',
  raw JSONB NOT NULL DEFAULT '{}'::JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ムードボード（参照セット）
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_items (
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  PRIMARY KEY (board_id, asset_id)
);

-- 生成バッチ
CREATE TABLE IF NOT EXISTS generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id UUID REFERENCES boards(id),
  prompt TEXT NOT NULL,
  model TEXT NOT NULL, -- gemini-2.0-flash-exp-image-generation
  config JSONB NOT NULL DEFAULT '{}'::JSONB, -- aspect/size/count
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 生成結果（1バッチで複数枚）
CREATE TABLE IF NOT EXISTS generation_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  generation_id UUID REFERENCES generations(id) ON DELETE CASCADE,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  score INT DEFAULT 0,
  liked BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 編集履歴（ツリー化）
CREATE TABLE IF NOT EXISTS edits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
  parent_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  child_asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  instruction TEXT NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Initial demo workspace
INSERT INTO workspaces (slug, name)
VALUES ('maison_demo', 'MAISON SPECIAL Demo')
ON CONFLICT (slug) DO NOTHING;

-- Functions for incrementing/decrementing
CREATE OR REPLACE FUNCTION update_board_item_position(
  p_board_id UUID,
  p_asset_id UUID,
  p_new_position INT
) RETURNS VOID AS $$
BEGIN
  UPDATE board_items
  SET position = p_new_position
  WHERE board_id = p_board_id AND asset_id = p_asset_id;
END;
$$ LANGUAGE plpgsql;

-- View for assets with annotations
CREATE OR REPLACE VIEW assets_with_annotations AS
SELECT
  a.*,
  ann.caption,
  ann.tags,
  ann.silhouette,
  ann.material,
  ann.pattern,
  ann.details,
  ann.mood,
  ann.color_palette,
  ann.raw as annotation_raw
FROM assets a
LEFT JOIN asset_annotations ann ON a.id = ann.asset_id;

-- View for boards with asset count
CREATE OR REPLACE VIEW boards_with_counts AS
SELECT
  b.*,
  COUNT(bi.asset_id) as asset_count
FROM boards b
LEFT JOIN board_items bi ON b.id = bi.board_id
GROUP BY b.id;

-- View for generation outputs with asset details
CREATE OR REPLACE VIEW generation_outputs_with_assets AS
SELECT
  go.*,
  a.r2_key,
  a.thumb_r2_key,
  a.width,
  a.height,
  a.status as asset_status
FROM generation_outputs go
LEFT JOIN assets a ON go.asset_id = a.id;
