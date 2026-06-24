import { z } from 'zod';

export const updateOrgSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z.string().min(3, 'Slug must be at least 3 characters'),
  time_zone: z.string().min(1, 'Timezone is required'),
  base_currency: z.string().optional(),
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  location: z.string().optional(),
  date_format: z.string().optional(),
  fiscal_year: z.string().optional(),
  company_id_type: z.string().optional(),
  company_id_value: z.string().optional(),
  additional_fields: z.preprocess((val) => {
    if (typeof val === 'string') {
      try {
        return JSON.parse(val);
      } catch (e) {
        return [];
      }
    }
    return val;
  }, z.array(z.object({
    id: z.string().optional(),
    label: z.string(),
    value: z.string()
  }))).optional(),
});

export const updatePreferencesSchema = z.object({
  attach_invoice_pdf_to_email: z.boolean().optional(),
  discount_type: z.enum(['none', 'item_level', 'transaction_level']).optional(),
  tax_inclusive_sales: z.enum(['inclusive', 'exclusive']).optional(),
  stock_tracking_mode: z.enum(['physical', 'accounting']).optional(),
  sales_stock_allocation: z.enum(['on_so_creation', 'on_delivery']).optional(),
});

export const toggleModuleSchema = z.object({
  module_name: z.string().min(1),
  enabled: z.boolean(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Valid email is required'),
  role: z.string().min(1, 'Role is required'),
});

export const updateRoleSchema = z.object({
  role_id: z.string().optional(), // If updating an existing custom role
  name: z.string().min(2),
  permissions: z.array(z.string()),
});

export const updateBrandingSchema = z.object({
  logo_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  theme_mode: z.enum(['Light', 'Dark']).optional(),
  accent_color: z.string().optional(),
  keep_branding: z.boolean().optional(),
  recommend_platform: z.boolean().optional(),
});
