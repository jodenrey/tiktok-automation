import { NextResponse } from "next/server";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe-client";

export const runtime = "nodejs";

async function grantCreditsFromSession(
  tx: Prisma.TransactionClient,
  session: Stripe.Checkout.Session,
) {
  const userId = session.metadata?.userId;
  const creditsRaw = session.metadata?.credits;
  const credits = creditsRaw ? Number.parseInt(creditsRaw, 10) : 0;
  if (!userId || !Number.isFinite(credits) || credits <= 0) {
    console.warn("[stripe] checkout.session.completed missing userId/credits metadata");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? null;

  await tx.user.update({
    where: { id: userId },
    data: {
      purchasedCredits: { increment: credits },
      ...(customerId ? { stripeCustomerId: customerId } : {}),
    },
  });
}

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json(
      { error: "Stripe webhook not configured" },
      { status: 503 },
    );
  }

  const payload = await req.text();
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Missing stripe-signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err) {
    console.error("[stripe] webhook signature", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const exists = await prisma.stripeEvent.findUnique({
    where: { id: event.id },
    select: { id: true },
  });
  if (exists) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await tx.stripeEvent.create({
        data: { id: event.id, type: event.type },
      });
      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        await grantCreditsFromSession(tx, session);
      }
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    console.error("[stripe] webhook handler", err);
    return NextResponse.json({ error: "Handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
