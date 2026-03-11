import { NextResponse } from "next/server";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";

const VOLVO_EMAIL = "volvo@parts.loc";

export async function GET() {
  try {
    const dealer = await prisma.dealer.findFirst({
      where: { email: VOLVO_EMAIL },
    });
    const brand = await prisma.brand.findFirst({
      where: { name: "Volvo" },
    });
    if (!dealer || !brand) {
      return NextResponse.json(
        { error: "Volvo dealer or brand not found. Run import-xml once to create them." },
        { status: 400 }
      );
    }

    const result = await prisma.product.updateMany({
      data: {
        dealerId: dealer.id,
        brandId: brand.id,
      },
    });

    return NextResponse.json({
      success: true,
      updated: result.count,
      message: `Set supplier to Volvo for ${result.count} products.`,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Fix-brands error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
