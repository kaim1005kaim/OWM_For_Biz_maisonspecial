/**
 * Replace people images with abstract images
 * Run with: npx tsx scripts/replace-people-images.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const API_BASE = 'http://localhost:3000';

// Assets to replace (identified as having people instead of abstract art)
const REPLACEMENTS = [
  {
    assetId: '822510e9-b188-4a3e-8d66-e8b4329334b2', // 高橋 健太 - 躍動する色彩
    r2Key: 'ws/heralbony_demo/ref/2026/02/822510e9-b188-4a3e-8d66-e8b4329334b2.jpg',
    newImagePath: '/tmp/textile-replacements/abstract_new1.jpg',
  },
  {
    assetId: '1028d896-ff4a-44ef-b72c-51d621c88f9f', // 伊藤 さくら - 森の精霊
    r2Key: 'ws/heralbony_demo/ref/2026/02/1028d896-ff4a-44ef-b72c-51d621c88f9f.jpg',
    newImagePath: '/tmp/textile-replacements/abstract_new2.jpg',
  },
];

async function replaceImage(replacement: typeof REPLACEMENTS[0]) {
  const { assetId, r2Key, newImagePath } = replacement;

  if (!fs.existsSync(newImagePath)) {
    console.log(`Skip: ${newImagePath} not found`);
    return false;
  }

  const fileBuffer = fs.readFileSync(newImagePath);
  const base64 = fileBuffer.toString('base64');

  try {
    // Use a simple API to replace the R2 object
    const response = await fetch(`${API_BASE}/api/assets/replace-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assetId,
        r2Key,
        imageBase64: base64,
        mimeType: 'image/jpeg',
        workspaceSlug: 'heralbony_demo',
      }),
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✓ Replaced: ${assetId}`);
      return true;
    } else {
      console.log(`✗ Failed: ${assetId} - ${result.error}`);
      return false;
    }
  } catch (error) {
    console.error(`Error replacing ${assetId}:`, error);
    return false;
  }
}

async function main() {
  console.log('\nReplacing people images with abstract art...\n');

  for (const replacement of REPLACEMENTS) {
    await replaceImage(replacement);
  }

  console.log('\nDone!');
}

main().catch(console.error);
