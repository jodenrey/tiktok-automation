"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { STRIPE_CREDIT_PACKS, type StripePackKey } from "@/lib/stripe-packs";

const PACK_ENTRIES = Object.entries(STRIPE_CREDIT_PACKS) as [
  StripePackKey,
  (typeof STRIPE_CREDIT_PACKS)[StripePackKey],
][];

export function BillingBuyButtons() {
  const [loading, setLoading] = useState<StripePackKey | null>(null);

  async function buy(pack: StripePackKey) {
    setLoading(pack);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pack }),
      });
      const json = (await res.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };
      if (!res.ok || !json.url) {
        toast.error(json.error ?? "Could not start checkout");
        return;
      }
      window.location.href = json.url;
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {PACK_ENTRIES.map(([key, cfg]) => (
        <Button
          key={key}
          variant="outline"
          className="min-w-[220px]"
          disabled={loading !== null}
          onClick={() => buy(key)}
        >
          {loading === key ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          {cfg.name} — ${(cfg.cents / 100).toFixed(2)}{" "}
          <span className="text-muted-foreground ml-1">(test)</span>
        </Button>
      ))}
    </div>
  );
}
