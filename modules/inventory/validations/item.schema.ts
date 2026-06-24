import { z } from 'zod';

export const CostMethodEnum = z.enum(['fifo', 'fefo', 'lifo', 'average']);

export const CreateItemInputSchema = z.object({
  sku: z.string().min(2, "SKU must be at least 2 characters").regex(/^[A-Za-z0-9-_]+$/, "SKU can only contain letters, numbers, hyphens, and underscores"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  category_id: z.string().uuid("Invalid Category ID").optional().nullable(),
  unit_id: z.string().uuid("Invalid Unit ID").optional().nullable(),
  reorder_point: z.number().int().min(0).default(0),
  preferred_vendor_id: z.string().uuid("Invalid Vendor ID").optional().nullable(),
  lead_time_days: z.number().int().min(0).default(0),
  cost_method: CostMethodEnum.default('fifo'),
  brand: z.string().optional().nullable(),
  cost_price: z.number().min(0).default(0),
  selling_price: z.number().min(0).default(0),
  ean: z.string().optional().nullable(),
  upc: z.string().optional().nullable(),
  isbn: z.string().optional().nullable(),
  mpn: z.string().optional().nullable(),
  manufacturer: z.string().optional().nullable(),
  is_purchasable: z.boolean().default(true),
  is_returnable: z.boolean().default(false),
  is_sellable: z.boolean().default(true),
  track_inventory: z.boolean().default(true),
  track_bin: z.boolean().default(false),
  track_lot: z.boolean().default(false),
  track_serial: z.boolean().default(false),
  type: z.string().default('Goods'),
  status: z.string().default('Active'),
  tax_preference: z.string().default('Taxable'),
  height: z.number().min(0).optional().nullable(),
  length: z.number().min(0).optional().nullable(),
  width: z.number().min(0).optional().nullable(),
  weight: z.number().min(0).optional().nullable(),
  dimension_unit: z.string().default('cm'),
  weight_unit: z.string().default('kg'),
  inventory_account_id: z.string().optional().nullable(),
  purchase_account_id: z.string().optional().nullable(),
  sales_account_id: z.string().optional().nullable(),
}).strict();

export type CreateItemInput = z.infer<typeof CreateItemInputSchema>;

export const UpdateItemInputSchema = CreateItemInputSchema.partial();
export type UpdateItemInput = z.infer<typeof UpdateItemInputSchema>;
