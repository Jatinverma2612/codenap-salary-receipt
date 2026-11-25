import fs from 'fs/promises';
import CompanySettings from '../models/CompanySettings.js';
import { ApiError } from '../middleware/errorMiddleware.js';
import {
  deleteLogoFile,
  detectImageType,
  resolveSafeUploadPath,
  saveLogoFile,
} from '../middleware/uploadMiddleware.js';
import { validateCompanyPayload } from '../middleware/validateMiddleware.js';

const LOGO_SLOTS = {
  software: {
    pathKey: 'logoPath',
    urlKey: 'logoUrl',
    mimeKey: 'logoMimeType',
    dataKey: 'logoData',
    endpointUrl: '/api/company/logo',
    label: 'software logo',
  },
  receipt: {
    pathKey: 'receiptLogoPath',
    urlKey: 'receiptLogoUrl',
    mimeKey: 'receiptLogoMimeType',
    dataKey: 'receiptLogoData',
    endpointUrl: '/api/company/receipt-logo',
    label: 'receipt logo',
  },
};

/**
 * Retrieves the singleton company settings document, creating Codenap defaults on first run.
 */
export async function getOrCreateCompanySettings() {
  return CompanySettings.findOneAndUpdate(
    { settingsKey: 'default' },
    {
      $setOnInsert: {
        settingsKey: 'default',
        companyName: 'Codenap IT Services Private Limited',
        tagline: 'PROFESSIONAL IT SERVICES',
        address: '',
        contactEmail: 'info@codenap.co.in',
        website: 'https://codenap.in/',
        signatoryName: 'Authorized Signatory',
        receiptPrefix: 'CNP',
      },
    },
    { new: true, upsert: true }
  );
}

/**
 * Strips internal storage paths when returning company settings to clients.
 */
function serializeCompany(company) {
  return {
    id: company._id.toString(),
    companyName: company.companyName,
    tagline: company.tagline,
    address: company.address,
    contactEmail: company.contactEmail || 'info@codenap.co.in',
    website: company.website || 'https://codenap.in/',
    signatoryName: company.signatoryName,
    receiptPrefix: company.receiptPrefix,
    logoUrl: company.logoUrl,
    logoMimeType: company.logoMimeType,
    logoData: company.logoData,
    receiptLogoUrl: company.receiptLogoUrl,
    receiptLogoMimeType: company.receiptLogoMimeType,
    receiptLogoData: company.receiptLogoData,
    updatedAt: company.updatedAt,
  };
}

/**
 * Clears local file metadata for a logo slot if its URL is cleared or replaced by an external URL.
 */
async function clearSlotIfUrlOverridden(company, updates, slot) {
  if (updates[slot.urlKey] !== undefined && updates[slot.urlKey] !== slot.endpointUrl) {
    const previousPath = company[slot.pathKey];
    company[slot.pathKey] = '';
    company[slot.mimeKey] = '';
    company[slot.dataKey] = '';
    if (previousPath) {
      await deleteLogoFile(previousPath);
    }
  }
}

/**
 * Shared handler for uploading and validating either the software or receipt logo.
 */
async function uploadLogoForSlot(slot, req, res, next) {
  try {
    if (!req.file?.buffer) {
      throw new ApiError(400, `Please select a PNG, JPEG, or WEBP ${slot.label} to upload.`);
    }

    const detected = detectImageType(req.file.buffer);
    if (!detected) {
      throw new ApiError(400, 'Uploaded file content is not a valid PNG, JPEG, or WEBP image.');
    }

    const company = await getOrCreateCompanySettings();
    const previousPath = company[slot.pathKey];

    const newFilename = await saveLogoFile(req.file.buffer, detected.ext);
    const base64DataUri = `data:${detected.mimeType};base64,${req.file.buffer.toString('base64')}`;

    company[slot.pathKey] = newFilename;
    company[slot.mimeKey] = detected.mimeType;
    company[slot.urlKey] = slot.endpointUrl;
    company[slot.dataKey] = base64DataUri;
    await company.save();

    if (previousPath && previousPath !== newFilename) {
      await deleteLogoFile(previousPath);
    }

    res.json({
      success: true,
      company: serializeCompany(company),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Shared handler for securely serving either the software or receipt logo to authenticated users.
 */
async function getLogoForSlot(slot, res, next) {
  try {
    const company = await getOrCreateCompanySettings();

    if (company[slot.pathKey]) {
      try {
        const { resolved } = resolveSafeUploadPath(company[slot.pathKey]);
        const fileBuffer = await fs.readFile(resolved);
        res.setHeader('Content-Type', company[slot.mimeKey] || 'image/png');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(fileBuffer);
      } catch (err) {
        if (err.code !== 'ENOENT') {
          throw err;
        }
      }
    }

    if (company[slot.dataKey] && company[slot.mimeKey]) {
      const prefix = `data:${company[slot.mimeKey]};base64,`;
      if (company[slot.dataKey].startsWith(prefix)) {
        const buffer = Buffer.from(company[slot.dataKey].slice(prefix.length), 'base64');
        res.setHeader('Content-Type', company[slot.mimeKey]);
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cache-Control', 'no-store');
        return res.send(buffer);
      }
    }

    throw new ApiError(404, `No uploaded ${slot.label} found.`);
  } catch (err) {
    next(err);
  }
}

/**
 * Shared handler for resetting either the software or receipt logo.
 */
async function resetLogoForSlot(slot, res, next) {
  try {
    const company = await getOrCreateCompanySettings();
    const previousPath = company[slot.pathKey];

    company[slot.pathKey] = '';
    company[slot.urlKey] = '';
    company[slot.mimeKey] = '';
    company[slot.dataKey] = '';
    await company.save();

    if (previousPath) {
      await deleteLogoFile(previousPath);
    }

    res.json({
      success: true,
      company: serializeCompany(company),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Returns Codenap company details and custom logo information.
 */
export async function getCompanySettings(_req, res, next) {
  try {
    const company = await getOrCreateCompanySettings();
    res.json({
      success: true,
      company: serializeCompany(company),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates Codenap company profile details and optional external HTTPS logo URLs.
 */
export async function updateCompanySettings(req, res, next) {
  try {
    const updates = validateCompanyPayload(req.body);
    const company = await getOrCreateCompanySettings();

    Object.assign(company, updates);
    await clearSlotIfUrlOverridden(company, updates, LOGO_SLOTS.software);
    await clearSlotIfUrlOverridden(company, updates, LOGO_SLOTS.receipt);

    await company.save();

    res.json({
      success: true,
      company: serializeCompany(company),
    });
  } catch (err) {
    next(err);
  }
}

export function uploadCompanyLogo(req, res, next) {
  return uploadLogoForSlot(LOGO_SLOTS.software, req, res, next);
}

export function getCompanyLogo(_req, res, next) {
  return getLogoForSlot(LOGO_SLOTS.software, res, next);
}

export function resetCompanyLogo(_req, res, next) {
  return resetLogoForSlot(LOGO_SLOTS.software, res, next);
}

export function uploadReceiptLogo(req, res, next) {
  return uploadLogoForSlot(LOGO_SLOTS.receipt, req, res, next);
}

export function getReceiptLogo(_req, res, next) {
  return getLogoForSlot(LOGO_SLOTS.receipt, res, next);
}

export function resetReceiptLogo(_req, res, next) {
  return resetLogoForSlot(LOGO_SLOTS.receipt, res, next);
}
