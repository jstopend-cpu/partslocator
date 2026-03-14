import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const PAGE_SIZE = 20;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
    const search = searchParams.get("search")?.trim() ?? searchParams.get("q")?.trim() ?? "";
    const skip = (page - 1) * PAGE_SIZE;

    const where = search
      ? {
          OR: [
            { partNumber: { contains: search, mode: "insensitive" as const } },
            { name: { contains: search, mode: "insensitive" as const } },
            { brand: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : undefined;

    const [products, totalCount] = await Promise.all([
      prisma.masterProduct.findMany({
        where,
        orderBy: { partNumber: "asc" },
        take: PAGE_SIZE,
        skip,
        include: {
          stocks: {
            include: {
              supplier: true,
            },
          },
        },
      }),
      prisma.masterProduct.count({ where }),
    ]);

    if (products.length === 0) {
      console.log("[api/products] Returning empty array.", { page, search: search || "(none)", totalCount });
    }

    const response = NextResponse.json(products);
    response.headers.set("X-Total-Count", String(totalCount));
    return response;
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
