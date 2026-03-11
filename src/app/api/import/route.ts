import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { dealerId, brandId, products } = await req.json();
    // TODO: use prisma when import logic is implemented
    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Import error:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}