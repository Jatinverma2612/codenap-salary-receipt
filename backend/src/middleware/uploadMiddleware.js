import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { ApiError } from './errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');
export const MAX_LOGO_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.webp']);
const ALLOWED_MIME_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_LOGO_SIZE_BYTES,
    files: 1,
  },
  fileFilter(_req, file, cb) {
    const ext = path.extname(file.originalname || '').toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
      return cb(new ApiError(400, 'Only PNG, JPEG, and WEBP image files are allowed for the company logo.'));
    }
    return cb(null, true);
  },
});

/**
 * Multer middleware accepting a single 'logo' file field with clean error normalization.
 */
export function uploadLogoSingle(req, res, next) {
  upload.single('logo')(req, res, (err) => {
    if (!err) {
      return next();
    }
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new ApiError(400, 'Logo image must be 2 MB or smaller.'));
      }
      return next(new ApiError(400, 'Invalid file upload request.'));
    }
    return next(err);
  });
}

/**
 * Inspects file magic bytes to verify the true image format (never trusts client MIME alone).
 */
export function detectImageType(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 12) {
    return null;
  }

  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mimeType: 'image/png', ext: '.png' };
  }

  // JPEG signature: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mimeType: 'image/jpeg', ext: '.jpg' };
  }

  // WEBP signature: "RIFF".... "WEBP"
  if (
    buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buffer.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return { mimeType: 'image/webp', ext: '.webp' };
  }

  return null;
}

/**
 * Resolves a filename strictly inside UPLOADS_DIR, rejecting any traversal attempts.
 */
export function resolveSafeUploadPath(filename) {
  const safeBaseName = path.basename(String(filename || ''));
  if (!safeBaseName || safeBaseName === '.' || safeBaseName === '..') {
    throw new ApiError(400, 'Invalid upload filename.');
  }

  const resolved = path.resolve(UPLOADS_DIR, safeBaseName);
  if (!resolved.startsWith(UPLOADS_DIR + path.sep)) {
    throw new ApiError(400, 'Invalid upload storage path.');
  }

  return { safeBaseName, resolved };
}

/**
 * Writes a validated logo buffer under an unpredictable UUID filename in backend/uploads/.
 */
export async function saveLogoFile(buffer, ext) {
  // TODO(security): Integrate antivirus/malware scanning before persisting uploaded files in production.
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const randomName = `logo-${crypto.randomUUID()}${ext}`;
  const { safeBaseName, resolved } = resolveSafeUploadPath(randomName);
  await fs.writeFile(resolved, buffer);
  return safeBaseName;
}

/**
 * Safely deletes a previously stored logo file from backend/uploads/ if it exists.
 */
export async function deleteLogoFile(filename) {
  if (!filename) {
    return;
  }

  try {
    const { resolved } = resolveSafeUploadPath(filename);
    await fs.unlink(resolved);
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.warn('Could not delete previous logo file:', err.message);
    }
  }
}
