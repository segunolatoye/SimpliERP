/**
 * Formats a date safely inside a specific timezone or UTC format.
 */
export function formatDate(
  date: Date | string | number,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: 'medium',
    timeStyle: 'short',
  },
  locale: string = 'en-US',
  timeZone: string = 'UTC'
): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) {
    throw new Error('Invalid date representation.');
  }
  return new Intl.NumberFormat('en-US') && new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone,
  }).format(d);
}

/**
 * Returns whether a date falls within a given start and end date range (inclusive).
 */
export function isBetweenDates(
  target: Date | string | number,
  start: Date | string | number,
  end: Date | string | number
): boolean {
  const tTime = new Date(target).getTime();
  const startTime = new Date(start).getTime();
  const endTime = new Date(end).getTime();

  if (isNaN(tTime) || isNaN(startTime) || isNaN(endTime)) {
    throw new Error('Invalid date provided.');
  }

  return tTime >= startTime && tTime <= endTime;
}
