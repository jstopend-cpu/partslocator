export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { query } = await import("@/database/client");
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}