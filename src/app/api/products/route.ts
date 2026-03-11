import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [], totalCount: 0 });
  }

  if (!prisma) {
    return NextResponse.json({ products: [], totalCount: 0 });
  }

  const db = prisma;

  try {
    const [products, totalCount] = await Promise.all([
      db.product.findMany({
        take: 50,
        include: { brand: true, dealer: true },
      }),
      db.product.count(),
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
    console.error("API products error:", error);
    return NextResponse.json({ products: [], totalCount: 0 }, { status: 200 });
  }
}
