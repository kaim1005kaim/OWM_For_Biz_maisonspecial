#!/usr/bin/env node

/**
 * Seed Image Import Script
 *
 * Usage:
 *   node scripts/import-seed.mjs --workspace maison_demo --collection maison_archive_2019_2025 --dir ./seed_images
 *
 * Environment variables required:
 *   - SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 *   - R2_ENDPOINT
 *   - R2_ACCESS_KEY_ID
 *   - R2_SECRET_ACCESS_KEY
 *   - R2_BUCKET
 *   - R2_PUBLIC_URL
 *   - GEMINI_API_KEY
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// Parse command line arguments
const args = process.argv.slice(2);
const argMap = {};
for (let i = 0; i < args.length; i += 2) {
  if (args[i].startsWith('--')) {
    argMap[args[i].substring(2)] = args[i + 1];
  }
}

const workspaceSlug = argMap.workspace || 'maison_demo';
const collection = argMap.collection || 'maison_archive';
const seedDir = argMap.dir || './seed_images';

// Check if .env.local exists
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
  'R2_PUBLIC_URL',
  'GEMINI_API_KEY',
];

const missing = requiredEnvVars.filter((v) => !process.env[v]);
if (missing.length > 0) {
  console.error('Missing required environment variables:', missing.join(', '));
  console.error('Please create .env.local with the required variables');
  process.exit(1);
}

// Configuration
const API_BASE = process.env.API_BASE || 'http://localhost:3000';
const CONCURRENT_UPLOADS = 3;

// Helper functions
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function calculateSHA256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

async function uploadFile(filePath, workspaceSlug, collection) {
  const fileName = path.basename(filePath);
  const fileBuffer = fs.readFileSync(filePath);
  const sha256 = calculateSHA256(fileBuffer);

  console.log(`  Uploading: ${fileName} (${(fileBuffer.length / 1024).toFixed(1)} KB)`);

  try {
    // Create form data
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), fileName);
    formData.append('workspaceSlug', workspaceSlug);
    formData.append('source', 'seed');
    formData.append('collection', collection);
    formData.append('title', fileName.replace(/\.[^/.]+$/, ''));

    // Upload
    const uploadRes = await fetch(`${API_BASE}/api/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!uploadRes.ok) {
      const error = await uploadRes.text();
      throw new Error(`Upload failed: ${uploadRes.status} - ${error}`);
    }

    const uploadData = await uploadRes.json();

    if (uploadData.duplicate) {
      console.log(`    ✓ Duplicate (already exists)`);
      return { success: true, duplicate: true, assetId: uploadData.assetId };
    }

    console.log(`    ✓ Uploaded: ${uploadData.assetId}`);

    // Annotate
    console.log(`    Annotating...`);
    const annotateRes = await fetch(`${API_BASE}/api/annotate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assetId: uploadData.assetId }),
    });

    if (!annotateRes.ok) {
      console.log(`    ⚠ Annotation failed (asset still saved)`);
    } else {
      const annotateData = await annotateRes.json();
      console.log(`    ✓ Annotated: ${annotateData.annotation?.tags?.slice(0, 3).join(', ') || 'no tags'}`);
    }

    return { success: true, duplicate: false, assetId: uploadData.assetId };
  } catch (error) {
    console.error(`    ✗ Failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function processFiles(files, workspaceSlug, collection) {
  const results = {
    total: files.length,
    success: 0,
    duplicate: 0,
    failed: 0,
    errors: [],
  };

  // Process in batches
  for (let i = 0; i < files.length; i += CONCURRENT_UPLOADS) {
    const batch = files.slice(i, i + CONCURRENT_UPLOADS);
    console.log(`\nBatch ${Math.floor(i / CONCURRENT_UPLOADS) + 1}/${Math.ceil(files.length / CONCURRENT_UPLOADS)}`);

    const promises = batch.map((file) => uploadFile(file, workspaceSlug, collection));
    const batchResults = await Promise.all(promises);

    for (const result of batchResults) {
      if (result.success) {
        if (result.duplicate) {
          results.duplicate++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.errors.push(result.error);
      }
    }

    // Small delay between batches
    if (i + CONCURRENT_UPLOADS < files.length) {
      await sleep(1000);
    }
  }

  return results;
}

// Main execution
async function main() {
  console.log('========================================');
  console.log('OWM Biz Demo - Seed Image Import');
  console.log('========================================');
  console.log(`Workspace: ${workspaceSlug}`);
  console.log(`Collection: ${collection}`);
  console.log(`Directory: ${seedDir}`);
  console.log(`API Base: ${API_BASE}`);
  console.log('');

  // Check if directory exists
  if (!fs.existsSync(seedDir)) {
    console.error(`Error: Directory not found: ${seedDir}`);
    console.log('\nCreate the directory and add image files:');
    console.log(`  mkdir -p ${seedDir}`);
    console.log(`  # Add .jpg, .jpeg, .png, or .webp files`);
    process.exit(1);
  }

  // Get image files
  const files = fs
    .readdirSync(seedDir)
    .filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
    .map((f) => path.join(seedDir, f))
    .sort();

  if (files.length === 0) {
    console.error(`Error: No image files found in ${seedDir}`);
    console.log('Supported formats: .jpg, .jpeg, .png, .webp');
    process.exit(1);
  }

  console.log(`Found ${files.length} images to import`);
  console.log('');

  // Process files
  const results = await processFiles(files, workspaceSlug, collection);

  // Summary
  console.log('\n========================================');
  console.log('Import Complete');
  console.log('========================================');
  console.log(`Total:     ${results.total}`);
  console.log(`Success:   ${results.success}`);
  console.log(`Duplicate: ${results.duplicate}`);
  console.log(`Failed:    ${results.failed}`);

  if (results.errors.length > 0) {
    console.log('\nErrors:');
    results.errors.forEach((e, i) => console.log(`  ${i + 1}. ${e}`));
  }

  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
