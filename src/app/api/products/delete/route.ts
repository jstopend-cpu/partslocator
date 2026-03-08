import { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

export async function DELETE(request: NextRequest) {
try {
const { id } = await request.json();

} catch (error: any) {
return Response.json(
{ error: error.message || "Unknown error" },
{ status: 500 }
);
}
}