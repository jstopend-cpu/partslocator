export const dynamic = "force-dynamic";

export async function DELETE(request: any) {
try {
const { prisma } = await import("@/lib/db");
const { id } = await request.json();
await prisma.product.delete({
where: { id: String(id) }
});
return Response.json({ success: true });
} catch (error) {
return Response.json({ error: error.message }, { status: 500 });
}
}