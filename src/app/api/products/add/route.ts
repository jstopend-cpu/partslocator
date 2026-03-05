import { query } from "@/lib/db";

export async function POST(request: Request) {
try {
const body = await request.json();
const { name, ean, supplier, price, stock } = body ?? {};

} catch (error) {
console.error("Error inserting product", error);
return new Response(
JSON.stringify({ error: "Internal server error" }),
{ status: 500, headers: { "Content-Type": "application/json" } },
);
}
}