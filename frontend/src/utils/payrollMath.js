/**
 * Rounds a number cleanly to 2 decimal places for INR currency display.
 */
export function roundINR(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.round((numeric + Number.EPSILON) * 100) / 100;
}

/**
 * Computes real-time client preview values for prorated gross pay, deductions, and net INR payable.
 */
export function calculateLivePayroll({ monthlyAmount, workingDays, paidDays, deductions = [] }) {
  const base = Math.max(0, Number(monthlyAmount) || 0);
  const totalDays = Number(workingDays) || 0;
  const attendedDays = Math.max(0, Number(paidDays) || 0);

  const clampedPaid = totalDays > 0 ? Math.min(attendedDays, totalDays) : 0;
  const perDayRate = totalDays > 0 ? roundINR(base / totalDays) : 0;
  const grossEarnings = totalDays > 0 ? roundINR((base / totalDays) * clampedPaid) : 0;

  const totalDeductions = roundINR(
    (Array.isArray(deductions) ? deductions : []).reduce((sum, item) => {
      const val = Number(item?.amount);
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0)
  );

  const rawNet = roundINR(grossEarnings - totalDeductions);
  const netPayable = rawNet < 0 ? 0 : rawNet;
  const unpaidDays = totalDays > 0 ? roundINR(Math.max(0, totalDays - clampedPaid)) : 0;

  return {
    perDayRate,
    grossEarnings,
    totalDeductions,
    netPayable,
    unpaidDays,
    exceedsWorkingDays: totalDays > 0 && attendedDays > totalDays,
  };
}
