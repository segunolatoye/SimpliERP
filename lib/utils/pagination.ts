/**
 * Encodes a string or record object into a base64 string cursor.
 */
export function encodeCursor(payload: string | Record<string, any>): string {
  const jsonStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
  return Buffer.from(jsonStr, 'utf-8').toString('base64url');
}

/**
 * Decodes a base64 string cursor back to the original format.
 */
export function decodeCursor<T = Record<string, any>>(cursor: string): T {
  try {
    const raw = Buffer.from(cursor, 'base64url').toString('utf-8');
    try {
      return JSON.parse(raw) as T;
    } catch {
      return raw as unknown as T;
    }
  } catch {
    throw new Error('Malformed pagination cursor.');
  }
}
