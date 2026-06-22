import { getAllTenants } from '@/lib/super-admin/actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/packages/ui-kit/components/ui/card'

export default async function SuperAdminDashboard() {
  // Fetching data securely via the dedicated super admin actions
  const tenants = await getAllTenants()

  return (
    <div className="grid gap-4">
      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription className="text-slate-400">Total registered workspaces on SimpliERP.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{tenants.length}</div>
        </CardContent>
      </Card>

      <Card className="bg-slate-900 border-slate-800 text-slate-100">
        <CardHeader>
          <CardTitle>Recent Workspaces</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border border-slate-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-left text-slate-400">
                  <th className="p-3 font-medium">Name</th>
                  <th className="p-3 font-medium">Plan</th>
                  <th className="p-3 font-medium">Status</th>
                  <th className="p-3 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map(tenant => (
                  <tr key={tenant.id} className="border-b border-slate-800/50 hover:bg-slate-800/50">
                    <td className="p-3 font-medium">{tenant.name}</td>
                    <td className="p-3 capitalize">{tenant.plan}</td>
                    <td className="p-3">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        tenant.status === 'active' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {tenant.status}
                      </span>
                    </td>
                    <td className="p-3 text-slate-400">{new Date(tenant.created_at || new Date()).toLocaleDateString()}</td>
                  </tr>
                ))}
                {tenants.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-4 text-center text-slate-500">No workspaces found.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
