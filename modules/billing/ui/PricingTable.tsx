"use client";

import { useState } from "react";
import { PLAN_DEFINITIONS, PlanTier } from "@/lib/billing/plans";
import { Check, Sparkles, Zap, Crown, Building2, Rocket } from "lucide-react";

const tierMeta: Record<PlanTier, { icon: React.ElementType; color: string; gradient: string }> = {
  free: { icon: Zap, color: "text-slate-400", gradient: "from-slate-500/20 to-slate-600/5" },
  starter: { icon: Rocket, color: "text-blue-400", gradient: "from-blue-500/20 to-blue-600/5" },
  growth: { icon: Sparkles, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/5" },
  business: { icon: Crown, color: "text-amber-400", gradient: "from-amber-500/20 to-amber-600/5" },
  enterprise: { icon: Building2, color: "text-purple-400", gradient: "from-purple-500/20 to-purple-600/5" },
};

function formatNaira(kobo: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

type PricingTableProps = {
  currentTier: PlanTier;
  tenantSlug: string;
};

export function PricingTable({ currentTier, tenantSlug }: PricingTableProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const tiers: PlanTier[] = ["free", "starter", "growth", "business", "enterprise"];

  async function handleUpgrade(tier: PlanTier) {
    if (tier === "free" || tier === "enterprise" || tier === currentTier) return;
    setLoadingTier(tier);
    try {
      const res = await fetch(`/api/${tenantSlug}/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier, billingCycle }),
      });
      const data = await res.json();
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
      } else {
        alert(data.error || "Failed to initialize checkout.");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setLoadingTier(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Billing Cycle Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          onClick={() => setBillingCycle("monthly")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
            billingCycle === "monthly"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          }`}
        >
          Monthly
        </button>
        <button
          onClick={() => setBillingCycle("annual")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
            billingCycle === "annual"
              ? "bg-primary/20 text-primary border border-primary/30"
              : "text-slate-500 hover:text-slate-300 border border-transparent"
          }`}
        >
          Annual
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-bold">
            Save ~20%
          </span>
        </button>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {tiers.map((tier) => {
          const plan = PLAN_DEFINITIONS[tier];
          const meta = tierMeta[tier];
          const Icon = meta.icon;
          const isCurrent = tier === currentTier;
          const isEnterprise = tier === "enterprise";
          const price =
            billingCycle === "annual" && plan.priceAnnualKobo
              ? plan.priceAnnualKobo / 12
              : plan.priceMonthlyKobo;

          return (
            <div
              key={tier}
              className={`relative rounded-xl border p-5 flex flex-col transition-all duration-300 ${
                isCurrent
                  ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
                  : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
              }`}
            >
              {isCurrent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-[10px] font-bold text-slate-900 uppercase tracking-wider">
                  Current Plan
                </div>
              )}

              {/* Header */}
              <div className={`p-2.5 rounded-lg bg-gradient-to-br ${meta.gradient} w-fit mb-3`}>
                <Icon className={`w-5 h-5 ${meta.color}`} />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white capitalize">{tier}</h3>

              {/* Price */}
              <div className="mt-2 mb-4">
                {isEnterprise ? (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Custom</p>
                ) : price === 0 ? (
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Free</p>
                ) : (
                  <div>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      {formatNaira(price)}
                    </span>
                    <span className="text-xs text-slate-500">/mo</span>
                    {billingCycle === "annual" && (
                      <p className="text-[10px] text-emerald-400 mt-0.5">
                        Billed {formatNaira(plan.priceAnnualKobo!)}/yr
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-400 flex-1 mb-4">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {plan.limits.maxUsers === null ? "Unlimited" : plan.limits.maxUsers} user{plan.limits.maxUsers !== 1 ? "s" : ""}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {plan.limits.maxLocations === null ? "Unlimited" : plan.limits.maxLocations} location{plan.limits.maxLocations !== 1 ? "s" : ""}
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {plan.limits.maxActiveSkus === null ? "Unlimited" : plan.limits.maxActiveSkus} SKUs
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  {plan.limits.maxInvoicesPerMonth === null ? "Unlimited" : plan.limits.maxInvoicesPerMonth} invoices/mo
                </li>
                {plan.limits.apiAccess && (
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    API Access
                  </li>
                )}
                {plan.limits.whiteLabel && (
                  <li className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                    White Label
                  </li>
                )}
              </ul>

              {/* CTA Button */}
              {isCurrent ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-slate-500 border border-white/10 cursor-default"
                >
                  Current Plan
                </button>
              ) : isEnterprise ? (
                <a
                  href="mailto:sales@simplierp.com"
                  className="w-full py-2 rounded-lg text-xs font-medium bg-purple-500/10 text-purple-400 border border-purple-500/20 hover:bg-purple-500/20 transition-colors text-center block"
                >
                  Contact Sales
                </a>
              ) : tier === "free" ? (
                <button
                  disabled
                  className="w-full py-2 rounded-lg text-xs font-medium bg-white/5 text-slate-500 border border-white/10 cursor-default"
                >
                  Free Forever
                </button>
              ) : (
                <button
                  onClick={() => handleUpgrade(tier)}
                  disabled={loadingTier === tier}
                  className="w-full py-2 rounded-lg text-xs font-bold bg-primary text-slate-900 hover:bg-primary/90 transition-all duration-200 shadow-lg shadow-primary/20 disabled:opacity-50"
                >
                  {loadingTier === tier ? "Redirecting..." : "Upgrade"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
