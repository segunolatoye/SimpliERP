import { prisma } from "@/lib/db";
import { v4 as uuidv4 } from 'uuid';

export interface JournalLineInput {
  accountId: string;
  debit: number;
  credit: number;
}

export class JournalEngine {
  
  /**
   * Post a strictly balanced double-entry journal to the General Ledger.
   */
  static async postJournal(params: {
    orgId: string;
    description: string;
    reference?: string;
    date?: Date;
    lines: JournalLineInput[];
  }) {
    // 1. Validation checks
    if (!params.lines || params.lines.length < 2) {
      throw new Error("A journal entry must have at least two lines.");
    }

    let totalDebit = 0;
    let totalCredit = 0;

    for (const line of params.lines) {
      if (line.debit < 0 || line.credit < 0) {
        throw new Error("Debits and credits cannot be negative.");
      }
      if (line.debit === 0 && line.credit === 0) {
        throw new Error("A journal line must have either a debit or a credit.");
      }
      if (line.debit > 0 && line.credit > 0) {
        throw new Error("A single journal line cannot have both a debit and a credit.");
      }
      totalDebit += line.debit;
      totalCredit += line.credit;
    }

    // Floating point precision fix for validation
    const roundedDebit = Math.round(totalDebit * 100) / 100;
    const roundedCredit = Math.round(totalCredit * 100) / 100;

    if (roundedDebit !== roundedCredit) {
      throw new Error(`Unbalanced Journal Entry: Total Debits (${roundedDebit}) != Total Credits (${roundedCredit})`);
    }

    // 2. Insert into the database using a transaction
    return await prisma.$transaction(async (tx) => {
      const entryId = uuidv4();

      const entry = await tx.journal_entries.create({
        data: {
          id: entryId,
          org_id: params.orgId,
          description: params.description,
          reference: params.reference,
          date: params.date || new Date(),
          status: "posted",
          updated_at: new Date()
        }
      });

      const dbLines = params.lines.map(line => ({
        id: uuidv4(),
        entry_id: entry.id,
        account_id: line.accountId,
        debit: line.debit,
        credit: line.credit
      }));

      await tx.journal_lines.createMany({
        data: dbLines
      });

      return entry;
    });
  }
}
