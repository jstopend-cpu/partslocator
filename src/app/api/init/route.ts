export const dynamic = "force-dynamic";

export async function GET() {
try {
const { query } = await import("@/lib/db");

} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}