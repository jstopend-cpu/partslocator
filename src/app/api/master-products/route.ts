import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

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

    return Response.json(products);
  } catch (error) {
    console.error("[master-products] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}