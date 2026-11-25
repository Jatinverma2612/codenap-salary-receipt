import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, FilePlus2, RotateCcw, Search } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { deleteReceipt, fetchReceipts } from '../api/receiptApi.js';
import AlertBanner from '../components/common/AlertBanner.jsx';
import ConfirmModal from '../components/common/ConfirmModal.jsx';
import HistoryTable from '../components/history/HistoryTable.jsx';
import { useReceiptDraft } from '../context/ReceiptDraftContext.jsx';
import { formatINR } from '../utils/inrFormat.js';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function buildYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let y = currentYear + 1; y >= 2023; y -= 1) {
    years.push(y);
  }
  return years;
}

const YEAR_OPTIONS = buildYearOptions();
const PAGE_LIMIT = 10;

const FILTER_INPUT_CLASS =
  'w-full rounded-md border border-codenap-borderStrong bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 outline-none transition focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30';

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { loadDuplicateDraft } = useReceiptDraft();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [recipientType, setRecipientType] = useState('');
  const [page, setPage] = useState(1);

  const [receipts, setReceipts] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (location.state?.deletedReceiptNumber) {
      setFeedback({
        type: 'success',
        message: `Receipt ${location.state.deletedReceiptNumber} was deleted from history.`,
      });
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadReceipts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchReceipts({
        q: debouncedSearch,
        month,
        year,
        recipientType,
        page,
        limit: PAGE_LIMIT,
      });
      setReceipts(data.receipts || []);
      setPagination(data.pagination || { total: 0, page: 1, limit: PAGE_LIMIT, totalPages: 1 });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to load saved receipt history.',
      });
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, month, year, recipientType, page]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const hasActiveFilters = Boolean(debouncedSearch || month || year || recipientType);

  const pageTotalAmount = useMemo(
    () => receipts.reduce((sum, item) => sum + (Number(item?.netPayable) || 0), 0),
    [receipts]
  );

  function handleResetFilters() {
    setSearchInput('');
    setDebouncedSearch('');
    setMonth('');
    setYear('');
    setRecipientType('');
    setPage(1);
  }

  function handleDuplicate(receipt) {
    loadDuplicateDraft(receipt);
    navigate('/generate');
  }

  async function handleConfirmDelete() {
    if (!deleteTarget) {
      return;
    }
    setDeleting(true);
    setFeedback({ type: '', message: '' });

    try {
      await deleteReceipt(deleteTarget._id);
      const removedNumber = deleteTarget.receiptNumber;
      setDeleteTarget(null);
      setFeedback({
        type: 'success',
        message: `Receipt ${removedNumber} deleted from history.`,
      });

      if (receipts.length === 1 && page > 1) {
        setPage((prev) => prev - 1);
      } else {
        await loadReceipts();
      }
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Failed to delete receipt.',
      });
    } finally {
      setDeleting(false);
    }
  }

  const startItem = pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.total, pagination.page * pagination.limit);

  return (
    <div className="space-y-4">
      {/* Compact Ledger Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-codenap-borderStrong bg-white px-4 py-3 shadow-flat">
        <div className="flex flex-wrap items-center gap-6 text-xs">
          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Matching Records
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-codenap-navy">
              {pagination.total}
            </span>
          </div>

          <div className="h-7 w-px bg-codenap-border" />

          <div>
            <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              Page Payout Total
            </span>
            <span className="font-mono text-sm font-bold tabular-nums text-codenap-navy">
              {formatINR(pageTotalAmount)}
            </span>
          </div>
        </div>

        <Link
          to="/generate"
          className="inline-flex items-center gap-1.5 rounded-md bg-codenap-navy px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-codenap-steel"
        >
          <FilePlus2 className="h-3.5 w-3.5" />
          <span>New Receipt</span>
        </Link>
      </div>

      {feedback.message ? (
        <AlertBanner
          type={feedback.type}
          message={feedback.message}
          onDismiss={() => setFeedback({ type: '', message: '' })}
        />
      ) : null}

      {/* Search & Filter Toolbar */}
      <div className="rounded-lg border border-codenap-borderStrong bg-white p-3.5 shadow-flat">
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-12">
          <div className="relative lg:col-span-5">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search name, employee ID, or receipt number..."
              className={`${FILTER_INPUT_CLASS} pl-9`}
            />
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by recipient type"
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value);
                setPage(1);
              }}
              className={FILTER_INPUT_CLASS}
            >
              <option value="">All Categories</option>
              <option value="intern">Intern</option>
              <option value="worker">Worker</option>
              <option value="employee">Employee</option>
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by month"
              value={month}
              onChange={(e) => {
                setMonth(e.target.value);
                setPage(1);
              }}
              className={FILTER_INPUT_CLASS}
            >
              <option value="">All Months</option>
              {MONTHS.map((label, idx) => (
                <option key={label} value={idx + 1}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <select
              aria-label="Filter by year"
              value={year}
              onChange={(e) => {
                setYear(e.target.value);
                setPage(1);
              }}
              className={`${FILTER_INPUT_CLASS} font-mono`}
            >
              <option value="">All Years</option>
              {YEAR_OPTIONS.map((yr) => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center lg:col-span-1 lg:justify-end">
            <button
              type="button"
              onClick={handleResetFilters}
              disabled={!hasActiveFilters}
              title="Reset filters"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-codenap-borderStrong bg-codenap-subtle px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-codenap-tint disabled:opacity-40 lg:w-auto"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span className="lg:hidden">Clear Filters</span>
            </button>
          </div>
        </div>
      </div>

      <HistoryTable
        receipts={receipts}
        loading={loading}
        hasActiveFilters={hasActiveFilters}
        onDuplicate={handleDuplicate}
        onDeleteRequest={setDeleteTarget}
        onResetFilters={handleResetFilters}
      />

      {/* Pagination Footer */}
      {!loading && pagination.total > 0 ? (
        <div className="flex flex-col items-center justify-between gap-3 rounded-lg border border-codenap-borderStrong bg-white px-4 py-2.5 text-xs text-slate-600 shadow-flat sm:flex-row">
          <p className="font-mono">
            Showing <strong className="text-codenap-navy">{startItem}</strong>–
            <strong className="text-codenap-navy">{endItem}</strong> of{' '}
            <strong className="text-codenap-navy">{pagination.total}</strong> records
          </p>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagination.page <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              className="inline-flex items-center gap-1 rounded border border-codenap-borderStrong bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-codenap-subtle disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span>Previous</span>
            </button>

            <span className="px-2 font-mono font-semibold text-codenap-navy">
              {pagination.page} / {pagination.totalPages}
            </span>

            <button
              type="button"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => setPage((prev) => Math.min(pagination.totalPages, prev + 1))}
              className="inline-flex items-center gap-1 rounded border border-codenap-borderStrong bg-white px-2.5 py-1 font-semibold text-slate-700 transition hover:bg-codenap-subtle disabled:opacity-40"
            >
              <span>Next</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Saved Receipt?"
        message={
          deleteTarget
            ? `Permanently delete receipt ${deleteTarget.receiptNumber} for ${deleteTarget.employeeName}? This action cannot be undone.`
            : ''
        }
        confirmLabel="Delete Receipt"
        confirmTone="danger"
        isBusy={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
