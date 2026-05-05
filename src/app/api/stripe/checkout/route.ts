import { NextResponse } from "next/server";
import { z } from "zod";

import { withUser } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { appBaseUrl, getStripe } from "@/lib/stripe-client";
import { STRIPE_CREDIT_PACKS, type StripePackKey } from "@/lib/stripe-packs";

const bodySchema = z.object({
  pack: z.enum(["test_25", "test_50"]),
});

export async function POST(req: Request) {
  return withUser(async (userId) => {
    const stripe = getStripe();
    if (!stripe) {
      return NextResponse.json(
        { error: "Stripe is not configured (set STRIPE_SECRET_KEY)" },
        { status: 503 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid pack" }, { status: 422 });
    }

    const packKey = parsed.data.pack as StripePackKey;
    const pack = STRIPE_CREDIT_PACKS[packKey];

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, stripeCustomerId: true },
    });
    if (!user) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const base = appBaseUrl();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: user.stripeCustomerId ?? undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      client_reference_id: userId,
      metadata: {
        userId,
        credits: String(pack.credits),
        pack: packKey,
      },
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: pack.cents,
            product_data: {
              name: pack.name,
              description: pack.description,
            },
          },
        },
      ],
      success_url: `${base}/settings/billing?checkout=success`,
      cancel_url: `${base}/settings/billing?checkout=canceled`,
    });

    return { url: session.url };
  });
}
