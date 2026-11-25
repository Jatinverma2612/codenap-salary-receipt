import { Plus, Trash2 } from 'lucide-react';

const PRESET_LABELS = ['TDS', 'Advance Recovery', 'Unpaid Leave', 'Professional Tax'];

export default function DeductionsFieldList({ deductions, onChange }) {
  function handleAdd(presetLabel = '') {
    onChange([...deductions, { label: presetLabel, amount: '' }]);
  }

  function handleUpdate(index, field, value) {
    const updated = deductions.map((item, idx) =>
      idx === index ? { ...item, [field]: value } : item
    );
    onChange(updated);
  }

  function handleRemove(index) {
    onChange(deductions.filter((_, idx) => idx !== index));
  }

  return (
    <div className="space-y-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          Itemized Deductions (Optional)
        </span>
        <button
          type="button"
          onClick={() => handleAdd('')}
          className="inline-flex items-center gap-1 rounded-md border border-codenap-borderStrong bg-codenap-subtle px-2.5 py-1 text-xs font-semibold text-codenap-navy transition hover:bg-codenap-tint"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>Add Row</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {PRESET_LABELS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => handleAdd(preset)}
            className="rounded border border-codenap-border bg-codenap-subtle px-2 py-0.5 text-[11px] font-medium text-slate-600 transition hover:border-codenap-borderStrong hover:bg-codenap-tint hover:text-codenap-navy"
          >
            + {preset}
          </button>
        ))}
      </div>

      {deductions.length === 0 ? (
        <p className="rounded-md border border-dashed border-codenap-borderStrong bg-codenap-subtle px-3 py-2 text-xs text-slate-500">
          No deductions added. Prorated gross earnings will equal net payable.
        </p>
      ) : (
        <div className="space-y-2">
          {deductions.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                maxLength={80}
                value={item.label}
                onChange={(e) => handleUpdate(index, 'label', e.target.value)}
                placeholder="Deduction description (e.g., TDS)"
                className="min-w-0 flex-1 rounded-md border border-codenap-borderStrong bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30"
              />
              <div className="relative w-32 shrink-0">
                <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.amount}
                  onChange={(e) => handleUpdate(index, 'amount', e.target.value)}
                  placeholder="0.00"
                  className="w-full rounded-md border border-codenap-borderStrong bg-white py-2 pl-6 pr-2.5 text-right font-mono text-sm tabular-nums text-slate-900 outline-none transition focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30"
                />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label="Remove deduction"
                className="rounded-md border border-codenap-borderStrong bg-white p-2 text-slate-400 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
