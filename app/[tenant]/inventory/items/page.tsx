import { ItemService } from '@/modules/inventory/services/ItemService';
import { requirePermission } from '@/lib/auth';
import Link from 'next/link';

export default async function ItemsPage({ params }: { params: { tenant: string } }) {
  const { orgMember } = await requirePermission(params.tenant, 'core.inventory.view');
  
  const { items, total } = await ItemService.getItems(orgMember.org_id, { take: 50 });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Items</h1>
          <p className="text-muted-foreground text-sm mt-2">Manage your inventory catalog</p>
        </div>
        <Link href={`/${params.tenant}/inventory/items/new`} className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors">
          Add New Item
        </Link>
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Selling Price</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {items.map((item) => (
              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.sku}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{item.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.type}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.selling_price}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No items found in your catalog.
          </div>
        )}
      </div>
    </div>
  );
}
