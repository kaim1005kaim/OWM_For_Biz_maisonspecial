#!/usr/bin/env node

/**
 * Cleanup Seed Assets Script
 *
 * Deletes all seed-sourced assets from Supabase DB and R2 storage.
 *
 * Usage:
 *   node scripts/cleanup-seed.mjs --workspace maison_demo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import {
  S3Client,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    argMap[args[i].substring(2)] = args[i + 1];
  }
}

const workspaceSlug = argMap.workspace || 'maison_demo';

// Load .env.local
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '..', '.env.local');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach((line) => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

// Verify environment
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'R2_ENDPOINT',
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_BUCKET',
];

const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  process.exit(1);
}

// Initialize clients
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const r2Client = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const BUCKET = process.env.R2_BUCKET;

async function deleteR2Object(key) {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }));
    return true;
  } catch (err) {
    console.error(`  ⚠ R2 delete failed for ${key}: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('========================================');
  console.log('OWM Biz Demo - Cleanup Seed Assets');
  console.log('========================================');
  console.log(`Workspace: ${workspaceSlug}`);
  console.log('');

  // Get workspace
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single();

  if (wsError || !workspace) {
    console.error('Workspace not found:', workspaceSlug);
    process.exit(1);
  }

  console.log(`Workspace ID: ${workspace.id}`);

  // Fetch all seed assets for this workspace
  const { data: assets, error: fetchError } = await supabase
    .from('assets')
    .select('id, r2_key, thumb_r2_key, title')
    .eq('workspace_id', workspace.id)
    .eq('source', 'seed');

  if (fetchError) {
    console.error('Failed to fetch assets:', fetchError.message);
    process.exit(1);
  }

  if (!assets || assets.length === 0) {
    console.log('No seed assets found. Nothing to clean up.');
    process.exit(0);
  }

  console.log(`Found ${assets.length} seed assets to delete.\n`);

  // Delete R2 objects
  let r2Deleted = 0;
  let r2Failed = 0;

  for (const asset of assets) {
    console.log(`  Deleting R2: ${asset.title || asset.id}`);

    if (asset.r2_key) {
      const ok = await deleteR2Object(asset.r2_key);
      ok ? r2Deleted++ : r2Failed++;
    }
    if (asset.thumb_r2_key) {
      await deleteR2Object(asset.thumb_r2_key);
    }
  }

  console.log(`\nR2 cleanup: ${r2Deleted} deleted, ${r2Failed} failed`);

  // Delete from DB (CASCADE will handle asset_annotations, board_items, etc.)
  const assetIds = assets.map((a) => a.id);

  // Delete board_items referencing these assets first (safety)
  const { error: biError } = await supabase
    .from('board_items')
    .delete()
    .in('asset_id', assetIds);

  if (biError) {
    console.error('Warning: board_items cleanup error:', biError.message);
  }

  // Delete generation_outputs referencing these assets
  const { error: goError } = await supabase
    .from('generation_outputs')
    .delete()
    .in('asset_id', assetIds);

  if (goError) {
    console.error('Warning: generation_outputs cleanup error:', goError.message);
  }

  // Delete edits referencing these assets
  const { error: editError } = await supabase
    .from('edits')
    .delete()
    .in('parent_asset_id', assetIds);

  if (editError) {
    console.error('Warning: edits cleanup error:', editError.message);
  }

  // Delete assets (CASCADE deletes asset_annotations)
  const { error: deleteError } = await supabase
    .from('assets')
    .delete()
    .in('id', assetIds);

  if (deleteError) {
    console.error('DB delete failed:', deleteError.message);
    process.exit(1);
  }

  console.log(`DB cleanup: ${assets.length} assets deleted (with cascaded annotations)`);

  console.log('\n========================================');
  console.log('Cleanup Complete');
  console.log('========================================');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
