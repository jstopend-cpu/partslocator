import { NextRequest } from "next/server";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";
    const limit = Math.min(
      Math.max(1, parseInt(searchParams.get("limit") ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT),
      MAX_LIMIT,
    );

    const products = await prisma.masterProduct.findMany({
      where:
        q.length > 0
          ? {
              OR: [
                { partNumber: { contains: q, mode: "insensitive" } },
                { name: { contains: q, mode: "insensitive" } },
                { brand: { contains: q, mode: "insensitive" } },
              ],
            }
          : undefined,
      orderBy: { partNumber: "asc" },
      take: q.length > 0 ? limit : 0,
      include: {
        stocks: {
          include: {
            supplier: true,
          },
        },
      },
    });

    return Response.json(products);
  } catch (error) {
    console.error("[master-products] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}