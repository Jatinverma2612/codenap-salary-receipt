import { useRef, useState } from 'react';
import { ArrowLeft, Image as ImageIcon, Printer, Save } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import AlertBanner from '../components/common/AlertBanner.jsx';
import ReceiptPreview from '../components/receipt/ReceiptPreview.jsx';
import { useCompany } from '../context/CompanyContext.jsx';
import { useReceiptDraft } from '../context/ReceiptDraftContext.jsx';
import { formatINR } from '../utils/inrFormat.js';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export default function ReceiptPreviewPage() {
  const navigate = useNavigate();
  const logoInputRef = useRef(null);
  const { company, receiptLogoSrc, uploadReceiptLogo } = useCompany();
  const { formData, payrollPreview, saveDraftReceipt } = useReceiptDraft();

  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const hasRecipientInfo = Boolean(
    formData.employeeName.trim() || formData.employeeId.trim() || formData.monthlyAmount
  );

  async function handleQuickReceiptLogoUpload(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setFeedback({
        type: 'error',
        message: 'Unsupported logo format. Please select a PNG, JPEG, or WEBP image.',
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setFeedback({
        type: 'error',
        message: 'Receipt logo must be 2 MB or smaller.',
      });
      return;
    }

    setUploadingLogo(true);
    setFeedback({ type: '', message: '' });
    try {
      await uploadReceiptLogo(file);
      setFeedback({
        type: 'success',
        message: 'Receipt header logo updated.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to update receipt logo.',
      });
    } finally {
      setUploadingLogo(false);
    }
  }

  async function handleSave() {
    setFeedback({ type: '', message: '' });
    setSaving(true);
    try {
      const saved = await saveDraftReceipt();
      navigate(`/receipts/${saved._id}`, {
        state: { justSaved: true },
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to save receipt. Please complete required fields first.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 print:block">
      {/* Left: Untouched A4 Receipt Preview */}
      <div className="lg:col-span-8 print:w-full">
        <div className="mx-auto max-w-[780px] print:max-w-none">
          <ReceiptPreview
            formData={formData}
            payrollPreview={payrollPreview}
            company={company}
            receiptLogoSrc={receiptLogoSrc}
          />
        </div>
      </div>

      {/* Right: Clean Sticky Preview Controls */}
      <aside className="no-print overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat lg:sticky lg:top-20 lg:col-span-4 print:hidden">
        <div className="flex items-center justify-between border-b border-codenap-border bg-codenap-subtle px-5 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
            Preview Controls
          </h2>
          <span className="rounded border border-codenap-borderStrong bg-white px-2 py-0.5 font-mono text-[10px] font-semibold uppercase text-slate-600">
            Draft
          </span>
        </div>

        <div className="space-y-4 p-5 text-xs">
          {feedback.message ? (
            <AlertBanner
              type={feedback.type}
              message={feedback.message}
              onDismiss={() => setFeedback({ type: '', message: '' })}
            />
          ) : null}

          {!hasRecipientInfo ? (
            <div className="rounded-md border border-codenap-border bg-codenap-tint px-3 py-2.5 text-slate-600">
              No recipient details entered yet. Click <strong className="text-codenap-navy">Edit Receipt Info</strong> to populate this slip before saving.
            </div>
          ) : null}

          <div className="space-y-2 border-b border-codenap-border pb-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Recipient</span>
              <span className="truncate font-semibold text-slate-900">
                {formData.employeeName || '—'}
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
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-semibold text-slate-700">Net Payable</span>
              <span className="font-mono text-sm font-bold tabular-nums text-codenap-navy">
                {formatINR(payrollPreview.netPayable)}
              </span>
            </div>
          </div>

          <input
            ref={logoInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleQuickReceiptLogoUpload}
            className="hidden"
          />

          <div className="space-y-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-codenap-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-codenap-steel disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{saving ? 'Saving Receipt...' : 'Save Receipt'}</span>
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-4 py-2 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-subtle"
            >
              <Printer className="h-3.5 w-3.5 text-codenap-steel" />
              <span>Print / Save PDF</span>
            </button>

            <button
              type="button"
              disabled={uploadingLogo}
              onClick={() => logoInputRef.current?.click()}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-codenap-subtle hover:text-codenap-navy disabled:opacity-60"
            >
              <ImageIcon className="h-3.5 w-3.5 text-codenap-steel" />
              <span>
                {uploadingLogo
                  ? 'Uploading Logo...'
                  : receiptLogoSrc
                    ? 'Change Receipt Logo'
                    : 'Upload Receipt Logo'}
              </span>
            </button>

            <Link
              to="/generate"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-codenap-subtle hover:text-codenap-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Edit Receipt Info</span>
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
