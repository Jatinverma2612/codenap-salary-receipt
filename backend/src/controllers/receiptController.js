import Receipt from '../models/Receipt.js';
import { ApiError } from '../middleware/errorMiddleware.js';
import {
  escapeRegex,
  validateReceiptPayload,
} from '../middleware/validateMiddleware.js';
import { inrToWords } from '../utils/inrToWords.js';
import { calculatePayroll } from '../utils/payrollCalculator.js';
import { generateReceiptNumber } from '../utils/receiptNumber.js';
import { getOrCreateCompanySettings } from './companyController.js';

const ALLOWED_RECIPIENT_FILTERS = new Set(['intern', 'worker', 'employee']);

/**
 * Builds the company branding snapshot stored with each newly created receipt.
 */
function buildLogoSnapshot(company) {
  return {
    companyName: company.companyName,
    tagline: company.tagline,
    address: company.address,
    contactEmail: company.contactEmail || 'info@codenap.co.in',
    website: company.website || 'https://codenap.in/',
    signatoryName: company.signatoryName,
    logoUrl: company.logoUrl,
    logoData: company.logoData,
    receiptLogoUrl: company.receiptLogoUrl || '',
    receiptLogoData: company.receiptLogoData || '',
  };
}

/**
 * Lists saved receipts with optional text search, month/year filter, recipientType filter, and pagination.
 */
export async function listReceipts(req, res, next) {
  try {
    const filter = {};
    const search = typeof req.query.q === 'string'
      ? req.query.q.trim()
      : typeof req.query.search === 'string'
        ? req.query.search.trim()
        : '';

    if (search) {
      if (search.length > 100) {
        throw new ApiError(400, 'Search query cannot exceed 100 characters.');
      }
      const regex = new RegExp(escapeRegex(search), 'i');
      filter.$or = [
        { receiptNumber: regex },
        { employeeName: regex },
        { employeeId: regex },
        { designation: regex },
        { department: regex },
      ];
    }

    if (req.query.month !== undefined && req.query.month !== '') {
      const month = Number(req.query.month);
      if (!Number.isInteger(month) || month < 1 || month > 12) {
        throw new ApiError(400, 'Month filter must be an integer between 1 and 12.');
      }
      filter['payPeriod.month'] = month;
    }

    if (req.query.year !== undefined && req.query.year !== '') {
      const year = Number(req.query.year);
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        throw new ApiError(400, 'Year filter must be an integer between 2000 and 2100.');
      }
      filter['payPeriod.year'] = year;
    }

    if (req.query.recipientType !== undefined && req.query.recipientType !== '') {
      const recipientType = String(req.query.recipientType).trim().toLowerCase();
      if (!ALLOWED_RECIPIENT_FILTERS.has(recipientType)) {
        throw new ApiError(400, 'Invalid recipientType filter.');
      }
      filter.recipientType = recipientType;
    }

    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(req.query.limit, 10) || 20));
    const skip = (page - 1) * limit;

    const [receipts, total] = await Promise.all([
      Receipt.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Receipt.countDocuments(filter),
    ]);

    res.json({
      success: true,
      receipts,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Fetches a single saved receipt by its MongoDB ID.
 */
export async function getReceiptById(req, res, next) {
  try {
    const receipt = await Receipt.findById(req.params.id).lean();
    if (!receipt) {
      throw new ApiError(404, 'Receipt not found.');
    }

    res.json({
      success: true,
      receipt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Calculates payroll authoritatively server-side and saves a new receipt with logo snapshot.
 */
export async function createReceipt(req, res, next) {
  try {
    const data = validateReceiptPayload(req.body, { partial: false });
    const payroll = calculatePayroll({
      monthlyAmount: data.monthlyAmount,
      workingDays: data.workingDays,
      paidDays: data.paidDays,
      deductions: data.deductions,
    });
    const amountInWords = inrToWords(payroll.netPayable);
    const company = await getOrCreateCompanySettings();
    const logoSnapshot = buildLogoSnapshot(company);

    // Retry receipt number generation if a concurrent request claims the same sequence.
    let createdReceipt = null;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const receiptNumber = await generateReceiptNumber(company.receiptPrefix, data.payPeriod.year);
      try {
        createdReceipt = await Receipt.create({
          receiptNumber,
          recipientType: data.recipientType,
          employeeName: data.employeeName,
          employeeId: data.employeeId,
          designation: data.designation,
          department: data.department ?? '',
          dateOfJoining: data.dateOfJoining ?? null,
          payPeriod: data.payPeriod,
          workingDays: payroll.workingDays,
          paidDays: payroll.paidDays,
          monthlyAmount: payroll.monthlyAmount,
          grossEarnings: payroll.grossEarnings,
          deductions: payroll.deductions,
          totalDeductions: payroll.totalDeductions,
          netPayable: payroll.netPayable,
          amountInWords,
          paymentMode: data.paymentMode,
          paymentDate: data.paymentDate,
          notes: data.notes ?? '',
          logoSnapshot,
          createdBy: req.user?.id || null,
        });
        break;
      } catch (err) {
        if (err?.code === 11000 && attempt < 2) {
          continue;
        }
        throw err;
      }
    }

    res.status(201).json({
      success: true,
      receipt: createdReceipt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Updates an existing receipt and recalculates earnings, deductions, net payable, and INR words server-side.
 */
export async function updateReceipt(req, res, next) {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      throw new ApiError(404, 'Receipt not found.');
    }

    const isPartial = req.method === 'PATCH';
    const updates = validateReceiptPayload(req.body, { partial: isPartial });

    const payroll = calculatePayroll({
      monthlyAmount: updates.monthlyAmount ?? receipt.monthlyAmount,
      workingDays: updates.workingDays ?? receipt.workingDays,
      paidDays: updates.paidDays ?? receipt.paidDays,
      deductions: updates.deductions ?? receipt.deductions,
    });
    const amountInWords = inrToWords(payroll.netPayable);

    Object.assign(receipt, updates, {
      workingDays: payroll.workingDays,
      paidDays: payroll.paidDays,
      monthlyAmount: payroll.monthlyAmount,
      grossEarnings: payroll.grossEarnings,
      deductions: payroll.deductions,
      totalDeductions: payroll.totalDeductions,
      netPayable: payroll.netPayable,
      amountInWords,
    });

    await receipt.save();

    res.json({
      success: true,
      receipt,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Deletes a saved receipt from MongoDB by ID.
 */
export async function deleteReceipt(req, res, next) {
  try {
    const deleted = await Receipt.findByIdAndDelete(req.params.id).lean();
    if (!deleted) {
      throw new ApiError(404, 'Receipt not found.');
    }

    res.json({
      success: true,
      message: 'Receipt deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
}
