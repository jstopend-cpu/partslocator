import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createOrder } from "@/app/actions/orders";

export const dynamic = "force-dynamic";

export type CheckoutBody = {
  shipping?: {
    shippingName?: string;
    shippingAddress?: string;
    shippingCity?: string;
    shippingPostalCode?: string;
    shippingPhone?: string;
  };
};

/**
 * POST /api/checkout
 * Creates master order + sub-orders per supplier and triggers supplier notifications.
 * Body: { shipping?: { shippingName, shippingAddress, ... } }
 */
export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { ok: false, error: "Πρέπει να είστε συνδεδεμένοι." },
      { status: 401 },
    );
  }

  let body: CheckoutBody | null = null;
  try {
    body = await req.json();
  } catch {
    // no body is ok
  }

  const shipping = body?.shipping ?? undefined;
  const result = await createOrder(shipping ?? null);

  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error },
      { status: 400 },
    );
  }

  return NextResponse.json({ ok: true, orderId: result.orderId });
}
