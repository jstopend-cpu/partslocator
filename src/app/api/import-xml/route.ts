export const dynamic = "force-dynamic";

export async function GET() {
try {
const { prisma } = await import("@/lib/db");
const count = await prisma.product.count();
return Response.json({ success: true, total: count });
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}

export async function POST(request: Request) {
try {
const { prisma } = await import("@/lib/db");
return Response.json({ success: true, message: "Ready for XML" });
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}