import Receipt from '../models/Receipt.js';
import { escapeRegex } from '../middleware/validateMiddleware.js';

/**
 * Normalizes a receipt prefix to uppercase alphanumeric/hyphen characters.
 */
export function normalizePrefix(prefix) {
  const cleaned = typeof prefix === 'string' ? prefix.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '') : '';
  return cleaned || 'CNP';
}

/**
 * Generates the next unique sequential receipt number (e.g., CNP-2026-0001).
 */
export async function generateReceiptNumber(prefix = 'CNP', year = new Date().getFullYear()) {
  const safePrefix = normalizePrefix(prefix);
  const targetYear = Number.isInteger(Number(year)) ? Number(year) : new Date().getFullYear();
  const stem = `${safePrefix}-${targetYear}-`;
  const matcher = new RegExp(`^${escapeRegex(stem)}(\\d+)$`);

  const existing = await Receipt.find({ receiptNumber: { $regex: matcher } })
    .select('receiptNumber')
    .lean();

  let maxSequence = 0;
  for (const doc of existing) {
    const match = matcher.exec(doc.receiptNumber);
    if (match) {
      const seq = Number.parseInt(match[1], 10);
      if (Number.isFinite(seq) && seq > maxSequence) {
        maxSequence = seq;
      }
    }
  }

  const nextSequence = String(maxSequence + 1).padStart(4, '0');
  return `${stem}${nextSequence}`;
}
