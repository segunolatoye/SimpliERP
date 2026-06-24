'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

type Account = {
  id: string;
  code: string | null;
  name: string;
  type: string;
  is_system: boolean;
  is_active: boolean;
  created_at: Date;
};

export function ChartOfAccountsTable({ accounts }: { accounts: Account[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Code</TableHead>
          <TableHead>Account Name</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Status</TableHead>
          <TableHead className="text-right">Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {accounts.map((account) => (
          <TableRow key={account.id}>
            <TableCell className="font-mono text-muted-foreground">
              {account.code || '-'}
            </TableCell>
            <TableCell className="font-medium">
              <div className="flex items-center space-x-2">
                <span>{account.name}</span>
                {account.is_system && (
                  <Badge variant="secondary" className="text-xs">System</Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="capitalize">{account.type}</TableCell>
            <TableCell>
              {account.is_active ? (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
              ) : (
                <Badge variant="outline" className="bg-slate-50 text-slate-700 border-slate-200">Inactive</Badge>
              )}
            </TableCell>
            <TableCell className="text-right text-muted-foreground">
              {format(new Date(account.created_at), 'MMM d, yyyy')}
            </TableCell>
          </TableRow>
        ))}
        {accounts.length === 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
              No accounts found. System accounts will be created automatically on first transaction.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}
