import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

export async function GET() {
  try {
    const prisma = (await import("@/database/client")).default;
    const count = await prisma.product.count();
    return Response.json({ success: true, total: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Import-xml GET error:", error);
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const prisma = (await import("@/database/client")).default;
    const body = await request.json();
    const products = body.products || [];
    // ... rest of POST logic when implemented
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Import-xml POST error:", error);
    return Response.json({ error: message }, { status: 503 });
  }
}