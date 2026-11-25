/**
 * Rounds a monetary value cleanly to 2 decimal places in INR.
 */
export function roundINR(value) {
  const num = Number(value);
  if (!Number.isFinite(num)) {
    throw new TypeError('Monetary value must be a finite number.');
  }
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Authoritatively calculates prorated gross earnings, total deductions, and net payable in INR.
 */
export function calculatePayroll({ monthlyAmount, workingDays, paidDays, deductions = [] }) {
  const baseMonthly = Number(monthlyAmount);
  const totalWorking = Number(workingDays);
  const actualPaid = Number(paidDays);

  if (!Number.isFinite(baseMonthly) || baseMonthly < 0) {
    throw new RangeError('Monthly amount must be a non-negative finite number.');
  }
  if (!Number.isFinite(totalWorking) || totalWorking < 1 || totalWorking > 31) {
    throw new RangeError('Working days must be between 1 and 31.');
  }
  if (!Number.isFinite(actualPaid) || actualPaid < 0 || actualPaid > totalWorking) {
    throw new RangeError('Paid days must be between 0 and total working days.');
  }
  if (!Array.isArray(deductions)) {
    throw new TypeError('Deductions must be an array.');
  }

  const normalizedDeductions = deductions.map((item) => {
    const label = typeof item?.label === 'string' ? item.label.trim() : '';
    const amount = Number(item?.amount);

    if (!label) {
      throw new RangeError('Each deduction item must include a non-empty label.');
    }
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError(`Deduction "${label}" must have a non-negative amount.`);
    }

    return {
      label,
      amount: roundINR(amount),
    };
  });

  const grossEarnings = roundINR((baseMonthly / totalWorking) * actualPaid);
  const totalDeductions = roundINR(
    normalizedDeductions.reduce((sum, item) => sum + item.amount, 0)
  );
  const rawNetPayable = roundINR(grossEarnings - totalDeductions);
  const netPayable = rawNetPayable < 0 ? 0 : rawNetPayable;

  return {
    monthlyAmount: roundINR(baseMonthly),
    workingDays: totalWorking,
    paidDays: actualPaid,
    grossEarnings,
    deductions: normalizedDeductions,
    totalDeductions,
    netPayable,
  };
}
