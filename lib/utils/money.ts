/**
 * Rounds a number to a specific precision of decimals (default 2 for currency).
 */
export function roundTo(val: number, decimals: number = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Formats a numeric money value to standard currency format.
 */
export function formatMoney(
  amount: number,
  currency: string = 'USD',
  locale: string = 'en-US'
): string {
  const roundedAmount = roundTo(amount, 2);
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(roundedAmount);
}

/**
 * Performs currency conversion given a rate and rounds to standard decimal format.
 */
export function convertCurrency(
  amount: number,
  exchangeRate: number,
  decimals: number = 2
): number {
  if (exchangeRate <= 0) {
    throw new Error('Exchange rate must be positive and non-zero.');
  }
  return roundTo(amount * exchangeRate, decimals);
}
