export const dynamic = "force-dynamic";

export async function GET(request?: any) {
try {
const { prisma } = await import("@/lib/db");
const products = await prisma.product.findMany({
orderBy: { id: 'desc' }
});
return Response.json(products);
} catch (error) {
return Response.json({ error: error.message }, { status: 500 });
}
}