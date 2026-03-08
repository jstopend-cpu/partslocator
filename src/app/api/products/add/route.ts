export const dynamic = "force-dynamic";

export async function POST(request: any) {
try {
const { prisma } = await import("@/lib/db");
const body = await request.json();
const product = await prisma.product.create({
data: body
});
return Response.json(product);
} catch (error) {
return Response.json({ error: error.message }, { status: 500 });
}
}