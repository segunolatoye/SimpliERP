import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(2, "Vendor name must be at least 2 characters"),
  email: z.string().email("Invalid email address").optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
  payment_terms_days: z.coerce.number().min(0).default(30),
  tax_id: z.string().optional(),
  currency: z.string().length(3).default('NGN'),
  notes: z.string().optional()
}).strict();

export const poLineSchema = z.object({
  item_id: z.string().uuid("Invalid item ID"),
  qty_ordered: z.coerce.number().min(1, "Quantity must be at least 1"),
  unit_price: z.coerce.number().min(0, "Unit price cannot be negative"),
  tax_rate: z.coerce.number().min(0).max(100).default(0)
}).strict();

export const purchaseOrderSchema = z.object({
  vendor_id: z.string().uuid("Invalid vendor ID"),
  expected_date: z.string().optional().transform(val => val ? new Date(val) : undefined),
  currency: z.string().length(3).default('NGN'),
  notes: z.string().optional(),
  lines: z.array(poLineSchema).min(1, "Purchase order must have at least one line item")
}).strict();
