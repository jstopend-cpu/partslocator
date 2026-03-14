import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const products = await prisma.masterProduct.findMany({
      orderBy: { partNumber: "asc" },
      include: {
        stocks: {
          include: {
            supplier: true,
          },
        },
      },
    });
    if (products.length === 0) {
      console.log("[api/products] Returning empty array (no products in database).");
    }
    return NextResponse.json(products);
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    const message = err.message;
    const cause = err.cause != null ? String(err.cause) : undefined;
    const stack = err.stack;

    console.error("[api/products] Database error:", {
      message,
      cause,
      stack,
      name: err.name,
    });
    console.error("[api/products] Full error object:", error);

    return NextResponse.json(
      {
        error: "Database connection failed",
        detail: process.env.NODE_ENV === "development" ? message : undefined,
      },
      { status: 500 }
    );
  }
}
