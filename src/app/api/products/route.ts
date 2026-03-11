import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prisma = getPrisma()
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        take: 50,
        include: { brand: true, dealer: true },
      }),
      prisma.product.count(),
    ]);

    const mapped = Array.isArray(products)
      ? products.map((p) => ({
          id: p.id,
          name: p.name || "Χωρίς Όνομα",
          ean: p.id,
          supplier: p.dealer?.name || "VOLVO",
          price: p.price ?? 0,
          stock: p.stock ?? 0,
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString(),
        }))
      : [];

    return NextResponse.json({
      products: Array.isArray(mapped) ? mapped : [],
      totalCount: typeof totalCount === "number" ? totalCount : 0,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("API products error:", error);
    return NextResponse.json(
      { error: message, products: [], totalCount: 0 },
      { status: 503 }
    );
  }
}
