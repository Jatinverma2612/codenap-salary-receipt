import DeductionsFieldList from './DeductionsFieldList.jsx';

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

const RECIPIENT_TYPES = [
  { value: 'intern', label: 'Intern' },
  { value: 'worker', label: 'Worker' },
  { value: 'employee', label: 'Employee' },
];

const PAYMENT_MODES = ['Bank Transfer', 'UPI', 'Cash'];

const INPUT_CLASS =
  'w-full rounded-md border border-codenap-borderStrong bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30';

export default function ReceiptForm({
  formData,
  payrollPreview,
  recentRecipients = [],
  onSelectRecipient,
  onFieldChange,
  onPayPeriodChange,
  onDeductionsChange,
  onSubmit,
}) {
  return (
    <form
      id="receipt-entry-form"
      onSubmit={onSubmit}
      className="overflow-hidden rounded-lg border border-codenap-borderStrong bg-white shadow-flat"
    >
      {/* Section 1: Recipient Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-codenap-border bg-codenap-subtle px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
          1. Recipient Information
        </h2>

        {recentRecipients.length > 0 ? (
          <select
            aria-label="Autofill from recent recipient"
            defaultValue=""
            onChange={(e) => {
              const selected = recentRecipients.find((item) => item.employeeId === e.target.value);
              if (selected) {
                onSelectRecipient?.(selected);
              }
              e.target.value = '';
            }}
            className="rounded border border-codenap-borderStrong bg-white px-2.5 py-1 text-xs font-medium text-slate-700 outline-none transition focus:border-codenap-steel"
          >
            <option value="" disabled>
              Quick fill from recent...
            </option>
            {recentRecipients.map((person) => (
              <option key={person.employeeId} value={person.employeeId}>
                {person.employeeName} ({person.employeeId})
              </option>
            ))}
          </select>
        ) : (
          <span className="text-[11px] text-slate-500">* Required fields</span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <div className="sm:col-span-2 xl:col-span-3">
          <span className="mb-1.5 block text-xs font-semibold text-slate-700">
            Recipient Category
          </span>
          <div className="grid max-w-md grid-cols-3 gap-1 rounded-md border border-codenap-border bg-codenap-canvas p-1">
            {RECIPIENT_TYPES.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onFieldChange('recipientType', option.value)}
                className={`rounded py-1.5 text-xs font-semibold transition ${
                  formData.recipientType === option.value
                    ? 'bg-codenap-navy text-white'
                    : 'text-slate-600 hover:bg-white hover:text-codenap-navy'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="employeeName" className="mb-1 block text-xs font-semibold text-slate-700">
            Full Name *
          </label>
          <input
            id="employeeName"
            type="text"
            required
            minLength={2}
            maxLength={120}
            value={formData.employeeName}
            onChange={(e) => onFieldChange('employeeName', e.target.value)}
            placeholder="e.g., Aarav Sharma"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="employeeId" className="mb-1 block text-xs font-semibold text-slate-700">
            Employee / Intern ID *
          </label>
          <input
            id="employeeId"
            type="text"
            required
            maxLength={40}
            value={formData.employeeId}
            onChange={(e) => onFieldChange('employeeId', e.target.value.toUpperCase())}
            placeholder="e.g., CNP-INT-014"
            className={`${INPUT_CLASS} font-mono uppercase`}
          />
        </div>

        <div>
          <label htmlFor="designation" className="mb-1 block text-xs font-semibold text-slate-700">
            Role / Designation *
          </label>
          <input
            id="designation"
            type="text"
            required
            maxLength={100}
            value={formData.designation}
            onChange={(e) => onFieldChange('designation', e.target.value)}
            placeholder="e.g., Software Development Intern"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="department" className="mb-1 block text-xs font-semibold text-slate-700">
            Department
          </label>
          <input
            id="department"
            type="text"
            maxLength={100}
            value={formData.department}
            onChange={(e) => onFieldChange('department', e.target.value)}
            placeholder="e.g., Engineering"
            className={INPUT_CLASS}
          />
        </div>

        <div>
          <label htmlFor="dateOfJoining" className="mb-1 block text-xs font-semibold text-slate-700">
            Date of Joining
          </label>
          <input
            id="dateOfJoining"
            type="date"
            value={formData.dateOfJoining}
            onChange={(e) => onFieldChange('dateOfJoining', e.target.value)}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
      </div>

      {/* Section 2: Attendance & Pay Period */}
      <div className="border-y border-codenap-border bg-codenap-subtle px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
          2. Attendance &amp; Pay Period
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2 xl:grid-cols-3">
        <div>
          <label htmlFor="payMonth" className="mb-1 block text-xs font-semibold text-slate-700">
            Pay Month *
          </label>
          <select
            id="payMonth"
            value={formData.payPeriod.month}
            onChange={(e) => onPayPeriodChange('month', Number(e.target.value))}
            className={INPUT_CLASS}
          >
            {MONTHS.map((label, index) => (
              <option key={label} value={index + 1}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="payYear" className="mb-1 block text-xs font-semibold text-slate-700">
            Pay Year *
          </label>
          <input
            id="payYear"
            type="number"
            required
            min={2000}
            max={2100}
            value={formData.payPeriod.year}
            onChange={(e) => onPayPeriodChange('year', e.target.value)}
            className={`${INPUT_CLASS} font-mono tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor="workingDays" className="mb-1 block text-xs font-semibold text-slate-700">
            Total Working Days *
          </label>
          <input
            id="workingDays"
            type="number"
            required
            min={1}
            max={31}
            step="0.5"
            value={formData.workingDays}
            onChange={(e) => onFieldChange('workingDays', e.target.value)}
            className={`${INPUT_CLASS} font-mono tabular-nums`}
          />
        </div>

        <div>
          <label htmlFor="paidDays" className="mb-1 block text-xs font-semibold text-slate-700">
            Paid / Worked Days *
          </label>
          <input
            id="paidDays"
            type="number"
            required
            min={0}
            max={31}
            step="0.5"
            value={formData.paidDays}
            onChange={(e) => onFieldChange('paidDays', e.target.value)}
            className={`w-full rounded-md border bg-white px-3 py-2 font-mono text-sm tabular-nums text-slate-900 outline-none transition focus:ring-1 ${
              payrollPreview.exceedsWorkingDays
                ? 'border-rose-500 focus:border-rose-500 focus:ring-rose-300'
                : 'border-codenap-borderStrong focus:border-codenap-steel focus:ring-codenap-steel/30'
            }`}
          />
          {payrollPreview.exceedsWorkingDays ? (
            <p className="mt-1 text-xs font-medium text-rose-600">
              Paid days cannot exceed total working days.
            </p>
          ) : payrollPreview.unpaidDays > 0 ? (
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              Unpaid / LOP days: {payrollPreview.unpaidDays}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="paymentMode" className="mb-1 block text-xs font-semibold text-slate-700">
            Payment Mode *
          </label>
          <select
            id="paymentMode"
            value={formData.paymentMode}
            onChange={(e) => onFieldChange('paymentMode', e.target.value)}
            className={INPUT_CLASS}
          >
            {PAYMENT_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="paymentDate" className="mb-1 block text-xs font-semibold text-slate-700">
            Payment Date *
          </label>
          <input
            id="paymentDate"
            type="date"
            required
            value={formData.paymentDate}
            onChange={(e) => onFieldChange('paymentDate', e.target.value)}
            className={`${INPUT_CLASS} font-mono`}
          />
        </div>
      </div>

      {/* Section 3: Earnings & Deductions */}
      <div className="border-y border-codenap-border bg-codenap-subtle px-5 py-3">
        <h2 className="text-xs font-bold uppercase tracking-wider text-codenap-navy">
          3. Earnings &amp; Deductions (INR)
        </h2>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="monthlyAmount" className="mb-1 block text-xs font-semibold text-slate-700">
              Monthly Base Stipend / Salary (₹) *
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm font-semibold text-slate-400">
                ₹
              </span>
              <input
                id="monthlyAmount"
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.monthlyAmount}
                onChange={(e) => onFieldChange('monthlyAmount', e.target.value)}
                placeholder="25000"
                className="w-full rounded-md border border-codenap-borderStrong bg-white py-2 pl-7 pr-3 font-mono text-sm font-semibold tabular-nums text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-codenap-steel focus:ring-1 focus:ring-codenap-steel/30"
              />
            </div>
          </div>

          <div>
            <label htmlFor="receiptNotes" className="mb-1 block text-xs font-semibold text-slate-700">
              Remarks / Notes (Optional)
            </label>
            <input
              id="receiptNotes"
              type="text"
              maxLength={300}
              value={formData.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="e.g., Stipend disbursed via Bank Transfer"
              className={INPUT_CLASS}
            />
          </div>
        </div>

        <DeductionsFieldList deductions={formData.deductions} onChange={onDeductionsChange} />
      </div>
    </form>
  );
}
