"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Check, ChevronUp, ChevronDown, X, Circle, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/packages/ui-kit/components/ui/card';

export type ChecklistItem = {
  id: string;
  title: string;
  description: string;
  href: string;
};

const defaultItems: ChecklistItem[] = [
  {
    id: 'profile',
    title: 'Complete Business Profile',
    description: 'Add your business logo, tax ID, and address.',
    href: '/settings',
  },
  {
    id: 'team',
    title: 'Invite Team Members',
    description: 'Add your first employee or partner to the workspace.',
    href: '/settings/team',
  },
  {
    id: 'preferences',
    title: 'Configure Preferences',
    description: 'Verify timezone, date format, and currency.',
    href: '/settings/preferences',
  },
  {
    id: 'modules',
    title: 'Enable Core Modules',
    description: 'Turn on the ERP modules you need.',
    href: '/settings/modules',
  },
  {
    id: 'first_action',
    title: 'Create First Record',
    description: 'Create an invoice, product, or customer to get started.',
    href: '/invoices',
  },
];

export function FloatingChecklist({ tenantSlug }: { tenantSlug: string }) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isDismissed, setIsDismissed] = useState(false);
  const [completedItems, setCompletedItems] = useState<string[]>([]);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    const storageKey = `simplierp_onboarding_${tenantSlug}`;
    const savedState = localStorage.getItem(storageKey);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setCompletedItems(parsed.completed || []);
        setIsDismissed(parsed.dismissed || false);
        setIsExpanded(parsed.expanded ?? true);
      } catch (e) {
        console.error("Failed to parse checklist state", e);
      }
    }
  }, [tenantSlug]);

  useEffect(() => {
    if (!mounted) return;
    const storageKey = `simplierp_onboarding_${tenantSlug}`;
    localStorage.setItem(storageKey, JSON.stringify({
      completed: completedItems,
      dismissed: isDismissed,
      expanded: isExpanded
    }));
  }, [completedItems, isDismissed, isExpanded, tenantSlug, mounted]);

  if (!mounted || isDismissed) return null;

  const progress = Math.round((completedItems.length / defaultItems.length) * 100);
  const isAllComplete = completedItems.length === defaultItems.length;

  const toggleItem = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCompletedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Collapsed State / Floating Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg rounded-full p-4 flex items-center justify-center transition-transform hover:scale-105"
        >
          {isAllComplete ? (
            <Check className="w-6 h-6" />
          ) : (
            <div className="relative">
              <HelpCircle className="w-6 h-6" />
              <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {defaultItems.length - completedItems.length}
              </span>
            </div>
          )}
        </button>
      )}

      {/* Expanded State / Card */}
      {isExpanded && (
        <Card className="w-80 shadow-2xl border-white/10 bg-[#0B0E14]/95 backdrop-blur-xl animate-in slide-in-from-bottom-5 fade-in duration-300">
          <CardHeader className="pb-3 flex flex-row items-center justify-between border-b border-white/5 space-y-0">
            <div>
              <CardTitle className="text-base font-semibold text-slate-200">Setup Guide</CardTitle>
              <div className="text-xs text-slate-500 mt-1">{progress}% completed</div>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setIsExpanded(false)}
                className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-slate-200 transition-colors"
                title="Minimize"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
              {isAllComplete && (
                <button 
                  onClick={() => setIsDismissed(true)}
                  className="p-1 hover:bg-white/10 rounded-md text-slate-400 hover:text-rose-400 transition-colors"
                  title="Dismiss completely"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            <div className="h-1 w-full bg-white/5 relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-emerald-500 transition-all duration-500 ease-in-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
            
            <div className="max-h-[60vh] overflow-y-auto custom-scrollbar p-3 space-y-1">
              {defaultItems.map((item) => {
                const isComplete = completedItems.includes(item.id);
                const isActiveRoute = pathname?.includes(item.href);
                
                return (
                  <Link 
                    key={item.id} 
                    href={`/${tenantSlug}${item.href}`}
                    className={cn(
                      "flex items-start gap-3 p-2.5 rounded-lg transition-colors border border-transparent",
                      isActiveRoute ? "bg-white/5 border-white/10" : "hover:bg-white/5",
                      isComplete ? "opacity-60" : ""
                    )}
                  >
                    <button 
                      onClick={(e) => toggleItem(e, item.id)}
                      className={cn(
                        "mt-0.5 flex-shrink-0 flex items-center justify-center w-5 h-5 rounded-full border transition-colors",
                        isComplete 
                          ? "bg-emerald-500/20 border-emerald-500 text-emerald-500" 
                          : "border-slate-600 hover:border-slate-400 text-transparent"
                      )}
                    >
                      <Check className={cn("w-3.5 h-3.5", isComplete ? "opacity-100" : "opacity-0")} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={cn("text-sm font-medium", isComplete ? "line-through text-slate-500" : "text-slate-200")}>
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isAllComplete && (
              <div className="p-4 border-t border-white/5 bg-emerald-500/10 text-emerald-500 text-sm text-center font-medium rounded-b-xl">
                🎉 All setup tasks completed!
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
