const ONES = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
];

const TENS = [
  '',
  '',
  'Twenty',
  'Thirty',
  'Forty',
  'Fifty',
  'Sixty',
  'Seventy',
  'Eighty',
  'Ninety',
];

const SAFE_DATA_IMAGE_REGEX = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;

const inrCurrencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const inrWholeNumberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const inrDecimalNumberFormatter = new Intl.NumberFormat('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Formats a numeric value in standard Indian Rupee notation (e.g., ₹25,400.00).
 */
export function formatINR(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return inrCurrencyFormatter.format(0);
  }
  return inrCurrencyFormatter.format(numeric);
}

/**
 * Formats a numeric INR amount cleanly without trailing .00 on whole rupees (e.g., 30,000 or 12,692.31).
 */
export function formatINRNumber(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) {
    return '0';
  }
  const rounded = Math.round((numeric + Number.EPSILON) * 100) / 100;
  return Number.isInteger(rounded)
    ? inrWholeNumberFormatter.format(rounded)
    : inrDecimalNumberFormatter.format(rounded);
}

function underThousandToWords(num) {
  const parts = [];
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    parts.push(`${ONES[hundreds]} Hundred`);
  }

  if (remainder > 0) {
    if (remainder < 20) {
      parts.push(ONES[remainder]);
    } else {
      const tensDigit = Math.floor(remainder / 10);
      const onesDigit = remainder % 10;
      parts.push(onesDigit > 0 ? `${TENS[tensDigit]} ${ONES[onesDigit]}` : TENS[tensDigit]);
    }
  }

  return parts.join(' ');
}

function integerToIndianWords(num) {
  if (num === 0) {
    return 'Zero';
  }

  const parts = [];
  const crores = Math.floor(num / 10000000);
  const lakhs = Math.floor((num % 10000000) / 100000);
  const thousands = Math.floor((num % 100000) / 1000);
  const rest = num % 1000;

  if (crores > 0) {
    parts.push(`${integerToIndianWords(crores)} Crore`);
  }
  if (lakhs > 0) {
    parts.push(`${underThousandToWords(lakhs)} Lakh`);
  }
  if (thousands > 0) {
    parts.push(`${underThousandToWords(thousands)} Thousand`);
  }
  if (rest > 0) {
    parts.push(underThousandToWords(rest));
  }

  return parts.join(' ');
}

/**
 * Converts a numeric INR amount into Indian English currency words for live preview.
 */
export function formatINRWords(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    return 'Rupees Zero Only';
  }

  const totalPaise = Math.round((numeric + Number.EPSILON) * 100);
  const rupees = Math.floor(totalPaise / 100);
  const paise = totalPaise % 100;

  if (rupees === 0 && paise === 0) {
    return 'Rupees Zero Only';
  }
  if (rupees > 0 && paise === 0) {
    return `Rupees ${integerToIndianWords(rupees)} Only`;
  }
  if (rupees === 0 && paise > 0) {
    return `Paise ${integerToIndianWords(paise)} Only`;
  }

  return `Rupees ${integerToIndianWords(rupees)} and Paise ${integerToIndianWords(paise)} Only`;
}

/**
 * Validates that a company logo image source uses an allowed internal path, HTTPS URL, or raster base64 URI.
 */
export function isSafeLogoSrc(src) {
  if (typeof src !== 'string') {
    return false;
  }
  const trimmed = src.trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.startsWith('/api/company/logo') || trimmed.startsWith('/api/company/receipt-logo')) {
    return true;
  }
  if (SAFE_DATA_IMAGE_REGEX.test(trimmed)) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Returns a safe http/https URL for clickable website links, or empty string if unsafe.
 */
export function getSafeExternalHref(url) {
  if (typeof url !== 'string') {
    return '';
  }
  const trimmed = url.trim();
  if (!trimmed) {
    return '';
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'https:' || parsed.protocol === 'http:') {
      return parsed.href;
    }
    return '';
  } catch {
    return '';
  }
}

/**
 * Returns a safe mailto: URI for clickable footer emails, or empty string if invalid.
 */
export function getSafeMailtoHref(email) {
  if (typeof email !== 'string') {
    return '';
  }
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return '';
  }
  return `mailto:${trimmed}`;
}
