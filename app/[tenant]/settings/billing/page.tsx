import { getBillingData } from "@/app/actions/billing";
import { PricingTable } from "@/modules/billing/ui/PricingTable";
import { CreditCard, Users, MapPin, Package, FileText, AlertTriangle } from "lucide-react";

function QuotaBar({
  label,
  icon: Icon,
  current,
  limit,
}: {
  label: string;
  icon: React.ElementType;
  current: number;
  limit: number | null;
}) {
  const isUnlimited = limit === null;
  const percentage = isUnlimited ? 0 : Math.min((current / limit) * 100, 100);
  const isWarning = !isUnlimited && percentage >= 80;
  const isMaxed = !isUnlimited && percentage >= 100;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</span>
        </div>
        <span className={`text-sm font-bold ${isMaxed ? "text-red-400" : isWarning ? "text-amber-400" : "text-slate-900 dark:text-white"}`}>
          {current}
          {isUnlimited ? (
            <span className="text-slate-500 font-normal"> / ∞</span>
          ) : (
            <span className="text-slate-500 font-normal"> / {limit}</span>
          )}
        </span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isMaxed
              ? "bg-gradient-to-r from-red-500 to-red-400"
              : isWarning
              ? "bg-gradient-to-r from-amber-500 to-amber-400"
              : "bg-gradient-to-r from-primary/80 to-primary"
          }`}
          style={{ width: isUnlimited ? "0%" : `${percentage}%` }}
        />
      </div>
      {isWarning && !isMaxed && (
        <p className="text-[11px] text-amber-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Approaching limit — consider upgrading
        </p>
      )}
      {isMaxed && (
        <p className="text-[11px] text-red-400 flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          Limit reached — upgrade to continue
        </p>
      )}
    </div>
  );
}

export default async function BillingPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant } = await params;
  const billing = await getBillingData(tenant);

  const tierLabels: Record<string, string> = {
    free: "Free",
    starter: "Starter",
    growth: "Growth",
    business: "Business",
    enterprise: "Enterprise",
  };

  return (
    <div className="space-y-8 pb-24 animate-in fade-in duration-500">
      {/* Page Header */}
      <div className="sticky top-0 z-40 -mx-6 px-6 py-4 glass-header flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary/80" />
            Billing &amp; Subscription
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Manage your plan, view usage, and upgrade your workspace.
          </p>
        </div>
      </div>

      {/* Current Plan Card */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Current Plan</h3>
            <p className="text-xs text-slate-500">Your active subscription details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Plan</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{tierLabels[billing.currentTier] || billing.currentTier}</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Status</p>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${billing.status === "active" ? "bg-emerald-400" : billing.status === "past_due" ? "bg-amber-400 animate-pulse" : "bg-red-400"}`} />
              <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">{billing.status.replace("_", " ")}</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5">
            <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider font-medium">Billing Cycle</p>
            <p className="text-lg font-bold text-slate-900 dark:text-white capitalize">
              {billing.billingCycle || "—"}
            </p>
            {billing.currentPeriodEnd && (
              <p className="text-[11px] text-slate-500 mt-0.5">
                Renews {new Date(billing.currentPeriodEnd).toLocaleDateString("en-NG", { year: "numeric", month: "short", day: "numeric" })}
              </p>
            )}
          </div>
        </div>

        {billing.cancelAtPeriodEnd && (
          <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            Your subscription is set to cancel at the end of the current period. You will be downgraded to the Free plan.
          </div>
        )}
      </div>

      {/* Usage Quota Section */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <Package className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Usage &amp; Quotas</h3>
            <p className="text-xs text-slate-500">Your workspace resource consumption against plan limits</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <QuotaBar label="Team Members" icon={Users} current={billing.usage.users.current} limit={billing.usage.users.limit} />
          <QuotaBar label="Locations" icon={MapPin} current={billing.usage.locations.current} limit={billing.usage.locations.limit} />
          <QuotaBar label="Active SKUs" icon={Package} current={billing.usage.skus.current} limit={billing.usage.skus.limit} />
          <QuotaBar label="Invoices This Month" icon={FileText} current={billing.usage.invoicesThisMonth.current} limit={billing.usage.invoicesThisMonth.limit} />
        </div>
      </div>

      {/* Pricing Table */}
      <div className="glass-card">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/5">
          <div className="p-2 bg-white/5 rounded-lg border border-white/5">
            <CreditCard className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">Available Plans</h3>
            <p className="text-xs text-slate-500">Compare plans and upgrade to unlock more features</p>
          </div>
        </div>

        <PricingTable currentTier={billing.currentTier} tenantSlug={tenant} />
      </div>
    </div>
  );
}
