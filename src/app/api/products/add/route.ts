export const dynamic = "force-dynamic";

export async function POST(request: any) {
try {
const { prisma } = await import("@/database/client");
const body = await request.json();
const product = await prisma.product.create({
data: body
});
return Response.json(product);
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}