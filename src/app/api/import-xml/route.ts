import { query } from "@/lib/db";

export async function GET() {
try {
// @ts-ignore
const products: any = await querySELECT id, name, ean, supplier, price, stock  FROM products  ORDER BY id DESC;;

} catch (error) {
console.error("Error fetching products", error);
return new Response(
JSON.stringify({ error: "Internal server error" }),
{ status: 500, headers: { "Content-Type": "application/json" } }
);
}
}