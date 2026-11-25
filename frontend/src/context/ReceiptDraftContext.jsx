import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { createReceipt } from '../api/receiptApi.js';
import { calculateLivePayroll } from '../utils/payrollMath.js';
import { useAuth } from './AuthContext.jsx';

const ReceiptDraftContext = createContext(null);

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMonthLabel(year, month) {
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString('en-US', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

function getLocalTodayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toDateInputValue(value) {
  if (!value) {
    return '';
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toISOString().slice(0, 10);
}

function getNextPayPeriod(payPeriod) {
  const baseMonth = Number(payPeriod?.month) || new Date().getMonth() + 1;
  const baseYear = Number(payPeriod?.year) || new Date().getFullYear();

  const nextMonth = baseMonth === 12 ? 1 : baseMonth + 1;
  const nextYear = baseMonth === 12 ? baseYear + 1 : baseYear;

  return {
    month: nextMonth,
    year: nextYear,
    label: getMonthLabel(nextYear, nextMonth),
  };
}

export function createInitialFormState() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const totalDays = getDaysInMonth(year, month);

  return {
    recipientType: 'intern',
    employeeName: '',
    employeeId: '',
    designation: '',
    department: '',
    dateOfJoining: '',
    payPeriod: {
      month,
      year,
      label: getMonthLabel(year, month),
    },
    workingDays: String(totalDays),
    paidDays: String(totalDays),
    monthlyAmount: '',
    deductions: [],
    paymentMode: 'Bank Transfer',
    paymentDate: getLocalTodayIso(),
    notes: '',
  };
}

const ALLOWED_PAYMENT_MODES = new Set(['Bank Transfer', 'UPI', 'Cash']);

function normalizePaymentMode(mode) {
  return ALLOWED_PAYMENT_MODES.has(mode) ? mode : 'Bank Transfer';
}

function createFormStateFromDuplicate(source) {
  const nextPeriod = getNextPayPeriod(source.payPeriod);
  const monthDays = getDaysInMonth(nextPeriod.year, nextPeriod.month);

  return {
    recipientType: source.recipientType || 'intern',
    employeeName: source.employeeName || '',
    employeeId: source.employeeId || '',
    designation: source.designation || '',
    department: source.department || '',
    dateOfJoining: toDateInputValue(source.dateOfJoining),
    payPeriod: nextPeriod,
    workingDays: String(monthDays),
    paidDays: String(monthDays),
    monthlyAmount: source.monthlyAmount !== undefined ? String(source.monthlyAmount) : '',
    deductions: Array.isArray(source.deductions)
      ? source.deductions.map((item) => ({
          label: item.label || '',
          amount: item.amount !== undefined ? String(item.amount) : '',
        }))
      : [],
    paymentMode: normalizePaymentMode(source.paymentMode),
    paymentDate: getLocalTodayIso(),
    notes: source.notes || '',
  };
}

export function ReceiptDraftProvider({ children }) {
  const { user } = useAuth();
  const [formData, setFormData] = useState(createInitialFormState);
  const [duplicateNotice, setDuplicateNotice] = useState('');

  // Clear any sensitive payroll draft data when the user logs out.
  useEffect(() => {
    if (!user) {
      setFormData(createInitialFormState());
      setDuplicateNotice('');
    }
  }, [user]);

  const payrollPreview = useMemo(
    () =>
      calculateLivePayroll({
        monthlyAmount: formData.monthlyAmount,
        workingDays: formData.workingDays,
        paidDays: formData.paidDays,
        deductions: formData.deductions,
      }),
    [formData.monthlyAmount, formData.workingDays, formData.paidDays, formData.deductions]
  );

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updatePayPeriod = useCallback((part, rawValue) => {
    setFormData((prev) => {
      const nextPeriod = { ...prev.payPeriod, [part]: rawValue };
      const parsedYear = Number(nextPeriod.year);
      const parsedMonth = Number(nextPeriod.month);
      const hasValidYear = Number.isInteger(parsedYear) && parsedYear >= 2000 && parsedYear <= 2100;
      const hasValidMonth = Number.isInteger(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12;

      if (!hasValidYear || !hasValidMonth) {
        return {
          ...prev,
          payPeriod: nextPeriod,
        };
      }

      const monthDays = getDaysInMonth(parsedYear, parsedMonth);
      nextPeriod.month = parsedMonth;
      nextPeriod.label = getMonthLabel(parsedYear, parsedMonth);

      return {
        ...prev,
        payPeriod: nextPeriod,
        workingDays: String(monthDays),
        paidDays:
          Number(prev.paidDays) > monthDays || Number(prev.paidDays) === Number(prev.workingDays)
            ? String(monthDays)
            : prev.paidDays,
      };
    });
  }, []);

  const updateDeductions = useCallback((nextDeductions) => {
    setFormData((prev) => ({ ...prev, deductions: nextDeductions }));
  }, []);

  const resetDraft = useCallback(() => {
    setFormData(createInitialFormState());
    setDuplicateNotice('');
  }, []);

  const loadDuplicateDraft = useCallback((source) => {
    if (!source) {
      return;
    }
    const nextDraft = createFormStateFromDuplicate(source);
    setFormData(nextDraft);
    setDuplicateNotice(
      `Duplicated details from ${source.receiptNumber} for ${nextDraft.payPeriod.label}. Review working/paid days or deductions before saving.`
    );
  }, []);

  const applyRecipientTemplate = useCallback((source) => {
    if (!source) {
      return;
    }
    setFormData((prev) => ({
      ...prev,
      recipientType: source.recipientType || prev.recipientType,
      employeeName: source.employeeName || '',
      employeeId: source.employeeId || '',
      designation: source.designation || '',
      department: source.department || '',
      dateOfJoining: toDateInputValue(source.dateOfJoining),
      monthlyAmount:
        source.monthlyAmount !== undefined ? String(source.monthlyAmount) : prev.monthlyAmount,
      paymentMode: normalizePaymentMode(source.paymentMode),
    }));
  }, []);

  const validateAndBuildPayload = useCallback(() => {
    if (!formData.employeeName.trim() || formData.employeeName.trim().length < 2) {
      throw new Error('Recipient full name must be at least 2 characters.');
    }
    if (!formData.employeeId.trim()) {
      throw new Error('Employee / Intern ID is required.');
    }
    if (!formData.designation.trim()) {
      throw new Error('Role / Designation is required.');
    }

    const payYear = Number(formData.payPeriod?.year);
    const payMonth = Number(formData.payPeriod?.month);
    if (!Number.isInteger(payMonth) || payMonth < 1 || payMonth > 12) {
      throw new Error('Pay period month must be between 1 and 12.');
    }
    if (!Number.isInteger(payYear) || payYear < 2000 || payYear > 2100) {
      throw new Error('Pay period year must be a valid 4-digit year (2000–2100).');
    }

    if (formData.monthlyAmount === '' || Number(formData.monthlyAmount) < 0) {
      throw new Error('Please enter a valid monthly stipend or salary amount.');
    }
    if (payrollPreview.exceedsWorkingDays) {
      throw new Error('Paid days cannot exceed total working days.');
    }
    if (!formData.paymentDate) {
      throw new Error('Payment date is required.');
    }

    const cleanedDeductions = [];
    for (let i = 0; i < formData.deductions.length; i += 1) {
      const row = formData.deductions[i];
      const label = (row.label || '').trim();
      const amount = Number(row.amount || 0);
      if (!label && !row.amount) {
        continue;
      }
      if (!label) {
        throw new Error(`Please enter a label for Deduction #${i + 1}.`);
      }
      if (!Number.isFinite(amount) || amount < 0) {
        throw new Error(`Deduction "${label}" must be a non-negative amount.`);
      }
      cleanedDeductions.push({ label, amount });
    }

    return {
      recipientType: formData.recipientType,
      employeeName: formData.employeeName.trim(),
      employeeId: formData.employeeId.trim().toUpperCase(),
      designation: formData.designation.trim(),
      department: formData.department.trim(),
      dateOfJoining: formData.dateOfJoining || null,
      payPeriod: {
        month: payMonth,
        year: payYear,
        label: getMonthLabel(payYear, payMonth),
      },
      workingDays: Number(formData.workingDays),
      paidDays: Number(formData.paidDays),
      monthlyAmount: Number(formData.monthlyAmount),
      deductions: cleanedDeductions,
      paymentMode: formData.paymentMode,
      paymentDate: formData.paymentDate,
      notes: formData.notes.trim(),
    };
  }, [formData, payrollPreview.exceedsWorkingDays]);

  const saveDraftReceipt = useCallback(async () => {
    const payload = validateAndBuildPayload();
    const data = await createReceipt(payload);
    setFormData(createInitialFormState());
    setDuplicateNotice('');
    return data.receipt;
  }, [validateAndBuildPayload]);

  return (
    <ReceiptDraftContext.Provider
      value={{
        formData,
        payrollPreview,
        duplicateNotice,
        setDuplicateNotice,
        updateField,
        updatePayPeriod,
        updateDeductions,
        resetDraft,
        loadDuplicateDraft,
        applyRecipientTemplate,
        saveDraftReceipt,
      }}
    >
      {children}
    </ReceiptDraftContext.Provider>
  );
}

export function useReceiptDraft() {
  const ctx = useContext(ReceiptDraftContext);
  if (!ctx) {
    throw new Error('useReceiptDraft must be used inside a ReceiptDraftProvider.');
  }
  return ctx;
}
