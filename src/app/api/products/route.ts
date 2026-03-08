export const dynamic = "force-dynamic";

export async function GET() {
try {
const { prisma } = await import("@/lib/db");
const products = await prisma.product.findMany();
return Response.json(products);
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}