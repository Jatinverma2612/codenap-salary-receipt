import { useEffect, useState } from 'react';
import { ArrowLeft, Copy, Printer, Trash2 } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { deleteReceipt, fetchReceiptById } from '../api/receiptApi.js';
import AlertBanner from '../components/common/AlertBanner.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import ReceiptPreview from '../components/receipt/ReceiptPreview.jsx';
import { useCompany } from '../context/CompanyContext.jsx';
import { useReceiptDraft } from '../context/ReceiptDraftContext.jsx';
import { formatINR } from '../utils/inrFormat.js';

export default function ReceiptDetailPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { company, receiptLogoSrc } = useCompany();
  const { loadDuplicateDraft } = useReceiptDraft();

  const [receipt, setReceipt] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (location.state?.justSaved) {
      setSavedMessage('Calculated and saved to MongoDB history.');
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    let active = true;

    async function loadReceipt() {
      setLoading(true);
      setError('');
      try {
        const data = await fetchReceiptById(id);
        if (active) {
          setReceipt(data.receipt || null);
        }
      } catch (err) {
        if (active) {
          setError(err.message || 'Unable to load this receipt.');
          setReceipt(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadReceipt();
    return () => {
      active = false;
    };
  }, [id]);

  function handleDuplicate() {
    if (!receipt) {
      return;
    }
    loadDuplicateDraft(receipt);
    navigate('/generate');
  }

  function handlePrint() {
    window.print();
  }

  async function handleConfirmDelete() {
    if (!receipt) {
      return;
    }
    setDeleting(true);
    try {
      await deleteReceipt(receipt._id);
      navigate('/history', {
        replace: true,
        state: { deletedReceiptNumber: receipt.receiptNumber },
      });
    } catch (err) {
      setConfirmDeleteOpen(false);
      setError(err.message || 'Failed to delete receipt.');
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl rounded-lg border border-codenap-borderStrong bg-white p-10 text-center shadow-flat">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-codenap-tintStrong border-t-codenap-navy" />
        <p className="mt-3 text-sm font-medium text-codenap-navy">Loading receipt...</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <AlertBanner type="error" message={error || 'Receipt not found.'} />
        <Link
          to="/history"
          className="inline-flex items-center gap-2 rounded-md bg-codenap-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-codenap-steel"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to History</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12 print:block">
      {/* Left: Untouched Saved A4 Receipt */}
      <div className="lg:col-span-8 print:w-full">
        <div className="mx-auto max-w-[780px] print:max-w-none">
          <ReceiptPreview
            receipt={receipt}
            company={company}
            receiptLogoSrc={receiptLogoSrc}
          />
        </div>
      </div>

      {/* Right: Sticky Receipt Actions Panel */}
      <aside className="no-print overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat lg:sticky lg:top-20 lg:col-span-4 print:hidden">
        <div className="flex items-center justify-between border-b border-codenap-border bg-codenap-subtle px-5 py-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
            Receipt Record
          </h2>
          <span className="font-mono text-[11px] font-bold text-codenap-navy">
            {receipt.receiptNumber}
          </span>
        </div>

        <div className="space-y-4 p-5 text-xs">
          {savedMessage ? (
            <AlertBanner
              type="success"
              message={savedMessage}
              onDismiss={() => setSavedMessage('')}
            />
          ) : null}

          <div className="space-y-2 border-b border-codenap-border pb-3.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Recipient</span>
              <span className="truncate font-semibold text-slate-900">
                {receipt.employeeName}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">ID / Category</span>
              <span className="font-mono font-medium uppercase text-codenap-navy">
                {receipt.employeeId} &bull; {receipt.recipientType}
              </span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Pay Period</span>
              <span className="font-medium text-slate-800">{receipt.payPeriod?.label}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500">Payment Mode</span>
              <span className="font-medium text-slate-800">{receipt.paymentMode}</span>
            </div>
            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="font-semibold text-slate-700">Net Payable</span>
              <span className="font-mono text-sm font-bold tabular-nums text-codenap-navy">
                {formatINR(receipt.netPayable)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-codenap-navy px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-codenap-steel"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print / Save as PDF</span>
            </button>

            <button
              type="button"
              onClick={handleDuplicate}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-4 py-2 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-subtle"
            >
              <Copy className="h-3.5 w-3.5 text-codenap-steel" />
              <span>Duplicate for Next Month</span>
            </button>

            <Link
              to="/history"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-codenap-subtle hover:text-codenap-navy"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to History</span>
            </Link>
          </div>

          <div className="border-t border-codenap-border pt-3">
            <button
              type="button"
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Receipt</span>
            </button>
          </div>
        </div>
      </aside>

      <ConfirmModal
        isOpen={confirmDeleteOpen}
        title="Delete Saved Receipt?"
        message={`Permanently delete receipt ${receipt.receiptNumber} for ${receipt.employeeName}? This action cannot be undone.`}
        confirmLabel="Delete Receipt"
        confirmTone="danger"
        isBusy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDeleteOpen(false)}
      />
    </div>
  );
}
