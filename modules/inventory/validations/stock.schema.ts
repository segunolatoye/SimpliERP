import { z } from 'zod';

export const MovementTypeEnum = z.enum(['receipt', 'sale', 'adjustment', 'transfer', 'return']);

export const StockAdjustmentInputSchema = z.object({
  item_id: z.string().uuid("Invalid Item ID"),
  location_id: z.string().uuid("Invalid Location ID"),
  variant_id: z.string().uuid("Invalid Variant ID").optional().nullable(),
  qty_delta: z.number().int("Quantity must be an integer"), // Can be positive (Opening Balance/Found) or negative (Damage/Shrinkage)
  reason_code: z.string().min(2, "Reason code is required"),
  notes: z.string().optional().nullable(),
  cost_price: z.number().min(0).optional().nullable(), // Used for opening balance to set the initial cost
  batch_no: z.string().optional().nullable(),
  serial_no: z.string().optional().nullable(),
  expiry_date: z.coerce.date().optional().nullable(),
}).strict();

export type StockAdjustmentInput = z.infer<typeof StockAdjustmentInputSchema>;

export const StockTransferInputSchema = z.object({
  item_id: z.string().uuid("Invalid Item ID"),
  from_location_id: z.string().uuid("Invalid From Location ID"),
  to_location_id: z.string().uuid("Invalid To Location ID"),
  variant_id: z.string().uuid("Invalid Variant ID").optional().nullable(),
  qty: z.number().int().positive("Quantity to transfer must be positive"),
  notes: z.string().optional().nullable(),
}).strict();

export type StockTransferInput = z.infer<typeof StockTransferInputSchema>;
