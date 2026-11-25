import mongoose from 'mongoose';
import { ApiError } from './errorMiddleware.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_RECIPIENT_TYPES = new Set(['intern', 'worker', 'employee']);
const ALLOWED_PAYMENT_MODES = new Set(['Bank Transfer', 'UPI', 'Cash']);

/**
 * Escapes special regular-expression characters in user-supplied search strings.
 */
export function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Rejects payloads containing MongoDB operator keys (e.g., keys starting with '$' or containing '.').
 */
function assertNoMongoOperators(value) {
  if (Array.isArray(value)) {
    value.forEach(assertNoMongoOperators);
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, nested] of Object.entries(value)) {
      if (key.startsWith('$') || key.includes('.')) {
        throw new ApiError(400, 'Invalid field key in request payload.');
      }
      assertNoMongoOperators(nested);
    }
  }
}

/**
 * Middleware validating that a route parameter is a valid MongoDB ObjectId.
 */
export function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const id = req.params?.[paramName];
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return next(new ApiError(400, `Invalid ${paramName} identifier.`));
    }
    return next();
  };
}

/**
 * Middleware rejecting any request body or query keys that contain MongoDB query operators.
 */
export function sanitizeRequestKeys(req, _res, next) {
  try {
    assertNoMongoOperators(req.body);
    assertNoMongoOperators(req.query);
    return next();
  } catch (err) {
    return next(err);
  }
}

/**
 * Parses and validates a required trimmed string field.
 */
function parseRequiredString(value, fieldName, { min = 1, max = 200 } = {}) {
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length < min || trimmed.length > max) {
    throw new ApiError(400, `${fieldName} must be between ${min} and ${max} characters.`);
  }
  return trimmed;
}

/**
 * Parses an optional trimmed string field.
 */
function parseOptionalString(value, fieldName, { max = 300, defaultValue = '' } = {}) {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  if (typeof value !== 'string') {
    throw new ApiError(400, `${fieldName} must be a string.`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) {
    throw new ApiError(400, `${fieldName} cannot exceed ${max} characters.`);
  }
  return trimmed;
}

/**
 * Validates login request fields.
 */
export function validateLoginPayload(body) {
  const email = parseRequiredString(body?.email, 'Email', { min: 3, max: 254 }).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  if (typeof body?.password !== 'string' || body.password.length === 0 || body.password.length > 128) {
    throw new ApiError(400, 'Password is required.');
  }

  return { email, password: body.password };
}

/**
 * Validates initial development admin setup request fields.
 */
export function validateSetupPayload(body) {
  const name = parseRequiredString(body?.name, 'Name', { min: 2, max: 100 });
  const email = parseRequiredString(body?.email, 'Email', { min: 3, max: 254 }).toLowerCase();
  if (!EMAIL_REGEX.test(email)) {
    throw new ApiError(400, 'Please enter a valid email address.');
  }
  if (typeof body?.password !== 'string' || body.password.length < 8 || body.password.length > 128) {
    throw new ApiError(400, 'Password must be between 8 and 128 characters.');
  }

  return { name, email, password: body.password };
}

/**
 * Validates a logo URL allowing only an internal endpoint prefix or HTTPS URL.
 */
function parseSafeLogoUrl(rawValue, internalPrefix, fieldLabel) {
  const logoUrl = parseOptionalString(rawValue, fieldLabel, { max: 500 });
  if (logoUrl) {
    const isSafeRelative = logoUrl.startsWith(internalPrefix);
    let isSafeHttps = false;
    try {
      const parsed = new URL(logoUrl);
      isSafeHttps = parsed.protocol === 'https:';
    } catch {
      isSafeHttps = false;
    }
    if (!isSafeRelative && !isSafeHttps) {
      throw new ApiError(400, `${fieldLabel} must be an HTTPS URL or an internal uploaded logo path.`);
    }
  }
  return logoUrl;
}

/**
 * Validates allow-listed company settings fields on update.
 */
export function validateCompanyPayload(body) {
  const updates = {};

  if (body?.companyName !== undefined) {
    updates.companyName = parseRequiredString(body.companyName, 'Company name', { min: 2, max: 150 });
  }
  if (body?.tagline !== undefined) {
    updates.tagline = parseOptionalString(body.tagline, 'Tagline', { max: 200 });
  }
  if (body?.address !== undefined) {
    updates.address = parseOptionalString(body.address, 'Address', { max: 400 });
  }
  if (body?.contactEmail !== undefined) {
    const email = parseOptionalString(body.contactEmail, 'Contact email', { max: 254 }).toLowerCase();
    if (email && !EMAIL_REGEX.test(email)) {
      throw new ApiError(400, 'Contact email must be a valid email address.');
    }
    updates.contactEmail = email;
  }
  if (body?.website !== undefined) {
    const website = parseOptionalString(body.website, 'Website', { max: 255 });
    if (website) {
      let validProtocol = false;
      try {
        const parsed = new URL(website);
        validProtocol = parsed.protocol === 'https:' || parsed.protocol === 'http:';
      } catch {
        validProtocol = false;
      }
      if (!validProtocol) {
        throw new ApiError(400, 'Website must be a valid http:// or https:// URL.');
      }
    }
    updates.website = website;
  }
  if (body?.signatoryName !== undefined) {
    updates.signatoryName = parseOptionalString(body.signatoryName, 'Signatory name', { max: 120 });
  }
  if (body?.receiptPrefix !== undefined) {
    const prefix = parseRequiredString(body.receiptPrefix, 'Receipt prefix', { min: 1, max: 15 }).toUpperCase();
    if (!/^[A-Z0-9-]+$/.test(prefix)) {
      throw new ApiError(400, 'Receipt prefix may only contain letters, numbers, and hyphens.');
    }
    updates.receiptPrefix = prefix;
  }

  if (body?.logoUrl !== undefined) {
    updates.logoUrl = parseSafeLogoUrl(body.logoUrl, '/api/company/logo', 'Software logo URL');
  }
  if (body?.receiptLogoUrl !== undefined) {
    updates.receiptLogoUrl = parseSafeLogoUrl(
      body.receiptLogoUrl,
      '/api/company/receipt-logo',
      'Receipt logo URL'
    );
  }

  return updates;
}

/**
 * Validates and extracts receipt creation or update fields (partial mode supported for PATCH).
 */
export function validateReceiptPayload(body, { partial = false } = {}) {
  const data = {};

  if (!partial || body?.recipientType !== undefined) {
    const recipientType = typeof body?.recipientType === 'string' ? body.recipientType.trim().toLowerCase() : '';
    if (!ALLOWED_RECIPIENT_TYPES.has(recipientType)) {
      throw new ApiError(400, 'Recipient type must be intern, worker, or employee.');
    }
    data.recipientType = recipientType;
  }

  if (!partial || body?.employeeName !== undefined) {
    data.employeeName = parseRequiredString(body?.employeeName, 'Employee/Intern name', { min: 2, max: 120 });
  }

  if (!partial || body?.employeeId !== undefined) {
    data.employeeId = parseRequiredString(body?.employeeId, 'Employee/Intern ID', { min: 1, max: 40 }).toUpperCase();
  }

  if (!partial || body?.designation !== undefined) {
    data.designation = parseRequiredString(body?.designation, 'Designation', { min: 1, max: 100 });
  }

  if (body?.department !== undefined) {
    data.department = parseOptionalString(body.department, 'Department', { max: 100 });
  }

  if (body?.dateOfJoining !== undefined) {
    if (body.dateOfJoining === null || body.dateOfJoining === '') {
      data.dateOfJoining = null;
    } else {
      const joiningDate = new Date(body.dateOfJoining);
      if (Number.isNaN(joiningDate.getTime())) {
        throw new ApiError(400, 'Date of joining must be a valid date.');
      }
      data.dateOfJoining = joiningDate;
    }
  }

  if (!partial || body?.payPeriod !== undefined) {
    const month = Number(body?.payPeriod?.month);
    const year = Number(body?.payPeriod?.year);
    if (!Number.isInteger(month) || month < 1 || month > 12) {
      throw new ApiError(400, 'Pay period month must be an integer between 1 and 12.');
    }
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      throw new ApiError(400, 'Pay period year must be an integer between 2000 and 2100.');
    }
    const defaultLabel = new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
      month: 'long',
      year: 'numeric',
      timeZone: 'UTC',
    });
    const label = parseOptionalString(body?.payPeriod?.label, 'Pay period label', {
      max: 40,
      defaultValue: defaultLabel,
    }) || defaultLabel;

    data.payPeriod = { month, year, label };
  }

  if (!partial || body?.workingDays !== undefined) {
    const workingDays = Number(body?.workingDays);
    if (!Number.isFinite(workingDays) || workingDays < 1 || workingDays > 31) {
      throw new ApiError(400, 'Working days must be between 1 and 31.');
    }
    data.workingDays = workingDays;
  }

  if (!partial || body?.paidDays !== undefined) {
    const paidDays = Number(body?.paidDays);
    if (!Number.isFinite(paidDays) || paidDays < 0 || paidDays > 31) {
      throw new ApiError(400, 'Paid days must be between 0 and 31.');
    }
    data.paidDays = paidDays;
  }

  if (!partial || body?.monthlyAmount !== undefined) {
    const monthlyAmount = Number(body?.monthlyAmount);
    if (!Number.isFinite(monthlyAmount) || monthlyAmount < 0) {
      throw new ApiError(400, 'Monthly amount must be a non-negative number.');
    }
    data.monthlyAmount = monthlyAmount;
  }

  if (!partial || body?.deductions !== undefined) {
    const rawDeductions = body?.deductions ?? [];
    if (!Array.isArray(rawDeductions)) {
      throw new ApiError(400, 'Deductions must be an array.');
    }
    if (rawDeductions.length > 50) {
      throw new ApiError(400, 'Deductions cannot exceed 50 items.');
    }
    data.deductions = rawDeductions.map((item, idx) => {
      const label = parseRequiredString(item?.label, `Deduction #${idx + 1} label`, { min: 1, max: 80 });
      const amount = Number(item?.amount);
      if (!Number.isFinite(amount) || amount < 0) {
        throw new ApiError(400, `Deduction "${label}" amount must be a non-negative number.`);
      }
      return { label, amount };
    });
  }

  if (!partial || body?.paymentMode !== undefined) {
    const paymentMode = typeof body?.paymentMode === 'string' ? body.paymentMode.trim() : '';
    if (!ALLOWED_PAYMENT_MODES.has(paymentMode)) {
      throw new ApiError(400, 'Unsupported payment mode.');
    }
    data.paymentMode = paymentMode;
  }

  if (!partial || body?.paymentDate !== undefined) {
    const paymentDate = new Date(body?.paymentDate);
    if (Number.isNaN(paymentDate.getTime())) {
      throw new ApiError(400, 'Payment date must be a valid date.');
    }
    data.paymentDate = paymentDate;
  }

  if (body?.notes !== undefined) {
    data.notes = parseOptionalString(body.notes, 'Notes', { max: 300 });
  }

  return data;
}
