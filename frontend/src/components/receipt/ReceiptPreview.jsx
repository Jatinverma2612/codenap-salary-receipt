import { useEffect, useState } from 'react';
import {
  formatINRNumber,
  formatINRWords,
  getSafeExternalHref,
  getSafeMailtoHref,
  isSafeLogoSrc,
} from '../../utils/inrFormat.js';

const SLIP_HEADERS = {
  intern: {
    docTitle: 'STIPEND SLIP',
    statementPrefix: 'Stipend Statement',
    sectionTitle: 'INTERN INFORMATION',
    nameLabel: 'Intern Name',
    idLabel: 'Intern ID',
    monthlyLabel: 'Monthly Stipend',
    netLabel: 'NET STIPEND PAYABLE',
    footerWord: 'stipend slip',
  },
  worker: {
    docTitle: 'PAYOUT SLIP',
    statementPrefix: 'Payout Statement',
    sectionTitle: 'WORKER INFORMATION',
    nameLabel: 'Worker Name',
    idLabel: 'Worker ID',
    monthlyLabel: 'Monthly Stipend',
    netLabel: 'NET PAYABLE',
    footerWord: 'payout slip',
  },
  employee: {
    docTitle: 'SALARY SLIP',
    statementPrefix: 'Salary Statement',
    sectionTitle: 'EMPLOYEE INFORMATION',
    nameLabel: 'Employee Name',
    idLabel: 'Employee ID',
    monthlyLabel: 'Monthly Salary',
    netLabel: 'NET SALARY PAYABLE',
    footerWord: 'salary slip',
  },
};

function formatSlashDate(value) {
  if (!value) {
    return '—';
  }
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    const [year, month, day] = value.trim().split('-');
    return `${day}/${month}/${year}`;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export default function ReceiptPreview({
  receipt,
  formData,
  payrollPreview,
  company,
  receiptLogoSrc,
  savedReceipt,
}) {
  const activeSaved = receipt || savedReceipt || null;
  const source = activeSaved || formData || {};
  const labels = SLIP_HEADERS[source.recipientType] || SLIP_HEADERS.employee;

  const displayCompanyName =
    activeSaved?.logoSnapshot?.companyName ||
    company?.companyName ||
    'Codenap IT Services Private Limited';
  const displayTagline =
    activeSaved?.logoSnapshot?.tagline || company?.tagline || 'PROFESSIONAL IT SERVICES';
  const displayEmail =
    activeSaved?.logoSnapshot?.contactEmail || company?.contactEmail || 'info@codenap.co.in';
  const displayWebsite =
    activeSaved?.logoSnapshot?.website || company?.website || 'https://codenap.in/';

  const emailHref = getSafeMailtoHref(displayEmail);
  const websiteHref = getSafeExternalHref(displayWebsite);

  // Use the archived receipt-logo snapshot on saved receipts; otherwise use live receiptLogoSrc.
  let resolvedLogo = '';
  if (activeSaved) {
    const snapshotCandidate =
      activeSaved.logoSnapshot?.receiptLogoData ||
      activeSaved.logoSnapshot?.receiptLogoUrl ||
      '';
    resolvedLogo = isSafeLogoSrc(snapshotCandidate) ? snapshotCandidate : '';
  } else {
    resolvedLogo = isSafeLogoSrc(receiptLogoSrc) ? receiptLogoSrc : '';
  }

  const [logoLoadFailed, setLogoLoadFailed] = useState(false);
  useEffect(() => {
    setLogoLoadFailed(false);
  }, [resolvedLogo]);

  const periodLabel =
    source.payPeriod?.label ||
    (source.payPeriod?.month && source.payPeriod?.year
      ? `${source.payPeriod.month}/${source.payPeriod.year}`
      : '—');

  const grossEarnings = activeSaved
    ? activeSaved.grossEarnings
    : (payrollPreview?.grossEarnings ?? 0);
  const totalDeductions = activeSaved
    ? activeSaved.totalDeductions
    : (payrollPreview?.totalDeductions ?? 0);
  const netPayable = activeSaved
    ? activeSaved.netPayable
    : (payrollPreview?.netPayable ?? 0);
  const amountInWords = activeSaved
    ? activeSaved.amountInWords
    : formatINRWords(netPayable);

  const validDeductions = (source.deductions || []).filter(
    (item) => item?.label?.trim() || Number(item?.amount) > 0
  );

  const isProrated =
    Number(source.workingDays) > 0 && Number(source.paidDays) !== Number(source.workingDays);

  return (
    <div className="receipt-sheet overflow-hidden rounded-xl border border-codenap-borderStrong bg-white shadow-receipt print:rounded-lg print:border-slate-300 print:shadow-none">
      {/* Two-Tier Deep Navy Header matching Reference Slip */}
      <div className="bg-[#112A4A] px-7 py-6 text-white print:px-6 print:py-5">
        {/* Tier 1: Dynamic Receipt Logo + Slip Title */}
        <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-4">
          <div className="flex items-center">
            {resolvedLogo && !logoLoadFailed ? (
              <div className="inline-flex items-center rounded bg-white px-2.5 py-1.5">
                <img
                  src={resolvedLogo}
                  alt={displayCompanyName}
                  onError={() => setLogoLoadFailed(true)}
                  className="max-h-11 max-w-[190px] object-contain"
                />
              </div>
            ) : (
              <div>
                <p className="text-xl font-bold tracking-wider text-white">CODENAP</p>
                <p className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.14em] text-slate-300">
                  {displayTagline}
                </p>
              </div>
            )}
          </div>

          <div className="text-right">
            <p className="text-base font-bold uppercase tracking-wide text-white sm:text-lg">
              {labels.docTitle}
            </p>
            <p className="mt-0.5 text-[11px] font-medium uppercase tracking-[0.12em] text-slate-300">
              CONFIDENTIAL
            </p>
          </div>
        </div>

        {/* Tier 2: Legal Company Name + Statement Period & Receipt Ref */}
        <div className="flex flex-col justify-between gap-1.5 pt-4 sm:flex-row sm:items-end print:flex-row print:items-end">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wide text-white sm:text-base">
              {displayCompanyName}
            </h2>
            <p className="mt-0.5 text-xs text-slate-300">
              {labels.statementPrefix} &ndash; {periodLabel}
            </p>
          </div>

          {activeSaved?.receiptNumber ? (
            <p className="font-mono text-[11px] text-slate-300">
              Ref: <span className="font-semibold text-white">{activeSaved.receiptNumber}</span>
            </p>
          ) : null}
        </div>
      </div>

      {/* Receipt Document Body */}
      <div className="space-y-6 px-7 py-6 print:space-y-4 print:px-6 print:py-5">
        {/* Section 1: Recipient Information */}
        <section className="border-b border-slate-200 pb-5 print:pb-4">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-slate-800 print:mb-3">
            {labels.sectionTitle}
          </h3>

          <div className="grid grid-cols-2 gap-x-8 gap-y-4 print:gap-y-3">
            <div>
              <p className="text-xs text-slate-500">{labels.nameLabel}</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {source.employeeName || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">{labels.idLabel}</p>
              <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                {source.employeeId || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Designation</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {source.designation || '—'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Department</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {source.department || '—'}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Date of Joining</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatSlashDate(source.dateOfJoining)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Pay Period</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">{periodLabel}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Working Days</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {source.workingDays ?? 0}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Paid Days</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {source.paidDays ?? 0}
              </p>
            </div>
          </div>
        </section>

        {/* Section 2: Clean Single-Column Ledger Table */}
        <section>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
            {source.recipientType === 'employee' ? 'SALARY DETAILS' : 'STIPEND DETAILS'}
          </h3>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-300 text-xs font-semibold text-slate-500">
                <th className="py-2 text-left">Description</th>
                <th className="py-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="py-2.5 text-slate-800">{labels.monthlyLabel}</td>
                <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                  {formatINRNumber(source.monthlyAmount || 0)}
                </td>
              </tr>

              <tr>
                <td className="py-2.5 text-slate-800">
                  <span>Gross Earnings</span>
                  {isProrated ? (
                    <span className="ml-2 font-mono text-xs text-slate-500">
                      ({source.paidDays ?? 0} / {source.workingDays ?? 0} days)
                    </span>
                  ) : null}
                </td>
                <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                  {formatINRNumber(grossEarnings)}
                </td>
              </tr>

              <tr>
                <td colSpan={2} className="py-2.5 text-xs font-semibold text-slate-700">
                  Deductions
                </td>
              </tr>

              {validDeductions.length === 0 ? (
                <tr>
                  <td className="py-2.5 text-slate-700">Other Deductions (if applicable)</td>
                  <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">0</td>
                </tr>
              ) : (
                validDeductions.map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-2.5 text-slate-700">{item.label || 'Deduction'}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums text-slate-900">
                      {formatINRNumber(item.amount || 0)}
                    </td>
                  </tr>
                ))
              )}

              <tr>
                <td className="py-2.5 font-semibold text-slate-900">Total Deductions</td>
                <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-slate-900">
                  {formatINRNumber(totalDeductions)}
                </td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* Section 3: Solid Deep Navy Net Payable Highlight Box */}
        <section className="rounded-lg bg-[#112A4A] px-5 py-4 text-white print:px-5 print:py-3.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {labels.netLabel}
          </p>
          <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-white print:text-xl">
            ₹{formatINRNumber(netPayable)}
          </p>
          <p className="mt-1 text-xs font-medium text-slate-200">{amountInWords}</p>
        </section>

        {/* Section 4: Payment Information */}
        <section className="pt-1">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-800">
            PAYMENT INFORMATION
          </h3>

          <div className="grid grid-cols-2 gap-x-8 gap-y-3">
            <div>
              <p className="text-xs text-slate-500">Payment Mode</p>
              <p className="mt-0.5 text-sm font-semibold text-slate-900">
                {source.paymentMode || 'Bank Transfer'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Payment Date</p>
              <p className="mt-0.5 font-mono text-sm font-semibold tabular-nums text-slate-900">
                {formatSlashDate(source.paymentDate)}
              </p>
            </div>
          </div>

          {source.notes ? (
            <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
              <strong className="text-slate-700">Remarks:</strong> {source.notes}
            </p>
          ) : null}
        </section>

        {/* Section 5: Centered Footer with Clickable Email | Website */}
        <footer className="border-t border-slate-200 pt-5 text-center print:pt-4">
          <p className="text-xs text-slate-500">
            This is a computer-generated {labels.footerWord} and does not require a physical
            signature.
          </p>
          <p className="mt-2.5 text-xs font-bold uppercase tracking-wide text-slate-800">
            {displayCompanyName}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {emailHref ? (
              <a
                href={emailHref}
                className="text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-[#112A4A] hover:decoration-[#112A4A]"
              >
                {displayEmail}
              </a>
            ) : (
              <span>{displayEmail}</span>
            )}
            <span className="mx-2 text-slate-300">|</span>
            {websiteHref ? (
              <a
                href={websiteHref}
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-600 underline decoration-slate-300 underline-offset-2 transition hover:text-[#112A4A] hover:decoration-[#112A4A]"
              >
                {displayWebsite}
              </a>
            ) : (
              <span>{displayWebsite}</span>
            )}
          </p>
        </footer>
      </div>
    </div>
  );
}
