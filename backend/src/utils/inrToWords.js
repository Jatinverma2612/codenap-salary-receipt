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

/**
 * Converts a non-negative integer (< 1000) into English words.
 */
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

/**
 * Converts a non-negative integer using the Indian numbering system (Thousands, Lakhs, Crores).
 */
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
    // Recurse for 100+ Crore amounts cleanly.
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
 * Converts a numeric INR amount into Indian English currency words (Rupees & optional Paise).
 */
export function inrToWords(amount) {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric) || numeric < 0) {
    throw new RangeError('INR amount must be a non-negative finite number.');
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
