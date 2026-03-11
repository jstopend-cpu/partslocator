import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    if (!prisma) {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }
    const count = await prisma.product.count();
    return Response.json({ success: true, total: count });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = (await import("@/lib/prisma")).default;
    if (!prisma) {
      return Response.json({ error: "Database unavailable" }, { status: 503 });
    }
    const body = await request.json();
    const products = body.products || [];
    // ... rest of POST logic when implemented
    return Response.json({ success: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}