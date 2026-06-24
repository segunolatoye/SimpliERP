import { EventBus } from '@/lib/events/bus';
import { prisma } from '@/lib/db';
import { JournalService } from '../services/journal.service';
import { AccountLookupService } from '../services/account-lookup.service';

export function registerFinanceSubscribers() {
  /**
   * Goods Receipt (Procurement)
   * Debit: Inventory Asset
   * Credit: AP Accrual
   */
  EventBus.subscribe('purchases.grn_completed', async (payload: { orgId: string, grnId: string }) => {
    try {
      const grn = await prisma.goods_receipts.findUnique({
        where: { id: payload.grnId },
        include: {
          gr_lines: {
            include: {
              po_lines: { include: { items: true } }
            }
          }
        }
      });

      if (!grn) return;

      const inventoryAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'INVENTORY_ASSET');
      const accrualAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'AP_ACCRUAL');

      let totalAmount = 0;
      for (const line of grn.gr_lines) {
        // Amount = Qty Received * PO Unit Price
        totalAmount += line.qty_received * line.po_lines.unit_price;
      }

      if (totalAmount > 0) {
        await JournalService.postJournalEntry({
          orgId: payload.orgId,
          date: grn.received_at || new Date(),
          reference: `GRN:${grn.id}`,
          description: `Inventory received on GRN ${grn.id}`,
          lines: [
            { accountId: inventoryAccount.id, debit: totalAmount, credit: 0 },
            { accountId: accrualAccount.id, debit: 0, credit: totalAmount }
          ]
        });
      }
    } catch (error) {
      console.error(`Failed to post GRN journal entry:`, error);
      // Depending on strictness, we might want to throw or push to a dead-letter queue.
    }
  });

  /**
   * Vendor Bill (Procurement)
   * Debit: AP Accrual (for received goods) or Expense (for direct services)
   * Credit: Accounts Payable
   */
  EventBus.subscribe('purchases.vendor_bill_posted', async (payload: { orgId: string, billId: string }) => {
    try {
      const bill = await prisma.vendor_bills.findUnique({
        where: { id: payload.billId },
        include: {
          vendor_bill_lines: {
            include: { po_lines: true }
          }
        }
      });

      if (!bill) return;

      const apAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'ACCOUNTS_PAYABLE');
      const accrualAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'AP_ACCRUAL');

      // For simplicity, we assume everything hits the AP Accrual account.
      // In a highly advanced setup, service items without GRN would directly hit Expense.
      const totalAmount = bill.total_amount;

      if (totalAmount > 0) {
        await JournalService.postJournalEntry({
          orgId: payload.orgId,
          date: bill.invoice_date || new Date(),
          reference: `BILL:${bill.id}`,
          description: `Vendor Bill ${bill.id} recognized`,
          lines: [
            { accountId: accrualAccount.id, debit: totalAmount, credit: 0 },
            { accountId: apAccount.id, debit: 0, credit: totalAmount }
          ]
        });
      }
    } catch (error) {
      console.error(`Failed to post Vendor Bill journal entry:`, error);
    }
  });

  /**
   * Delivery Note (Sales)
   * Debit: Cost of Goods Sold (COGS)
   * Credit: Inventory Asset
   */
  EventBus.subscribe('sales.delivery_posted', async (payload: { orgId: string, deliveryId: string }) => {
    try {
      const delivery = await prisma.delivery_notes.findUnique({
        where: { id: payload.deliveryId },
        include: {
          delivery_note_lines: {
            include: {
              so_lines: { include: { items: true } }
            }
          }
        }
      });

      if (!delivery) return;

      const cogsAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'COGS');
      const inventoryAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'INVENTORY_ASSET');

      let totalCost = 0;
      for (const line of delivery.delivery_note_lines) {
        // For COGS, we use the Item's cost_price or valuation, not the selling price.
        // In a true weighted-average system, we'd query the stock ledger valuation at this point in time.
        // For v1, we use the item's static cost_price.
        totalCost += line.qty_delivered * (line.so_lines?.items.cost_price || 0);
      }

      if (totalCost > 0) {
        await JournalService.postJournalEntry({
          orgId: payload.orgId,
          date: delivery.shipped_at || new Date(),
          reference: `DELIVERY:${delivery.id}`,
          description: `Goods shipped on Delivery Note ${delivery.id}`,
          lines: [
            { accountId: cogsAccount.id, debit: totalCost, credit: 0 },
            { accountId: inventoryAccount.id, debit: 0, credit: totalCost }
          ]
        });
      }
    } catch (error) {
      console.error(`Failed to post Delivery Note journal entry:`, error);
    }
  });

  /**
   * Customer Invoice (Sales)
   * Debit: Accounts Receivable (AR)
   * Credit: Sales Revenue
   */
  EventBus.subscribe('sales.invoice_posted', async (payload: { orgId: string, invoiceId: string }) => {
    try {
      const invoice = await prisma.invoices.findUnique({
        where: { id: payload.invoiceId }
      });

      if (!invoice) return;

      const arAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'ACCOUNTS_RECEIVABLE');
      const revenueAccount = await AccountLookupService.getSystemAccount(payload.orgId, 'SALES_REVENUE');

      const totalAmount = invoice.total_amount;

      if (totalAmount > 0) {
        await JournalService.postJournalEntry({
          orgId: payload.orgId,
          date: invoice.invoice_date || new Date(),
          reference: `INVOICE:${invoice.id}`,
          description: `Customer Invoice ${invoice.id} recognized`,
          lines: [
            { accountId: arAccount.id, debit: totalAmount, credit: 0 },
            { accountId: revenueAccount.id, debit: 0, credit: totalAmount }
          ]
        });
      }
    } catch (error) {
      console.error(`Failed to post Customer Invoice journal entry:`, error);
    }
  });
}
