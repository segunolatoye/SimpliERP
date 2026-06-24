import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/db";

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-paystack-signature");

    // Verify Signature
    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET)
      .update(rawBody)
      .digest("hex");

    if (hash !== signature) {
      return new NextResponse("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(rawBody);

    // Handle Events
    switch (event.event) {
      case "charge.success": {
        const { metadata, plan } = event.data;
        if (!metadata || !metadata.tenantId) break;

        const tenantId = metadata.tenantId;

        // Log Billing Event
        await prisma.billing_events.create({
          data: {
            tenantId,
            type: "payment_succeeded",
            paystackRef: event.data.reference,
            metadata: event.data as any,
          },
        });

        // Update Subscription (in a real scenario, map Paystack plan to internal plan ID)
        const activePlan = await prisma.plans.findFirst({
          where: { tier: metadata.tier }
        });

        if (activePlan) {
          await prisma.subscriptions.upsert({
            where: { tenantId },
            update: {
              status: "active",
              planId: activePlan.id,
              billingCycle: metadata.billingCycle,
              paystackCustomerCode: event.data.customer.customer_code,
            },
            create: {
              tenantId,
              status: "active",
              planId: activePlan.id,
              billingCycle: metadata.billingCycle,
              paystackCustomerCode: event.data.customer.customer_code,
            },
          });
        }
        break;
      }
      case "invoice.payment_failed": {
        const { customer } = event.data;
        // Map customer code to tenant
        const sub = await prisma.subscriptions.findFirst({
          where: { paystackCustomerCode: customer.customer_code }
        });

        if (sub) {
          await prisma.subscriptions.update({
            where: { id: sub.id },
            data: { status: "past_due" }
          });

          await prisma.billing_events.create({
            data: {
              tenantId: sub.tenantId,
              type: "payment_failed",
              paystackRef: event.data.reference,
              metadata: event.data as any,
            },
          });
        }
        break;
      }
    }

    return new NextResponse("Webhook received", { status: 200 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse("Webhook processing failed", { status: 500 });
  }
}
