export const ACCOUNTING_PERIOD_MONTHLY = "monthly";
export const ACCOUNTING_PERIOD_ANNUAL = "annual";

export function getFeedExpenseAccountingPeriod(section) {
  return section === "मुरघास" || section === "भुसा"
    ? ACCOUNTING_PERIOD_ANNUAL
    : ACCOUNTING_PERIOD_MONTHLY;
}

export function getAccountingPeriodLabel(period) {
  return period === ACCOUNTING_PERIOD_ANNUAL ? "वार्षिक" : "मासिक";
}

export function isAnnualAccountingPeriod(period) {
  return period === ACCOUNTING_PERIOD_ANNUAL;
}
