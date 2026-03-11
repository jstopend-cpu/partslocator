export const dynamic = "force-dynamic";
import { NextResponse } from "next/server";
import prisma from "@/database/client";

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      take: 50,
      include: { brand: true, dealer: true },
    });

    const list = Array.isArray(products)
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

    return NextResponse.json(list ?? []);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("[API /api/products] Full error:", error)
    if (error instanceof Error && error.stack) {
      console.error("[API /api/products] Stack:", error.stack)
    }
    if (error && typeof error === "object" && "code" in error) {
      console.error("[API /api/products] Error code/meta:", JSON.stringify(error, null, 2))
    }
    return NextResponse.json([], { status: 503 });
  }
}
