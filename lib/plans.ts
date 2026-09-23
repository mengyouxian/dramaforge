export const PLAN_IDS = [
  "free",
  "pro",
  "business",
  "demo_pro",
  "demo_business",
] as const;

export type PlanId = (typeof PLAN_IDS)[number];

/** Placeholder pools. Business marketing copy stays qualitative; this is the demo grant ceiling. */
export const PLAN_CREDITS: Record<PlanId, number> = {
  free: 150_000,
  pro: 900_000,
  business: 1_800_000,
  demo_pro: 900_000,
  demo_business: 1_800_000,
};

export const PUBLIC_PLANS = [
  {
    id: "free" as const,
    price: "$0",
    credits: PLAN_CREDITS.free,
    period: "once" as const,
  },
  {
    id: "pro" as const,
    price: "$29.99",
    credits: PLAN_CREDITS.pro,
    period: "month" as const,
  },
  {
    id: "business" as const,
    price: "$59.99",
    credits: null,
    period: "month" as const,
  },
];

export function planAllowsMultiWorld(plan: PlanId) {
  return plan === "business" || plan === "demo_business";
}
