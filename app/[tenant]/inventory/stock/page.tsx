import { requirePermission } from '@/lib/auth';
import { prisma } from '@/lib/db';
import Link from 'next/link';

export default async function StockLedgerPage({ params }: { params: { tenant: string } }) {
  const { orgMember } = await requirePermission(params.tenant, 'core.inventory.view');
  
  // Fetch latest 100 stock movements for the ledger view
  const ledgerEntries = await prisma.stock_ledger.findMany({
    where: { org_id: orgMember.org_id },
    include: {
      items: { select: { name: true, sku: true } },
      locations: { select: { name: true } }
    },
    orderBy: { created_at: 'desc' },
    take: 100
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Ledger</h1>
          <p className="text-muted-foreground text-sm mt-2">Immutable record of all stock movements</p>
        </div>
        <Link href={`/${params.tenant}/inventory/adjustments/new`} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
          Post Stock Adjustment
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Location</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Movement</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Qty Delta</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Reference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {ledgerEntries.map((entry) => (
              <tr key={entry.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.created_at.toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {entry.items.name} <span className="text-xs text-gray-400 block">{entry.items.sku}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                  {entry.locations.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${entry.movement_type === 'receipt' || entry.movement_type === 'return' ? 'bg-green-100 text-green-800' : 
                      entry.movement_type === 'sale' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {entry.movement_type}
                  </span>
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-right ${entry.qty_delta > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.qty_delta > 0 ? '+' : ''}{entry.qty_delta}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {entry.reference_type}
                  {entry.reference_id && <span className="block text-xs text-gray-400">ID: {entry.reference_id}</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {ledgerEntries.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No stock movements recorded yet.
          </div>
        )}
      </div>
    </div>
  );
}
