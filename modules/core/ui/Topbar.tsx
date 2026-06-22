"use client";
import { Search, Bell, Menu, Moon, Palette, Plus, Package, ShoppingCart, ShoppingBag, Archive } from 'lucide-react';
import { Button } from '@/packages/ui-kit/components/ui/button';
import Image from 'next/image';
import Link from 'next/link';
import { useTheme } from "next-themes";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/packages/ui-kit/components/ui/dropdown-menu';

type TopbarProps = {
  tenantSlug?: string;
  enabledModules?: string[];
};

export function Topbar({ tenantSlug, enabledModules = [] }: TopbarProps) {
  const { setTheme } = useTheme();

  return (
    <header className="h-16 glass-header flex items-center justify-between px-6 sticky top-0 z-30">
      <div className="flex items-center flex-1">
        <Button variant="ghost" size="icon" className="md:hidden mr-2 text-slate-400">
          <Menu className="h-5 w-5" />
        </Button>
        <div className="md:hidden flex items-center mr-4">
          <Image src="/logos/simpliERP-dark.png" alt="SimpliERP Logo" width={110} height={30} className="object-contain" />
        </div>
        <div className="max-w-xs w-full relative hidden sm:flex items-center">
          <div className="flex items-center w-full h-9 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg px-3 text-slate-900 dark:text-slate-400 cursor-text hover:border-slate-300 dark:hover:border-white/20 transition-colors">
            <Search className="h-4 w-4 mr-2" />
            <span className="text-sm">Search anything...</span>
            <div className="ml-auto flex items-center gap-1">
              <kbd className="inline-flex h-5 items-center gap-1 rounded border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 px-1.5 font-mono text-[10px] font-medium text-slate-500 dark:text-slate-400">
                <span className="text-xs">⌘</span>K
              </kbd>
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" className="bg-primary hover:bg-primary/90 text-white rounded-full h-8 w-8 shadow-[0_0_15px_hsl(var(--primary)/0.3)]">
              <Plus className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48 bg-white dark:bg-[#131620] border-slate-200 dark:border-white/10">
            <DropdownMenuItem asChild>
              <Link href={tenantSlug ? `/${tenantSlug}/products/new` : '/products/new'} className="cursor-pointer flex items-center focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                <Package className="mr-2 h-4 w-4 text-slate-500" />
                <span>Item</span>
              </Link>
            </DropdownMenuItem>
            {enabledModules.some(m => m.includes('sale')) && (
              <DropdownMenuItem asChild>
                <Link href={tenantSlug ? `/${tenantSlug}/orders/new` : '/orders/new'} className="cursor-pointer flex items-center focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                  <ShoppingCart className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Sales</span>
                </Link>
              </DropdownMenuItem>
            )}
            {enabledModules.some(m => m.includes('purchase')) && (
              <DropdownMenuItem asChild>
                <Link href={tenantSlug ? `/${tenantSlug}/purchases/new` : '/purchases/new'} className="cursor-pointer flex items-center focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                  <ShoppingBag className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Purchase</span>
                </Link>
              </DropdownMenuItem>
            )}
            {enabledModules.some(m => m.includes('inventory')) && (
              <DropdownMenuItem asChild>
                <Link href={tenantSlug ? `/${tenantSlug}/inventory/adjustments/new` : '/inventory/adjustments/new'} className="cursor-pointer flex items-center focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                  <Archive className="mr-2 h-4 w-4 text-slate-500" />
                  <span>Inventory</span>
                </Link>
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-1"></div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
              <Moon className="h-[1.1rem] w-[1.1rem]" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-[#131620] border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300">
            <DropdownMenuItem onClick={() => setTheme("light")} className="focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">Light</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")} className="focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">Dark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")} className="focus:bg-slate-100 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">System</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full relative text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5">
          <Bell className="h-[1.1rem] w-[1.1rem]" />
          <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive border-2 border-white dark:border-[#0B0E14]" />
        </Button>
        
        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-white shadow-[0_0_10px_hsl(var(--primary)/0.4)] ml-1 cursor-pointer ring-2 ring-transparent hover:ring-white/20 transition-all">
          AS
        </div>
      </div>
    </header>
  );
}
