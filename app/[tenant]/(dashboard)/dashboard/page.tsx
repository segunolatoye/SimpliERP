import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/packages/ui-kit/components/ui/card";
import { Button } from "@/packages/ui-kit/components/ui/button";
import { ChevronRight, ArrowUpRight, ArrowRight } from "lucide-react";
import Link from "next/link";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/db";

export default async function Dashboard({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  const organization = await prisma.organisations.findUnique({
    where: { slug: tenant },
    select: { id: true, base_currency: true }
  });
  const currencyCode = organization?.base_currency || "USD";
  const orgId = organization?.id;

  // Fetch live metrics
  const [
    totalItems,
    recentInvoices,
    recentJVs,
    recentReceipts,
    arAgg,
    apAgg
  ] = await Promise.all([
    orgId ? prisma.item.count({ where: { org_id: orgId } }) : 0,
    orgId ? prisma.invoices.findMany({ where: { org_id: orgId }, orderBy: { created_at: 'desc' }, take: 4 }) : [],
    orgId ? prisma.journal_entries.findMany({ where: { org_id: orgId }, orderBy: { created_at: 'desc' }, take: 4 }) : [],
    orgId ? prisma.goods_receipts.findMany({ where: { org_id: orgId }, orderBy: { created_at: 'desc' }, take: 3 }) : [],
    orgId ? prisma.invoices.aggregate({ where: { org_id: orgId, status: 'posted' }, _sum: { total_amount: true } }) : null,
    orgId ? prisma.vendor_bills.aggregate({ where: { org_id: orgId, status: 'posted' }, _sum: { total_amount: true } }) : null,
  ]);

  const outstandingAR = arAgg?._sum.total_amount || 0;
  const outstandingAP = apAgg?._sum.total_amount || 0;

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
      notation: "compact",
      compactDisplay: "short"
    }).format(amount);
  };
  
  const name = user?.user_metadata?.full_name?.split(' ')[0] || user?.user_metadata?.name?.split(' ')[0] || 'there';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 p-4 md:p-8 pt-6 pb-24 w-full">
      {/* Banner & KPI Grid */}
      <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 md:p-8 flex flex-col gap-8 shadow-[0_0_40px_hsl(var(--primary)/0.15)] relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/10 blur-2xl rounded-full pointer-events-none"></div>
        <div className="absolute bottom-0 left-20 w-32 h-32 bg-black/20 dark:bg-black/30 blur-xl rounded-full pointer-events-none"></div>

        <div className="flex flex-col gap-1 text-white relative z-10">
          <h2 className="text-3xl font-semibold tracking-tight text-shadow-sm">{greeting}, {name}</h2>
          <p className="text-white/90 text-sm font-medium">Here's what's happening with your workspace today.</p>
        </div>

        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 relative z-10">
          {[
            { label: "Operating Cash", value: formatMoney(0), change: "0%", desc: "vs last month" },
            { label: "Outstanding AR", value: formatMoney(outstandingAR), change: "0%", desc: "vs last month" },
            { label: "Outstanding AP", value: formatMoney(outstandingAP), change: "0%", desc: "since yesterday" },
            { label: "Stock Items", value: totalItems.toString(), change: "0", desc: "active SKU count" },
          ].map((stat, i) => (
            <div key={i} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 flex flex-col gap-1 transition-all hover:bg-white/15">
              <span className="text-xs font-medium text-white/80 flex items-center gap-1.5">
                <ChevronRight className="w-3 h-3 text-white/50" /> {stat.label}
              </span>
              <div className="text-2xl font-bold text-white tracking-tight mt-0.5">{stat.value}</div>
              <div className="text-[11px] text-white/60 mt-1.5 flex items-center gap-1">
                <span className="text-emerald-400 font-semibold flex items-center">
                  <ArrowUpRight className="h-2.5 w-2.5 mr-0.5" />
                  {stat.change}
                </span> 
                {stat.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Revenue Chart Mock */}
      {/* Revenue Chart Mock */}
      <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131620] dark:to-[#0B0E14] border-slate-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-6 px-6 pt-6">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Cash Flow</CardTitle>
            <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Monthly cash movement</CardDescription>
          </div>
          <div className="flex bg-slate-100 dark:bg-[#0B0E14] p-1 rounded-lg border border-slate-200 dark:border-white/5">
            <button className="px-4 py-1 text-xs font-medium bg-white dark:bg-white/10 text-slate-900 dark:text-white rounded-md shadow-sm dark:shadow-none">Inflow</button>
            <button className="px-4 py-1 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">Outflow</button>
          </div>
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <div className="h-[250px] w-full relative">
            {/* Mock Chart SVG */}
            <svg viewBox="0 0 1000 250" className="w-full h-full preserve-3d" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glow" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="10" stdDeviation="15" floodColor="hsl(var(--primary))" floodOpacity="0.4" />
                </filter>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="50" x2="1000" y2="50" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="125" x2="1000" y2="125" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="200" x2="1000" y2="200" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Fill Area */}
              <path d="M0 200 L0 150 C 200 140, 400 130, 600 90 S 800 60, 1000 40 L1000 200 Z" fill="url(#glow)" />
              {/* Line */}
              <path d="M0 150 C 200 140, 400 130, 600 90 S 800 60, 1000 40" fill="none" stroke="hsl(var(--primary))" strokeWidth="3" filter="url(#shadow)" />
            </svg>
            {/* Axis labels */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-between px-12 text-[11px] text-slate-500 font-medium">
              <span>Sep</span><span>Oct</span><span>Nov</span><span>Dec</span><span>Jan</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {/* Inventory Status */}
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131620] dark:to-[#0B0E14] border-slate-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none">
            <CardContent className="p-6">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <h3 className="text-slate-900 dark:text-white font-semibold mb-1">Inventory Status</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Total items across all locations</p>
                </div>
                <Link href="#" className="text-primary text-xs font-medium hover:underline flex items-center">
                  View inventory <ArrowUpRight className="ml-1 h-3 w-3" />
                </Link>
              </div>
              <div className="h-3 w-full bg-slate-200 dark:bg-[#0B0E14] rounded-full overflow-hidden flex mt-6">
                <div className="h-full bg-emerald-500" style={{ width: '70%' }}></div>
                <div className="h-full bg-amber-500" style={{ width: '20%' }}></div>
                <div className="h-full bg-rose-500" style={{ width: '10%' }}></div>
              </div>
              <div className="flex gap-4 mt-4 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div>In Stock (450)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div>Low Stock (12)</div>
                <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div>Out of Stock (3)</div>
              </div>
            </CardContent>
          </Card>

          {/* Top Inventory by Value */}
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131620] dark:to-[#0B0E14] border-slate-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Top Inventory by Value</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Total value on hand</CardDescription>
              </div>
              <Link href="#" className="text-primary text-xs font-medium hover:underline flex items-center">
                All items <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-4">
              {[
                { name: "MacBook Pro M2", p: 92, c: "bg-primary" },
                { name: "iPhone 14 Pro", p: 68, c: "bg-primary/80" },
                { name: "AirPods Pro", p: 45, c: "bg-primary/60" },
                { name: "Magic Keyboard", p: 31, c: "bg-primary/40" },
                { name: "Magic Mouse", p: 12, c: "bg-primary/30" },
              ].map((f, i) => (
                <div key={i} className="flex items-center gap-4 text-xs font-medium">
                  <span className="w-28 truncate text-slate-500 dark:text-slate-400">{f.name}</span>
                  <div className="flex-1 h-2 bg-slate-200 dark:bg-[#0B0E14] rounded-full overflow-hidden">
                    <div className={`h-full ${f.c} rounded-full`} style={{ width: `${f.p}%` }}></div>
                  </div>
                  <span className="w-8 text-right text-slate-900 dark:text-white">{f.p}%</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Recent Journal Entries */}
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131620] dark:to-[#0B0E14] border-slate-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Recent Journal Entries</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Latest GL postings</CardDescription>
              </div>
              <Link href="#" className="text-primary text-xs font-medium hover:underline flex items-center">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-5">
              {recentJVs.length > 0 ? recentJVs.map((act: any, i: number) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold bg-primary/20 text-primary">
                      JV
                    </div>
                    <div>
                      <span className="text-slate-900 dark:text-white font-medium mr-1">{act.entry_number || "JV"}</span>
                      <span className="text-slate-500 dark:text-slate-400">{act.status || "Draft"}</span>
                    </div>
                  </div>
                  <span className="text-slate-500 text-xs font-medium">
                    {act.created_at.toLocaleDateString()}
                  </span>
                </div>
              )) : (
                <div className="text-sm text-slate-500 text-center py-4">No recent journal entries.</div>
              )}
            </CardContent>
          </Card>

          {/* Recent Stock Movements */}
          <Card className="bg-gradient-to-br from-white to-slate-50 dark:from-[#131620] dark:to-[#0B0E14] border-slate-200 dark:border-white/5 rounded-xl shadow-sm dark:shadow-none">
            <CardHeader className="flex flex-row items-center justify-between pb-4 pt-6 px-6 border-b border-slate-100 dark:border-white/5">
              <div className="space-y-1">
                <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">Recent Stock Movements</CardTitle>
                <CardDescription className="text-slate-500 dark:text-slate-400 text-xs">Latest inventory movements</CardDescription>
              </div>
              <Link href="#" className="text-primary text-xs font-medium hover:underline flex items-center">
                View all <ArrowUpRight className="ml-1 h-3 w-3" />
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {recentReceipts.length > 0 ? recentReceipts.map((dep: any, i: number) => (
                <div key={i} className="p-4 px-6 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                  <div className="space-y-1.5">
                    <div className="text-sm font-medium text-slate-900 dark:text-white">Goods Receipt</div>
                    <div className="flex items-center gap-2 text-[11px] font-medium">
                      <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600 dark:text-emerald-500">{dep.status || "Draft"}</span>
                      <span className="text-slate-500 font-mono">{dep.receipt_number || "GRN"}</span>
                    </div>
                  </div>
                  <div className="flex items-center text-slate-400 dark:text-slate-500 text-xs">
                    {dep.created_at.toLocaleDateString()}
                    <ArrowRight className="w-3.5 h-3.5 ml-2" />
                  </div>
                </div>
              )) : (
                <div className="text-sm text-slate-500 text-center py-6">No recent stock movements.</div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
