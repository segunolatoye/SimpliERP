export type PlanTier = "free" | "starter" | "growth" | "business" | "enterprise";

export type ModuleKey =
  | "inventory"
  | "sales"
  | "purchasing"
  | "finance"
  | "reporting_audit"
  | "manufacturing"
  | "multi_entity";

export interface PlanLimits {
  maxUsers: number | null; // null = unlimited
  maxLocations: number | null;
  maxActiveSkus: number | null;
  maxInvoicesPerMonth: number | null;
  reportHistoryDays: number | null;
  modules: ModuleKey[]; // which ERP modules are unlocked
  approvalWorkflows: boolean;
  apiAccess: boolean;
  whiteLabel: boolean;
  supportTierSlaHours: number | null;
}

export interface PlanDefinition {
  tier: PlanTier;
  priceMonthlyKobo: number;
  priceAnnualKobo: number | null;
  paystackPlanCode: string | null;
  limits: PlanLimits;
}

export const PLAN_DEFINITIONS: Record<PlanTier, PlanDefinition> = {
  free: {
    tier: "free",
    priceMonthlyKobo: 0,
    priceAnnualKobo: null,
    paystackPlanCode: null,
    limits: {
      maxUsers: 1,
      maxLocations: 1,
      maxActiveSkus: 50,
      maxInvoicesPerMonth: 30,
      reportHistoryDays: 90,
      modules: ["inventory", "sales"],
      approvalWorkflows: false,
      apiAccess: false,
      whiteLabel: false,
      supportTierSlaHours: null,
    },
  },
  starter: {
    tier: "starter",
    priceMonthlyKobo: 650000, // NGN 6,500
    priceAnnualKobo: 6240000, // NGN 62,400
    paystackPlanCode: "PLN_starter",
    limits: {
      maxUsers: 2,
      maxLocations: 1,
      maxActiveSkus: 300,
      maxInvoicesPerMonth: 200,
      reportHistoryDays: 365,
      modules: ["inventory", "sales", "purchasing"],
      approvalWorkflows: false,
      apiAccess: false,
      whiteLabel: false,
      supportTierSlaHours: 48,
    },
  },
  growth: {
    tier: "growth",
    priceMonthlyKobo: 1650000, // NGN 16,500
    priceAnnualKobo: 15840000, // NGN 158,400
    paystackPlanCode: "PLN_growth",
    limits: {
      maxUsers: 5,
      maxLocations: 2,
      maxActiveSkus: 2000,
      maxInvoicesPerMonth: 1000,
      reportHistoryDays: 1095,
      modules: ["inventory", "sales", "purchasing", "finance"],
      approvalWorkflows: true,
      apiAccess: false,
      whiteLabel: false,
      supportTierSlaHours: 24,
    },
  },
  business: {
    tier: "business",
    priceMonthlyKobo: 3800000, // NGN 38,000
    priceAnnualKobo: 36480000, // NGN 364,800
    paystackPlanCode: "PLN_business",
    limits: {
      maxUsers: 15,
      maxLocations: 5,
      maxActiveSkus: null,
      maxInvoicesPerMonth: null,
      reportHistoryDays: null,
      modules: ["inventory", "sales", "purchasing", "finance", "reporting_audit"],
      approvalWorkflows: true,
      apiAccess: true,
      whiteLabel: false,
      supportTierSlaHours: 12,
    },
  },
  enterprise: {
    tier: "enterprise",
    priceMonthlyKobo: 0, // Custom pricing handled externally
    priceAnnualKobo: null,
    paystackPlanCode: null,
    limits: {
      maxUsers: null,
      maxLocations: null,
      maxActiveSkus: null,
      maxInvoicesPerMonth: null,
      reportHistoryDays: null,
      modules: [
        "inventory",
        "sales",
        "purchasing",
        "finance",
        "reporting_audit",
        "manufacturing",
        "multi_entity",
      ],
      approvalWorkflows: true,
      apiAccess: true,
      whiteLabel: true,
      supportTierSlaHours: 4,
    },
  },
};
