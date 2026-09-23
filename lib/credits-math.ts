/**
 * Fixed-tier credit math for the demo.
 *
 * Placeholder rates — calibrate with measured p50/p90 model cost before launch.
 * Do not treat these numbers as a production price list.
 *
 * Token formula (not used by the live job charge yet):
 *   credit_usd   = monthly_price_usd / monthly_credits
 *   credits      = ceil(raw_cost_usd * SAFETY_MARGIN / credit_usd)
 *   SAFETY_MARGIN >= 2
 */

export const FAILURE_REFUND_RATIO = 0.8;
export const DEFAULT_CREDITS_PER_1K = 1500;
export const MIN_JOB_CREDITS = 3000;
export const MAX_SOURCE_CHARS = 100_000;
export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
export const MULTI_WORLD_MULTIPLIER = 1.4;
export const EXPORT_CREDITS = 0;
export const DEMO_GRANT_AMOUNT = 150_000;

export type EstimateOptions = {
  multiWorld?: boolean;
};

export function estimateCredits(
  inputChars: number,
  options: EstimateOptions,
  per1k: number = DEFAULT_CREDITS_PER_1K,
) {
  const units = Math.max(1, Math.ceil(Math.max(0, inputChars) / 1000));
  let credits = Math.max(MIN_JOB_CREDITS, units * per1k);
  if (options.multiWorld) {
    credits = Math.ceil(credits * MULTI_WORLD_MULTIPLIER);
  }
  return credits;
}

/** Future calibration helper. Live jobs use estimateCredits(), not this. */
export function creditsFromTokenCost(input: {
  rawCostUsd: number;
  monthlyPriceUsd: number;
  monthlyCredits: number;
  safetyMargin?: number;
}) {
  const margin = Math.max(2, input.safetyMargin ?? 2);
  const creditUsd = input.monthlyPriceUsd / input.monthlyCredits;
  if (!(creditUsd > 0)) return 0;
  return Math.ceil((input.rawCostUsd * margin) / creditUsd);
}
