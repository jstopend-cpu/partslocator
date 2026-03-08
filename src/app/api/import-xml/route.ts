import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
try {
const count = await prisma.product.count();
return Response.json({ success: true, total: count });
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}

export async function POST(request: NextRequest) {
try {
const body = await request.json();
const products = body.products || [];

} catch (error: any) { return Response.json({ error: error.message }, { status: 500 }); } }