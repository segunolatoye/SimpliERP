import { prisma } from '@/lib/db';

export class AccountingPeriodService {
  /**
   * Validates if a given date falls within an OPEN accounting period.
   * Throws an error if the period is closed, locked, or doesn't exist.
   * This ensures strict adherence to financial period boundaries.
   */
  static async validateDateIsOpen(orgId: string, date: Date | string) {
    const targetDate = new Date(date);

    const period = await prisma.accountingPeriod.findFirst({
      where: {
        org_id: orgId,
        start_date: { lte: targetDate },
        end_date: { gte: targetDate }
      }
    });

    if (!period) {
      throw new Error(`No accounting period defined for date: ${targetDate.toISOString().split('T')[0]}. Please configure an accounting period first.`);
    }

    if (period.status !== 'open') {
      throw new Error(`The accounting period "${period.name}" for date ${targetDate.toISOString().split('T')[0]} is ${period.status.toUpperCase()}. Transactions cannot be posted.`);
    }

    return period;
  }
}
