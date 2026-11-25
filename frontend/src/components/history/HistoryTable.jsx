import { Copy, Eye, FilePlus2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatINR } from '../../utils/inrFormat.js';

const TYPE_BADGE_STYLES = {
  intern: 'bg-codenap-tint text-codenap-navy border-codenap-borderStrong',
  worker: 'bg-slate-100 text-slate-700 border-slate-300',
  employee: 'bg-stone-100 text-stone-700 border-stone-300',
};

const TYPE_LABELS = {
  intern: 'Intern',
  worker: 'Worker',
  employee: 'Employee',
};

export default function HistoryTable({
  receipts,
  loading,
  hasActiveFilters,
  onDuplicate,
  onDeleteRequest,
  onResetFilters,
}) {
  if (loading) {
    return (
      <div className="rounded-lg border border-codenap-borderStrong bg-white p-10 text-center shadow-flat">
        <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-codenap-tintStrong border-t-codenap-navy" />
        <p className="mt-3 text-sm font-medium text-codenap-navy">Loading receipt records...</p>
      </div>
    );
  }

  if (!receipts.length) {
    return (
      <div className="rounded-lg border border-codenap-borderStrong bg-white p-10 text-center shadow-flat">
        <p className="text-sm font-bold text-codenap-navy">
          {hasActiveFilters ? 'No receipts match the active filters' : 'No saved receipts yet'}
        </p>
        <p className="mt-1 text-xs text-slate-500">
          {hasActiveFilters
            ? 'Adjust or clear your search query, month, year, or category filter.'
            : 'Create and save your first intern or worker payout slip to start the archive.'}
        </p>
        <div className="mt-5 flex justify-center gap-2.5">
          {hasActiveFilters ? (
            <button
              type="button"
              onClick={onResetFilters}
              className="rounded-md border border-codenap-borderStrong bg-codenap-subtle px-3.5 py-2 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-tint"
            >
              Clear Filters
            </button>
          ) : null}
          <Link
            to="/generate"
            className="inline-flex items-center gap-1.5 rounded-md bg-codenap-navy px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-codenap-steel"
          >
            <FilePlus2 className="h-3.5 w-3.5" />
            <span>Generate Receipt</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-codenap-border text-left text-xs sm:text-[13px]">
          <thead className="border-b border-codenap-borderStrong bg-codenap-subtle text-[11px] font-bold uppercase tracking-wider text-codenap-navy">
            <tr>
              <th className="px-4 py-3">Receipt No.</th>
              <th className="px-4 py-3">Recipient</th>
              <th className="px-4 py-3">Role / Dept</th>
              <th className="px-4 py-3">Pay Period</th>
              <th className="px-4 py-3 text-center">Paid / Work Days</th>
              <th className="px-4 py-3 text-right">Net Payable (INR)</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-codenap-border">
            {receipts.map((item) => {
              const badgeStyle =
                TYPE_BADGE_STYLES[item.recipientType] || TYPE_BADGE_STYLES.intern;
              const typeLabel = TYPE_LABELS[item.recipientType] || item.recipientType;

              return (
                <tr key={item._id} className="transition hover:bg-codenap-subtle/80">
                  <td className="whitespace-nowrap px-4 py-3">
                    <Link
                      to={`/receipts/${item._id}`}
                      className="font-mono text-xs font-semibold text-codenap-steel hover:text-codenap-navy hover:underline"
                    >
                      {item.receiptNumber}
                    </Link>
                  </td>

                  <td className="px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.employeeName}</span>
                      <span
                        className={`inline-flex items-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeStyle}`}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <p className="mt-0.5 font-mono text-[11px] text-slate-500">{item.employeeId}</p>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{item.designation}</p>
                    {item.department ? (
                      <p className="text-[11px] text-slate-500">{item.department}</p>
                    ) : null}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-slate-700">
                    {item.payPeriod?.label || `${item.payPeriod?.month}/${item.payPeriod?.year}`}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-center font-mono font-medium tabular-nums text-codenap-navy">
                    {item.paidDays} / {item.workingDays}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right font-mono font-bold tabular-nums text-codenap-navy">
                    {formatINR(item.netPayable)}
                  </td>

                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <div className="inline-flex items-center justify-end gap-1.5">
                      <Link
                        to={`/receipts/${item._id}`}
                        title="View & Print Slip"
                        className="inline-flex items-center gap-1 rounded border border-codenap-borderStrong bg-white px-2.5 py-1 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-tint"
                      >
                        <Eye className="h-3.5 w-3.5 text-codenap-steel" />
                        <span>View</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => onDuplicate(item)}
                        title="Duplicate for Next Month"
                        className="inline-flex items-center gap-1 rounded border border-codenap-borderStrong bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 transition hover:bg-codenap-subtle hover:text-codenap-navy"
                      >
                        <Copy className="h-3.5 w-3.5 text-slate-500" />
                        <span>Duplicate</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteRequest(item)}
                        title="Delete Receipt"
                        className="inline-flex items-center rounded border border-codenap-borderStrong bg-white p-1.5 text-slate-500 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
