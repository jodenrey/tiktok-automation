/** Test-mode credit packs — small USD amounts for Stripe test cards. */
export const STRIPE_CREDIT_PACKS = {
  test_25: {
    cents: 499,
    credits: 25,
    name: "25 export credits (test)",
    description: "One-time purchased credits (test mode)",
  },
  test_50: {
    cents: 999,
    credits: 50,
    name: "50 export credits (test)",
    description: "One-time purchased credits (test mode)",
  },
} as const;

export type StripePackKey = keyof typeof STRIPE_CREDIT_PACKS;
