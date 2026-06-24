export type EventPayloads = {
  // Core Events
  'core.workspace_created': { orgId: string; userId: string; slug: string };
  'core.user_invited': { orgId: string; email: string; role: string };
  'core.user_joined': { orgId: string; userId: string };

  // Inventory Events
  'inventory.stock_low': { orgId: string; itemId: string; quantity: number };
  'inventory.adjustment_created': { orgId: string; adjustmentId: string };
  'inventory.transfer_completed': { orgId: string; transferId: string };

  // Purchases Events
  'purchases.po_created': { orgId: string; poId: string };
  'purchases.grn_completed': { orgId: string; grnId: string };
  'purchases.po_overdue': { orgId: string; poId: string };
  'purchases.vendor_bill_posted': { orgId: string; billId: string };
  'invoice_posted_without_grn': { invoiceId: string; poLineId: string; itemId: string; grnSkipReason?: string | null };
  'po_line_flagged_dropship': { poId: string; poLineId: string };

  // Sales Events
  'sales.order_confirmed': { orgId: string; orderId: string };
  'sales.order_shipped': { orgId: string; orderId: string };
  'sales.invoice_overdue': { orgId: string; invoiceId: string };
  'sales.delivery_posted': { orgId: string; deliveryId: string };
  'sales.invoice_posted': { orgId: string; invoiceId: string };
  'customer_invoice_without_delivery': { invoiceId: string; soLineId: string; itemId: string; skipReason?: string | null };

  // CRM Events
  'crm.lead_won': { orgId: string; leadId: string; customerId?: string };
  'crm.lead_lost': { orgId: string; leadId: string; reason?: string };
};

export type EventName = keyof EventPayloads;
export type EventHandler<T extends EventName> = (payload: EventPayloads[T]) => void | Promise<void>;
