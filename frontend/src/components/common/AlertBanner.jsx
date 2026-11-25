import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

const VARIANT_STYLES = {
  info: {
    container: 'bg-codenap-tint border-codenap-borderStrong text-codenap-navy',
    Icon: Info,
  },
  success: {
    container: 'bg-emerald-50 border-emerald-300 text-emerald-900',
    Icon: CheckCircle2,
  },
  warning: {
    container: 'bg-amber-50 border-amber-300 text-amber-900',
    Icon: AlertCircle,
  },
  error: {
    container: 'bg-rose-50 border-rose-300 text-rose-900',
    Icon: AlertCircle,
  },
};

export default function AlertBanner({ type = 'info', message, onDismiss }) {
  if (!message) {
    return null;
  }

  const { container, Icon } = VARIANT_STYLES[type] || VARIANT_STYLES.info;

  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-3 rounded-md border px-3.5 py-2.5 text-sm ${container}`}
    >
      <div className="flex items-start gap-2.5">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="leading-snug">{message}</span>
      </div>
      {onDismiss ? (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss notification"
          className="rounded p-0.5 opacity-70 transition hover:opacity-100"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
