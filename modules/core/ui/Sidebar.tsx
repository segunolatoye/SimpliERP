"use client";
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';
import { signOut } from '@/app/(auth)/actions';
import { 
  LayoutDashboard, BarChart3, ShoppingBag, Users, Zap, PieChart,
  ShoppingCart, Package, CreditCard, Mail, MessageSquare, FileText, 
  Layout, Calendar, Wand2, FormInput, Map, Flag, Rocket, Activity,
  MessageCircle, Clock, FileEdit, Receipt, Users2, Bell, Settings,
  HelpCircle, BookOpen, LogOut, ChevronRight, Search
} from 'lucide-react';

const navGroups = [
  {
    title: "MAIN NAVIGATION",
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { name: 'Analytics', href: '/analytics', icon: BarChart3 },
      { name: 'CRM', href: '/crm', icon: Users },
      { name: 'Approvals', href: '/approvals', icon: Bell },
    ]
  },
  {
    title: "SALES",
    items: [
      { name: 'Customers', href: '/customers', icon: Users2 },
      { name: 'Sales Orders', href: '/orders', icon: ShoppingCart, badge: '12' },
      { name: 'Invoices', href: '/invoices', icon: FileText },
    ]
  },
  {
    title: "PURCHASING",
    items: [
      { name: 'Purchase Orders', href: '/purchases/orders', icon: ShoppingBag },
    ]
  },
  {
    title: "INVENTORY",
    items: [
      { name: 'Items', href: '/inventory/items', icon: Package },
      { name: 'Stock Adjustments', href: '/inventory/stock-adjustments', icon: FileEdit },
    ]
  },
  {
    title: "FINANCE",
    items: [
      { name: 'Billing', href: '/billing', icon: Receipt },
      { name: 'Chart of Accounts', href: '/finance/chart-of-accounts', icon: CreditCard },
      { name: 'Journal Entries', href: '/finance/journal-entries', icon: FileText },
    ]
  },
  {
    title: "SYSTEM",
    items: [
      { name: 'Team', href: '/settings/team', icon: Users },
      { name: 'Settings', href: '/settings', icon: Settings },
      { name: 'Help & Support', href: '/support', icon: HelpCircle },
    ]
  }
];

type SidebarProps = {
  userName?: string;
  userRole?: string;
  orgName?: string;
  orgSlug?: string;
};

export function Sidebar({ userName = 'User', userRole = 'Member', orgName = 'Workspace', orgSlug = '' }: SidebarProps) {
  const pathname = usePathname();
  const tenantBase = orgSlug ? `/${orgSlug}` : '';

  // Compute initials from the user's full name
  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  // Short display name: "First L."
  const nameParts = userName.split(' ');
  const displayName = nameParts.length > 1
    ? `${nameParts[0]} ${nameParts[nameParts.length - 1][0]}.`
    : nameParts[0];

  return (
    <aside className="w-[280px] premium-sidebar hidden md:flex flex-col h-screen shrink-0 text-slate-700 dark:text-slate-300">
      {/* Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-200 dark:border-white/5 shrink-0">
        <Link href={`${tenantBase}/dashboard`} className="flex items-center">
          <Image 
            src="/logos/simpliERP-dark.png" 
            alt="SimpliERP" 
            width={130} 
            height={36} 
            className="object-contain" 
            priority
          />
        </Link>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-6 custom-scrollbar">
        {navGroups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.title !== "MAIN NAVIGATION" && (
              <h3 className="px-3 text-[11px] font-semibold text-slate-500 tracking-wider mb-2 mt-4">
                {group.title}
              </h3>
            )}
            <nav className="space-y-[2px]">
              {group.items.map((item) => {
                const fullHref = `${tenantBase}${item.href}`;
                const isActive = pathname === fullHref || (item.href !== '/dashboard' && pathname?.startsWith(fullHref));
                return (
                  <Link
                    key={item.name}
                    href={fullHref}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2 text-[13px] font-medium rounded-lg transition-all duration-200",
                      isActive 
                        ? "bg-primary/10 text-primary" 
                        : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-slate-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className={cn(
                        "h-[18px] w-[18px] transition-colors", 
                        isActive ? "text-primary" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300"
                      )} />
                      {item.name}
                    </div>
                    {item.badge && (
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded-full font-bold",
                        (item as any).badgeColor ? (item as any).badgeColor : "bg-slate-200 dark:bg-white/10 text-slate-700 dark:text-slate-300"
                      )}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* User Profile Card */}
      <div className="p-4 border-t border-slate-200 dark:border-white/5 shrink-0 bg-slate-50 dark:bg-[#0B0E14]">
        <button 
          onClick={async () => {
            const { createClient } = await import('@/lib/supabase/client');
            const supabase = createClient();
            await supabase.auth.signOut();
            document.cookie = 'tenant_slug=; Max-Age=0; path=/';
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 transition-colors cursor-pointer group"
        >
          <div className="flex items-center gap-3 text-left">
            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-sm font-bold text-white shadow-[0_0_10px_hsl(var(--primary)/0.4)]">
              {initials}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-900 dark:text-white leading-tight">{displayName}</span>
              <span className="text-xs text-slate-500">{userRole}</span>
            </div>
          </div>
          <LogOut size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300 transition-colors" />
        </button>
      </div>
    </aside>
  );
}
