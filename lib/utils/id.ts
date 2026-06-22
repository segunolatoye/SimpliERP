import { init } from '@paralleldrive/cuid2';

// Set up standard length cuid2 generator
const createCuid = init({
  length: 24,
});

/**
 * Generates a collision-resistant, URL-friendly unique identifier (cuid2).
 */
export function generateId(): string {
  return createCuid();
}

/**
 * Validates if a given string is a valid cuid2 identifier.
 */
export function isValidId(id: string): boolean {
  if (typeof id !== 'string') return false;
  // Cuid2 format regex: lowercase letters/numbers, starts with a letter, length is between 2 and 32
  const CUID2_REGEX = /^[a-z][a-z0-9]*$/;
  return id.length >= 2 && id.length <= 32 && CUID2_REGEX.test(id);
}
