import { NextResponse } from "next/server";

/**
 * Billing stub for a later Creem integration.
 * This route never charges a card and never grants credits.
 */
export async function POST(req: Request) {
  const secret = process.env.CREEM_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json(
      {
        error: "BILLING_NOT_CONFIGURED",
        message: "Live billing is not enabled. Demo credit grants live under /api/demo.",
      },
      { status: 501 },
    );
  }
  const signature = req.headers.get("x-creem-signature");
  if (signature !== secret) {
    return NextResponse.json({ error: "INVALID_SIGNATURE" }, { status: 401 });
  }
  await req.json().catch(() => null);
  return NextResponse.json({
    ok: true,
    stub: true,
    charged: false,
    message: "Signature checked. Credit grants stay disabled until live billing is implemented.",
  });
}
