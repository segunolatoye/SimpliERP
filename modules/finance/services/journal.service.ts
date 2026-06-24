import { prisma } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { AccountingPeriodService } from './accounting-period.service';

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

export interface JournalEntryInput {
  orgId: string;
  date: Date | string;
  reference?: string;
  description?: string;
  lines: JournalLineInput[];
}

export class JournalService {
  /**
   * The generic, reusable engine for posting balanced GL entries.
   * ALL modules (Purchasing, Sales, Manufacturing) must call this function 
   * to ensure period enforcement and GL integrity.
   */
  static async postJournalEntry(input: JournalEntryInput, tx?: any) {
    const db = tx || prisma;
    const { orgId, date, reference, description, lines } = input;

    // 1. Strictly block posting to closed periods
    await AccountingPeriodService.validateDateIsOpen(orgId, date);

    // 2. Validate double-entry accounting rules (Debits == Credits)
    if (!lines || lines.length === 0) {
      throw new Error("Journal entry must have at least two lines.");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error("Debit and credit amounts cannot be negative.");
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error("A single journal line cannot have both a debit and a credit amount.");
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Use a small epsilon to handle floating point precision issues
    if (Math.abs(totalDebit - totalCredit) > 0.001) {
      throw new Error(`Journal entry is unbalanced. Total Debits: ${totalDebit}, Total Credits: ${totalCredit}`);
    }

    // 3. Persist the journal entry and lines transactionally
    const entryId = `JE-${Math.floor(Math.random() * 10000000)}`;

    const entry = await db.journal_entries.create({
      data: {
        id: entryId,
        org_id: orgId,
        date: new Date(date),
        reference,
        description,
        status: 'posted',
        journal_lines: {
          create: lines.map(line => ({
            id: uuidv4(),
            account_id: line.accountId,
            debit: line.debit,
            credit: line.credit
          }))
        }
      },
      include: {
        journal_lines: true
      }
    });

    return entry;
  }
}
