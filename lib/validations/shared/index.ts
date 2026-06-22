import { z } from 'zod';

// Reusable regexes
export const PHONE_REGEX = /^\+?[1-9]\d{1,14}$/; // E.164 phone number format

// Common Zod fragments
export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address');

export const phoneSchema = z
  .string()
  .trim()
  .regex(PHONE_REGEX, 'Invalid phone number format (must be E.164, e.g. +1234567890)');

export const moneySchema = z
  .number()
  .positive('Value must be a positive number')
  .or(
    z.string().regex(/^\d+(\.\d{1,2})?$/, 'Must be a valid currency decimal representation')
      .transform(val => parseFloat(val))
  );

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => {
      const p = val ? parseInt(val, 10) : 1;
      return isNaN(p) || p < 1 ? 1 : p;
    }),
  limit: z
    .string()
    .optional()
    .transform(val => {
      const l = val ? parseInt(val, 10) : 10;
      return isNaN(l) || l < 1 ? 10 : l > 100 ? 100 : l;
    }),
});

export const dateRangeSchema = z
  .object({
    startDate: z.string().datetime().transform(val => new Date(val)),
    endDate: z.string().datetime().transform(val => new Date(val)),
  })
  .refine(data => data.startDate <= data.endDate, {
    message: 'Start date must be less than or equal to end date',
    path: ['startDate'],
  });
