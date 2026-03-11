import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function DELETE(request: NextRequest) {
  try {
    const { id } = await request.json();
    // TODO: prisma.product.delete({ where: { id } }) when implemented
    return Response.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Delete product error:", error);
    return Response.json({ error: message }, { status: 500 });
  }
}