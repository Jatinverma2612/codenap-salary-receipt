import { useEffect } from 'react';
import { X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmTone = 'primary',
  isBusy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !isBusy) {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isBusy, onCancel]);

  if (!isOpen) {
    return null;
  }

  const confirmClasses =
    confirmTone === 'danger'
      ? 'bg-rose-700 text-white hover:bg-rose-800 focus:ring-rose-600'
      : 'bg-codenap-navy text-white hover:bg-codenap-steel focus:ring-codenap-steel';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 px-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-codenap-borderStrong bg-white p-6 shadow-md">
        <div className="flex items-start justify-between gap-4">
          <h2 id="confirm-modal-title" className="text-base font-bold text-codenap-navy">
            {title}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            aria-label="Close modal"
            className="rounded-md p-1 text-slate-400 transition hover:bg-codenap-tint hover:text-slate-600 disabled:opacity-50"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-2 text-sm leading-relaxed text-slate-600">{message}</p>

        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            disabled={isBusy}
            className="rounded-md border border-codenap-borderStrong bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-codenap-subtle disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isBusy}
            className={`rounded-md px-3.5 py-2 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 ${confirmClasses}`}
          >
            {isBusy ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
