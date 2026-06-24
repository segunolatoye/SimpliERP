import { prisma } from '@/lib/db';
import { AccountType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export type SystemAccountCode = 
  | 'ACCOUNTS_PAYABLE' 
  | 'AP_ACCRUAL' 
  | 'ACCOUNTS_RECEIVABLE' 
  | 'SALES_REVENUE' 
  | 'COGS' 
  | 'INVENTORY_ASSET'
  | 'WIP_INVENTORY';

export class AccountLookupService {
  /**
   * Retrieves a system account for the organization.
   * If the account does not exist, it auto-creates it to ensure
   * automated journal postings do not fail.
   */
  static async getSystemAccount(orgId: string, code: SystemAccountCode) {
    let account = await prisma.accounts.findFirst({
      where: { org_id: orgId, code, deleted_at: null }
    });

    if (!account) {
      account = await this.autoCreateSystemAccount(orgId, code);
    }

    return account;
  }

  private static async autoCreateSystemAccount(orgId: string, code: SystemAccountCode) {
    const defaultSpecs: Record<SystemAccountCode, { name: string, type: AccountType }> = {
      'ACCOUNTS_PAYABLE': { name: 'Accounts Payable', type: 'liability' },
      'AP_ACCRUAL': { name: 'AP Accrual (Goods Received Not Invoiced)', type: 'liability' },
      'ACCOUNTS_RECEIVABLE': { name: 'Accounts Receivable', type: 'asset' },
      'SALES_REVENUE': { name: 'Sales Revenue', type: 'revenue' },
      'COGS': { name: 'Cost of Goods Sold', type: 'expense' },
      'INVENTORY_ASSET': { name: 'Inventory Asset', type: 'asset' },
      'WIP_INVENTORY': { name: 'Work In Progress (WIP)', type: 'asset' }
    };

    const spec = defaultSpecs[code];
    if (!spec) throw new Error(`Unknown system account code: ${code}`);

    return await prisma.accounts.create({
      data: {
        id: uuidv4(),
        org_id: orgId,
        code: code,
        name: spec.name,
        type: spec.type,
        is_system: true,
        updated_at: new Date()
      }
    });
  }
}
