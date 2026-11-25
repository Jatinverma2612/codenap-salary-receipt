import { useRef, useState } from 'react';
import { Image as ImageIcon, RotateCcw, Upload } from 'lucide-react';
import AlertBanner from '../common/AlertBanner.jsx';
import ConfirmModal from '../common/ConfirmModal.jsx';

const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);
const MAX_BYTES = 2 * 1024 * 1024;

export default function LogoUploader({
  title = 'Custom Logo',
  description = 'Upload or replace logo anytime.',
  emptyLabel = 'No Logo Uploaded',
  emptyHint = 'Default fallback active',
  resetConfirmTitle = 'Reset Logo?',
  resetConfirmMessage = 'This removes the active uploaded logo.',
  currentLogoSrc = '',
  companyName = 'Codenap IT Services Private Limited',
  previewDarkSurface = false,
  onUpload,
  onReset,
}) {
  const fileInputRef = useRef(null);

  const [uploading, setUploading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  async function handleFileChange(event) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_TYPES.has(file.type)) {
      setFeedback({
        type: 'error',
        message: 'Unsupported file format. Please choose a PNG, JPEG, or WEBP image.',
      });
      return;
    }

    if (file.size > MAX_BYTES) {
      setFeedback({
        type: 'error',
        message: 'Image file is too large. Maximum allowed logo size is 2 MB.',
      });
      return;
    }

    setUploading(true);
    setFeedback({ type: '', message: '' });

    try {
      await onUpload(file);
      setFeedback({
        type: 'success',
        message: `${title} updated successfully.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to upload ${title.toLowerCase()}.`,
      });
    } finally {
      setUploading(false);
    }
  }

  async function handleResetConfirm() {
    setResetting(true);
    setFeedback({ type: '', message: '' });

    try {
      await onReset();
      setConfirmOpen(false);
      setFeedback({
        type: 'info',
        message: `${title} removed. Default fallback is now active.`,
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || `Failed to reset ${title.toLowerCase()}.`,
      });
    } finally {
      setResetting(false);
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat">
      <div className="border-b border-codenap-border bg-codenap-subtle px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
          {title}
        </h2>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-xs leading-relaxed text-slate-600">{description}</p>

        {feedback.message ? (
          <AlertBanner
            type={feedback.type}
            message={feedback.message}
            onDismiss={() => setFeedback({ type: '', message: '' })}
          />
        ) : null}

        <div
          className={`flex h-32 w-full items-center justify-center overflow-hidden rounded-md border border-dashed p-4 ${
            previewDarkSurface
              ? 'border-[#112A4A]/40 bg-[#112A4A]'
              : 'border-codenap-borderStrong bg-codenap-subtle'
          }`}
        >
          {currentLogoSrc ? (
            <div className={previewDarkSurface ? 'rounded bg-white px-3 py-2' : 'contents'}>
              <img
                src={currentLogoSrc}
                alt={`${companyName} ${title}`}
                className="max-h-20 max-w-full object-contain"
              />
            </div>
          ) : (
            <div
              className={`flex flex-col items-center gap-1 text-center ${
                previewDarkSurface ? 'text-slate-200' : 'text-slate-500'
              }`}
            >
              <ImageIcon
                className={`h-6 w-6 ${previewDarkSurface ? 'text-slate-300' : 'text-codenap-steel'}`}
              />
              <span
                className={`text-xs font-semibold ${
                  previewDarkSurface ? 'text-white' : 'text-codenap-navy'
                }`}
              >
                {emptyLabel}
              </span>
              <span
                className={`text-[11px] ${
                  previewDarkSurface ? 'text-slate-300' : 'text-slate-400'
                }`}
              >
                {emptyHint}
              </span>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md bg-codenap-navy px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-codenap-steel disabled:opacity-60"
          >
            <Upload className="h-3.5 w-3.5" />
            <span>
              {uploading ? 'Uploading...' : currentLogoSrc ? 'Replace Logo' : 'Upload Logo'}
            </span>
          </button>

          {currentLogoSrc ? (
            <button
              type="button"
              disabled={uploading || resetting}
              onClick={() => setConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 rounded-md border border-codenap-borderStrong bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Reset</span>
            </button>
          ) : null}
        </div>

        <p className="font-mono text-[11px] text-slate-500">
          Formats: PNG, JPEG, WEBP &bull; Max size: 2 MB
        </p>
      </div>

      <ConfirmModal
        isOpen={confirmOpen}
        title={resetConfirmTitle}
        message={resetConfirmMessage}
        confirmLabel="Reset Logo"
        confirmTone="danger"
        isBusy={resetting}
        onConfirm={handleResetConfirm}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}
