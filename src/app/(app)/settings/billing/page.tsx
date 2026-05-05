import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { BillingBuyButtons } from "@/components/billing-buy-buttons";
import { getStripe } from "@/lib/stripe-client";

interface PageProps {
  searchParams: Promise<{ checkout?: string }>;
}

export default async function BillingPage({ searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const userId = (session.user as { id: string }).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true, purchasedCredits: true, stripeCustomerId: true },
  });
  if (!user) redirect("/login");

  const sp = await searchParams;
  const checkout = sp.checkout;
  const stripeReady = !!getStripe();

  return (
    <div className="mx-auto max-w-3xl px-8 py-10">
      <Button asChild variant="ghost" size="sm" className="mb-4 -ml-2">
        <Link href="/settings">← Settings</Link>
      </Button>

      <h1 className="text-2xl font-semibold tracking-tight">Billing & credits</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Buy one-time credits with Stripe Checkout (test mode recommended).
      </p>

      {checkout === "success" && (
        <Card className="mt-6 border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="py-4 text-sm text-emerald-200">
            Payment completed. Credits are added via webhook — refresh your credits in a moment
            if they do not appear yet.
          </CardContent>
        </Card>
      )}
      {checkout === "canceled" && (
        <Card className="mt-6 border-amber-500/25 bg-amber-500/5">
          <CardContent className="py-4 text-sm text-amber-200">
            Checkout was canceled. Nothing was charged.
          </CardContent>
        </Card>
      )}

      <Card className="mt-6">
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">Balances</CardTitle>
            <CardDescription>Monthly allotment + purchased rollover.</CardDescription>
          </div>
          <Badge variant={stripeReady ? "success" : "outline"}>
            Stripe {stripeReady ? "configured" : "missing keys"}
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm md:grid-cols-3">
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs text-muted-foreground">Monthly credits</div>
            <div className="mt-1 text-2xl font-semibold">{user.credits}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs text-muted-foreground">Purchased credits</div>
            <div className="mt-1 text-2xl font-semibold">{user.purchasedCredits}</div>
          </div>
          <div className="rounded-lg border border-white/10 p-4">
            <div className="text-xs text-muted-foreground">Stripe customer</div>
            <div className="mt-1 font-mono text-xs break-all">
              {user.stripeCustomerId ?? "—"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Credit packs</CardTitle>
          <CardDescription>
            Use Stripe test cards (e.g. <code className="text-xs">4242</code>). Webhooks must reach
            <code className="ml-1 text-xs">/api/stripe/webhook</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {!stripeReady ? (
            <p className="text-sm text-muted-foreground">
              Set <code>STRIPE_SECRET_KEY</code> and <code>STRIPE_WEBHOOK_SECRET</code>{" "}
              in <code>.env</code>, restart the server, then return here.
            </p>
          ) : (
            <BillingBuyButtons />
          )}
          <pre className="rounded-lg bg-black/40 p-4 text-[11px] leading-relaxed text-muted-foreground overflow-x-auto whitespace-pre-wrap">
            {[
              "# Local webhook forwarding (recommended):",
              "stripe login",
              "stripe listen --forward-to localhost:3000/api/stripe/webhook",
              "",
              '# Copy the webhook signing secret into .env:',
              "# STRIPE_WEBHOOK_SECRET=whsec_...",
            ].join("\n")}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}
