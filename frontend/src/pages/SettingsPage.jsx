import { useEffect, useState } from 'react';
import { Building2, Save } from 'lucide-react';
import AlertBanner from '../components/common/AlertBanner.jsx';
import LogoUploader from '../components/company/LogoUploader.jsx';
import { useCompany } from '../context/CompanyContext.jsx';

const INPUT_CLASS =
  'w-full rounded-md border border-codenap-borderStrong bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30';

export default function SettingsPage() {
  const {
    company,
    logoSrc,
    receiptLogoSrc,
    loadingCompany,
    companyError,
    saveCompanyDetails,
    uploadLogo,
    removeLogo,
    uploadReceiptLogo,
    removeReceiptLogo,
  } = useCompany();

  const [form, setForm] = useState({
    companyName: '',
    tagline: '',
    address: '',
    contactEmail: 'info@codenap.co.in',
    website: 'https://codenap.in/',
    signatoryName: '',
    receiptPrefix: 'CNP',
    receiptLogoUrl: '',
    logoUrl: '',
  });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  useEffect(() => {
    if (company) {
      const externalReceiptUrl =
        company.receiptLogoUrl && !company.receiptLogoUrl.startsWith('/api/')
          ? company.receiptLogoUrl
          : '';
      const externalSoftwareUrl =
        company.logoUrl && !company.logoUrl.startsWith('/api/')
          ? company.logoUrl
          : '';

      setForm({
        companyName: company.companyName || 'Codenap IT Services Private Limited',
        tagline: company.tagline || '',
        address: company.address || '',
        contactEmail: company.contactEmail || 'info@codenap.co.in',
        website: company.website || 'https://codenap.in/',
        signatoryName: company.signatoryName || 'Authorized Signatory',
        receiptPrefix: company.receiptPrefix || 'CNP',
        receiptLogoUrl: externalReceiptUrl,
        logoUrl: externalSoftwareUrl,
      });
    }
  }, [company]);

  function handleChange(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setFeedback({ type: '', message: '' });

    try {
      const payload = {
        companyName: form.companyName.trim(),
        tagline: form.tagline.trim(),
        address: form.address.trim(),
        contactEmail: form.contactEmail.trim(),
        website: form.website.trim(),
        signatoryName: form.signatoryName.trim(),
        receiptPrefix: form.receiptPrefix.trim().toUpperCase(),
      };

      const trimmedExternalReceiptUrl = form.receiptLogoUrl.trim();
      const existingWasExternal = Boolean(
        company?.receiptLogoUrl && !company.receiptLogoUrl.startsWith('/api/')
      );
      if (trimmedExternalReceiptUrl || existingWasExternal) {
        payload.receiptLogoUrl = trimmedExternalReceiptUrl;
      }

      await saveCompanyDetails(payload);
      setFeedback({
        type: 'success',
        message: 'Company branding and receipt defaults saved successfully.',
      });
    } catch (err) {
      setFeedback({
        type: 'error',
        message: err.message || 'Unable to save company settings.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {companyError ? <AlertBanner type="error" message={companyError} /> : null}

      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-12">
        <div className="space-y-5 lg:col-span-5">
          <LogoUploader
            title="Receipt Header Logo"
            description="Shown exclusively in the dark navy header of generated Stipend & Salary Receipts. Previously saved slips preserve their historical logo snapshot."
            emptyLabel="No Receipt Logo Uploaded"
            emptyHint="Uses CODENAP text mark until uploaded"
            resetConfirmTitle="Reset Receipt Header Logo?"
            resetConfirmMessage="This removes the uploaded receipt header logo. Previously saved receipts keep their archived snapshot."
            currentLogoSrc={receiptLogoSrc}
            companyName={company.companyName}
            previewDarkSurface
            onUpload={uploadReceiptLogo}
            onReset={removeReceiptLogo}
          />

          <LogoUploader
            title="Software / Admin Sidebar Logo"
            description="Shown in the top-left corner of this Admin Panel sidebar (separate from the receipt header logo)."
            emptyLabel="No Software Logo Set"
            emptyHint="Fallback CN monogram active"
            resetConfirmTitle="Reset Software Logo?"
            resetConfirmMessage="This removes the Admin Panel sidebar logo and restores the CN monogram."
            currentLogoSrc={logoSrc}
            companyName={company.companyName}
            previewDarkSurface={false}
            onUpload={uploadLogo}
            onReset={removeLogo}
          />
        </div>

        <div className="overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat lg:col-span-7">
          <div className="flex items-center gap-2 border-b border-codenap-border bg-codenap-subtle px-5 py-3">
            <Building2 className="h-4 w-4 text-codenap-navy" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
              Company Profile &amp; Slip Footer
            </h2>
          </div>

          <div className="p-5">
            {feedback.message ? (
              <div className="mb-4">
                <AlertBanner
                  type={feedback.type}
                  message={feedback.message}
                  onDismiss={() => setFeedback({ type: '', message: '' })}
                />
              </div>
            ) : null}

            <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="company-name" className="mb-1 block text-xs font-semibold text-slate-700">
                  Registered Company Name *
                </label>
                <input
                  id="company-name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={150}
                  disabled={loadingCompany}
                  value={form.companyName}
                  onChange={(e) => handleChange('companyName', e.target.value)}
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="company-tagline" className="mb-1 block text-xs font-semibold text-slate-700">
                  Fallback Tagline (Used if no receipt logo is uploaded)
                </label>
                <input
                  id="company-tagline"
                  type="text"
                  maxLength={200}
                  disabled={loadingCompany}
                  value={form.tagline}
                  onChange={(e) => handleChange('tagline', e.target.value)}
                  placeholder="PROFESSIONAL IT SERVICES"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="contact-email" className="mb-1 block text-xs font-semibold text-slate-700">
                  Clickable Footer Email *
                </label>
                <input
                  id="contact-email"
                  type="email"
                  maxLength={254}
                  disabled={loadingCompany}
                  value={form.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  placeholder="info@codenap.co.in"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="company-website" className="mb-1 block text-xs font-semibold text-slate-700">
                  Clickable Footer Website *
                </label>
                <input
                  id="company-website"
                  type="url"
                  maxLength={255}
                  disabled={loadingCompany}
                  value={form.website}
                  onChange={(e) => handleChange('website', e.target.value)}
                  placeholder="https://codenap.in/"
                  className={INPUT_CLASS}
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="company-address" className="mb-1 block text-xs font-semibold text-slate-700">
                  Office Address (Optional internal reference)
                </label>
                <textarea
                  id="company-address"
                  rows={2}
                  maxLength={400}
                  disabled={loadingCompany}
                  value={form.address}
                  onChange={(e) => handleChange('address', e.target.value)}
                  placeholder="Optional internal office address"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="signatory-name" className="mb-1 block text-xs font-semibold text-slate-700">
                  Authorized Signatory Label
                </label>
                <input
                  id="signatory-name"
                  type="text"
                  maxLength={120}
                  disabled={loadingCompany}
                  value={form.signatoryName}
                  onChange={(e) => handleChange('signatoryName', e.target.value)}
                  placeholder="Authorized Signatory"
                  className={INPUT_CLASS}
                />
              </div>

              <div>
                <label htmlFor="receipt-prefix" className="mb-1 block text-xs font-semibold text-slate-700">
                  Receipt Number Prefix *
                </label>
                <input
                  id="receipt-prefix"
                  type="text"
                  required
                  maxLength={15}
                  disabled={loadingCompany}
                  value={form.receiptPrefix}
                  onChange={(e) => handleChange('receiptPrefix', e.target.value.toUpperCase())}
                  placeholder="CNP"
                  className={`${INPUT_CLASS} font-mono uppercase`}
                />
                <p className="mt-1 font-mono text-[11px] text-slate-400">
                  Format: {form.receiptPrefix || 'CNP'}-2026-0001
                </p>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="receipt-logo-url" className="mb-1 block text-xs font-semibold text-slate-700">
                  External Receipt Logo HTTPS URL (Optional override)
                </label>
                <input
                  id="receipt-logo-url"
                  type="text"
                  maxLength={500}
                  disabled={loadingCompany}
                  value={form.receiptLogoUrl}
                  onChange={(e) => handleChange('receiptLogoUrl', e.target.value)}
                  placeholder={
                    company?.receiptLogoUrl?.startsWith('/api/')
                      ? 'Uploaded receipt logo is active (enter https://... only to override)'
                      : 'https://...'
                  }
                  className={INPUT_CLASS}
                />
              </div>

              <div className="mt-1 flex justify-end border-t border-codenap-border pt-4 sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving || loadingCompany}
                  className="inline-flex items-center gap-1.5 rounded-md bg-codenap-navy px-4 py-2 text-xs font-semibold text-white transition hover:bg-codenap-steel disabled:opacity-60"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{saving ? 'Saving...' : 'Save Company Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
