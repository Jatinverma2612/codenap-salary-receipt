import { useEffect, useState } from 'react';
import { Eye, RotateCcw, Save } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchReceipts } from '../api/receiptApi.js';
import AlertBanner from '../components/common/AlertBanner.jsx';
import ReceiptForm from '../components/receipt/ReceiptForm.jsx';
import { useReceiptDraft } from '../context/ReceiptDraftContext.jsx';
import { formatINR, formatINRWords } from '../utils/inrFormat.js';

export default function GenerateReceiptPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
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
  } = useReceiptDraft();

  const [recentRecipients, setRecentRecipients] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const duplicateSource = location.state?.duplicateFrom;
    if (!duplicateSource) {
      return;
    }

    loadDuplicateDraft(duplicateSource);
    navigate(location.pathname, { replace: true, state: null });
  }, [location.pathname, location.state, loadDuplicateDraft, navigate]);

  useEffect(() => {
    let active = true;

    async function loadRecentRecipients() {
      try {
        const data = await fetchReceipts({ limit: 50 });
        if (!active) {
          return;
        }
        const byId = new Map();
        for (const item of data?.receipts || []) {
          if (item.employeeId && !byId.has(item.employeeId)) {
            byId.set(item.employeeId, item);
          }
        }
        setRecentRecipients(Array.from(byId.values()));
      } catch {
        // Silent optional convenience fetch.
      }
    }

    loadRecentRecipients();
    return () => {
      active = false;
    };
  }, []);

  function handleReset() {
    resetDraft();
    setError('');
  }

  function handleOpenPreview() {
    setError('');
    navigate('/preview');
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setSaving(true);

    try {
      const saved = await saveDraftReceipt();
      navigate(`/receipts/${saved._id}`, {
        state: { justSaved: true },
      });
    } catch (err) {
      setError(err.message || 'Failed to save receipt.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {duplicateNotice ? (
        <AlertBanner
          type="info"
          message={duplicateNotice}
          onDismiss={() => setDuplicateNotice('')}
        />
      ) : null}

      {error ? (
        <AlertBanner
          type="error"
          message={error}
          onDismiss={() => setError('')}
        />
      ) : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        {/* Structured Receipt Entry Form */}
        <div className="lg:col-span-8">
          <ReceiptForm
            formData={formData}
            payrollPreview={payrollPreview}
            recentRecipients={recentRecipients}
            onSelectRecipient={applyRecipientTemplate}
            onFieldChange={updateField}
            onPayPeriodChange={updatePayPeriod}
            onDeductionsChange={updateDeductions}
            onSubmit={handleSubmit}
          />
        </div>

        {/* Compact Sticky Payout Summary Card */}
        <aside className="overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat lg:sticky lg:top-20 lg:col-span-4">
          <div className="border-b border-codenap-border bg-codenap-subtle px-5 py-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
              Payout Summary
            </h2>
          </div>

          <div className="space-y-4 p-5 text-xs">
            <div className="space-y-2 border-b border-codenap-border pb-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Recipient</span>
                <span className="truncate font-semibold text-slate-900">
                  {formData.employeeName || '—'}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">ID / Category</span>
                <span className="font-mono font-medium uppercase text-codenap-navy">
                  {formData.employeeId || '—'} &bull; {formData.recipientType}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Pay Period</span>
                <span className="font-medium text-slate-800">{formData.payPeriod?.label}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Paid / Working Days</span>
                <span className="font-mono font-semibold tabular-nums text-codenap-navy">
                  {formData.paidDays || 0} / {formData.workingDays || 0}
                </span>
              </div>
            </div>

            <div className="space-y-2 border-b border-codenap-border pb-3.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Per-Day Rate</span>
                <span className="font-mono tabular-nums text-slate-700">
                  {formatINR(payrollPreview.perDayRate)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Gross Prorated</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900">
                  {formatINR(payrollPreview.grossEarnings)}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="text-slate-500">Total Deductions</span>
                <span className="font-mono font-medium tabular-nums text-slate-700">
                  - {formatINR(payrollPreview.totalDeductions)}
                </span>
              </div>
            </div>

            <div className="rounded-md border border-codenap-borderStrong border-l-4 border-l-codenap-navy bg-codenap-tint px-3.5 py-3">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Net Payable (INR)
              </span>
              <span className="mt-0.5 block font-mono text-xl font-bold tabular-nums text-codenap-navy">
                {formatINR(payrollPreview.netPayable)}
              </span>
              <span className="mt-1.5 block text-[11px] font-medium leading-snug text-slate-600">
                {formatINRWords(payrollPreview.netPayable)}
              </span>
            </div>

            <div className="space-y-2 pt-1">
              <button
                type="submit"
                form="receipt-entry-form"
                disabled={saving || payrollPreview.exceedsWorkingDays}
                className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-codenap-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-codenap-steel focus:outline-none focus:ring-2 focus:ring-codenap-steel focus:ring-offset-1 disabled:opacity-60"
              >
                <Save className="h-3.5 w-3.5" />
                <span>{saving ? 'Saving Receipt...' : 'Save & Open Receipt'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenPreview}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-4 py-2 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-subtle"
              >
                <Eye className="h-3.5 w-3.5 text-codenap-steel" />
                <span>Preview Slip</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-codenap-subtle hover:text-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Form</span>
              </button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
