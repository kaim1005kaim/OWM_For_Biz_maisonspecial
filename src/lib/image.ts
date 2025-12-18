import crypto from 'crypto';
import sharp from 'sharp';

/**
 * Calculate SHA256 hash of buffer
 */
export function calculateSHA256(buffer: Buffer): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

/**
 * Calculate SHA256 hash of base64 string
 */
export function calculateSHA256FromBase64(base64: string): string {
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(cleanBase64, 'base64');
  return calculateSHA256(buffer);
}

/**
 * Get image metadata from buffer
 */
export async function getImageMetadata(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
}> {
  const metadata = await sharp(buffer).metadata();
  return {
    width: metadata.width || 0,
    height: metadata.height || 0,
    format: metadata.format || 'unknown',
  };
}

/**
 * Create thumbnail from buffer
 */
export async function createThumbnail(
  buffer: Buffer,
  maxWidth: number = 400,
  maxHeight: number = 400
): Promise<Buffer> {
  return sharp(buffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality: 80 })
    .toBuffer();
}

/**
 * Resize image to specific dimensions
 */
export async function resizeImage(
  buffer: Buffer,
  width?: number,
  height?: number,
  options: {
    fit?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    quality?: number;
    format?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<Buffer> {
  let sharpInstance = sharp(buffer);

  if (width || height) {
    sharpInstance = sharpInstance.resize(width, height, {
      fit: options.fit || 'inside',
      withoutEnlargement: true,
    });
  }

  switch (options.format || 'jpeg') {
    case 'png':
      return sharpInstance.png().toBuffer();
    case 'webp':
      return sharpInstance.webp({ quality: options.quality || 85 }).toBuffer();
    default:
      return sharpInstance.jpeg({ quality: options.quality || 90 }).toBuffer();
  }
}

/**
 * Convert buffer to base64
 */
export function bufferToBase64(buffer: Buffer, mimeType: string = 'image/jpeg'): string {
  return `data:${mimeType};base64,${buffer.toString('base64')}`;
}

/**
 * Convert base64 to buffer
 */
export function base64ToBuffer(base64: string): Buffer {
  const cleanBase64 = base64.replace(/^data:image\/\w+;base64,/, '');
  return Buffer.from(cleanBase64, 'base64');
}

/**
 * Get MIME type from buffer
 */
export async function getMimeType(buffer: Buffer): Promise<string> {
  const metadata = await sharp(buffer).metadata();
  switch (metadata.format) {
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'gif':
      return 'image/gif';
    default:
      return 'image/jpeg';
  }
}

/**
 * Compress image for API calls (max 1MB, max 1024px width)
 */
export async function compressForAPI(
  buffer: Buffer,
  maxSizeBytes: number = 1024 * 1024
): Promise<Buffer> {
  let quality = 85;
  let result = await sharp(buffer)
    .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality })
    .toBuffer();

  // Reduce quality until under max size
  while (result.length > maxSizeBytes && quality > 30) {
    quality -= 10;
    result = await sharp(buffer)
      .resize(1024, null, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
  }

  return result;
}
