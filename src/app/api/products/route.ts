export const dynamic = "force-dynamic";

import { query } from "@/lib/db";

export async function GET() {
  // @ts-ignore - query helper is untyped, cast result manually
  const products = (await query`
    SELECT id, name, ean, supplier, price::text, stock
    FROM products
    ORDER BY id DESC;
  `) as {
    id: number;
    name: string;
    ean: string;
    supplier: string;
    price: string;
    stock: number;
  }[];

  return Response.json(products);
}

