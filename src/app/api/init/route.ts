export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const prisma = (await import("@/database/client")).default;
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}