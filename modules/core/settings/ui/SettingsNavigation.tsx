"use client";

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Search, X, ArrowLeft,
  Building2, Users, Sliders, CreditCard,
  Puzzle, Calculator, Mail, 
  ShoppingCart, ShoppingBag, Package,
  Link2, Webhook, Shield
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/packages/ui-kit/components/ui/input';

type SettingItem = {
  name: string;
  href: string;
  status: 'live' | 'soon';
  icon: any;
  moduleRequirement?: string;
};

type SettingGroup = {
  title: string;
  items: SettingItem[];
};

const SETTINGS_STRUCTURE: SettingGroup[] = [
  {
    title: 'Workspace',
    items: [
      { name: 'General Profile', href: '/settings', status: 'live', icon: Building2 },
      { name: 'Branding', href: '/settings/branding', status: 'live', icon: Building2 },
      { name: 'Locations', href: '/settings/locations', status: 'live', icon: Building2 },
      { name: 'Team & Roles', href: '/settings/team', status: 'live', icon: Users },
      { name: 'Preferences', href: '/settings/preferences', status: 'live', icon: Sliders },
      { name: 'Billing & Plans', href: '/settings/billing', status: 'live', icon: CreditCard },
    ]
  },
  {
    title: 'Core Setup',
    items: [
      { name: 'Active Modules', href: '/settings/modules', status: 'live', icon: Puzzle },
      { name: 'Document Numbering', href: '/settings/document-numbering', status: 'live', icon: Calculator },
      { name: 'Approval Workflows', href: '/settings/workflows', status: 'live', icon: Shield },
      { name: 'Accounting Periods', href: '/settings/accounting-periods', status: 'live', icon: Calculator },
      { name: 'Currencies', href: '/settings/currencies', status: 'live', icon: CreditCard },
      { name: 'Tax Codes', href: '/settings/tax-codes', status: 'live', icon: Calculator },
      { name: 'Units of Measure', href: '/settings/uoms', status: 'live', icon: Package },
      { name: 'Payment Gateways', href: '/settings/payment-gateways', status: 'soon', icon: CreditCard },
      { name: 'Email & PDF Templates', href: '/settings/templates', status: 'soon', icon: Mail },
    ]
  },
  {
    title: 'Module Configurations',
    items: [
      { name: 'Sales & Invoicing', href: '/settings/sales', status: 'live', icon: ShoppingCart, moduleRequirement: 'sales' },
      { name: 'Purchases & Expenses', href: '/settings/purchases', status: 'soon', icon: ShoppingBag, moduleRequirement: 'purchases' },
      { name: 'Inventory & Stock', href: '/settings/inventory', status: 'soon', icon: Package, moduleRequirement: 'inventory' },
    ]
  },
  {
    title: 'Advanced',
    items: [
      { name: 'Integrations', href: '/settings/integrations', status: 'soon', icon: Link2 },
      { name: 'API & Webhooks', href: '/settings/api', status: 'soon', icon: Webhook },
    ]
  }
];

export function SettingsSidebar({ tenantSlug, activeModules }: { tenantSlug: string, activeModules: string[] }) {
  const pathname = usePathname();
  const [search, setSearch] = useState('');

  const filteredGroups = useMemo(() => {
    return SETTINGS_STRUCTURE.map(group => {
      // 1. Filter items by module requirements
      const moduleFilteredItems = group.items.filter(item => {
        if (!item.moduleRequirement) return true;
        return activeModules.includes(item.moduleRequirement);
      });

      // 2. Filter by search query
      const searchFilteredItems = moduleFilteredItems.filter(item => 
        item.name.toLowerCase().includes(search.toLowerCase())
      );

      return {
        ...group,
        items: searchFilteredItems
      };
    }).filter(group => group.items.length > 0);
  }, [search, activeModules]);

  return (
    <aside className="w-64 flex-shrink-0 flex flex-col h-full premium-sidebar">
      <div className="p-4">
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Settings</h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input 
            placeholder="Search settings..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 premium-input h-9 focus-visible:ring-1 focus-visible:ring-primary/50"
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar px-3 pb-6 space-y-8">
        {filteredGroups.map(group => (
          <div key={group.title}>
            <h3 className="px-3 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              {group.title}
            </h3>
            
            <div className="space-y-1">
              {group.items.map(item => {
                const fullHref = `/${tenantSlug}${item.href}`;
                const isActive = pathname === fullHref;
                
                return (
                  <Link 
                    key={item.name}
                    href={item.status === 'live' ? fullHref : '#'}
                    className={cn(
                      "group flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                      isActive 
                        ? "bg-slate-100 dark:bg-premium-surface text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-premium-glass" 
                        : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100/50 dark:hover:bg-premium-surface/50 border border-transparent",
                      item.status === 'soon' && "opacity-50 cursor-not-allowed hover:bg-transparent hover:border-transparent hover:text-slate-400"
                    )}
                  >
                    <div className="flex items-center">
                      <item.icon className={cn("w-4 h-4 mr-3", isActive ? "text-primary/80" : "text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-400")} />
                      <span className={cn("font-medium", isActive && "text-primary/90")}>{item.name}</span>
                    </div>
                    {item.status === 'live' ? (
                      isActive && <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_hsl(var(--primary)/0.8)]" />
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-sm bg-slate-100 dark:bg-white/5 text-slate-500 border border-slate-200 dark:border-white/5">
                        Soon
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}

export function SettingsLayoutWrapper({ 
  tenantSlug, 
  activeModules, 
  children 
}: { 
  tenantSlug: string; 
  activeModules: string[];
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-premium-dark text-slate-900 dark:text-slate-300 overflow-hidden">
      {/* Topbar */}
      <header className="h-14 flex-shrink-0 glass-header flex items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${tenantSlug}/dashboard`}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors border border-slate-200 dark:border-white/5"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="h-4 w-px bg-slate-200 dark:bg-white/10" />
          <span className="font-semibold text-slate-900 dark:text-slate-200">Organization Settings</span>
        </div>
        
        <Link 
          href={`/${tenantSlug}/dashboard`}
          className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-white/5"
        >
          <span className="hidden sm:inline">Close</span>
          <X className="w-4 h-4" />
        </Link>
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <SettingsSidebar tenantSlug={tenantSlug} activeModules={activeModules} />
        <main className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10 relative bg-slate-50 dark:bg-premium-surface">
          {/* Subtle gradient background for the main content area */}
          <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none" />
          <div className="relative w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
