export const dynamic = "force-dynamic";

async function handleInit() {
  try {
    const prisma = (await import("@/database/client")).default;
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ ok: true });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  return handleInit();
}

export async function POST() {
  return handleInit();
}