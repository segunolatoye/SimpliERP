/**
 * Escapes and formats fields into a single CSV row.
 */
export function formatCsvRow(fields: (string | number | boolean | null | undefined)[]): string {
  return fields
    .map(field => {
      if (field === null || field === undefined) {
        return '""';
      }
      const stringified = String(field);
      // Escape double quotes inside the field by doubling them
      const escaped = stringified.replace(/"/g, '""');
      return `"${escaped}"`;
    })
    .join(',');
}

/**
 * Parses a single CSV line into raw string values.
 */
export function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let currentField = '';
  let inQuotes = false;

  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    const nextChar = row[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i++; // skip next quote
      } else {
        // Toggle quote block
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }

  result.push(currentField);
  return result;
}
