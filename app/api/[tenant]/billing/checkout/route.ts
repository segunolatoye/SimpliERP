import { NextRequest, NextResponse } from "next/server";
import { requirePermission } from "@/lib/auth";
import { PLAN_DEFINITIONS, PlanTier } from "@/lib/billing/plans";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tenant: string }> }
) {
  try {
    const { tenant } = await params;
    const { user, orgMember } = await requirePermission(tenant, "core.settings.manage");
    const { tier, billingCycle } = await req.json();

    if (!tier || !billingCycle) {
      return NextResponse.json({ error: "Missing tier or billingCycle" }, { status: 400 });
    }

    const planDef = PLAN_DEFINITIONS[tier as PlanTier];
    if (!planDef) {
      return NextResponse.json({ error: "Invalid plan tier" }, { status: 400 });
    }

    // Prepare Paystack Payload
    const amountKobo = billingCycle === "annual" ? planDef.priceAnnualKobo : planDef.priceMonthlyKobo;
    
    if (!amountKobo || amountKobo === 0) {
      // Free or Custom plan
      return NextResponse.json({ error: "Cannot process checkout for this plan via self-serve" }, { status: 400 });
    }

    // Call Paystack API
    const paystackRes = await fetch("https://api.paystack.co/transaction/initialize", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: user.email,
        amount: amountKobo,
        plan: planDef.paystackPlanCode, // Ensure Paystack Plan Code is defined in DB/Consts
        metadata: {
          tenantId: orgMember.org_id,
          tier,
          billingCycle,
        },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/${tenant}/settings/billing`,
      }),
    });

    const data = await paystackRes.json();

    if (!data.status) {
      throw new Error(data.message);
    }

    return NextResponse.json({ authorizationUrl: data.data.authorization_url });
  } catch (error: any) {
    console.error("Checkout Error:", error);
    return NextResponse.json({ error: error.message || "Failed to initialize checkout" }, { status: 500 });
  }
}
