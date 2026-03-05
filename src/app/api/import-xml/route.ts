import { query } from "@/lib/db";

export async function POST(request: Request) {
try {
const { xmlText } = await request.json();

} catch (error: any) {
console.error("Import Error:", error);
return new Response(JSON.stringify({ error: error.message || "Internal Server Error" }), { status: 500 });
}
}