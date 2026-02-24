import { query } from "@/lib/db";

export async function GET() {
  const products = await query<
    {
      id: number;
      name: string;
      ean: string;
      supplier: string;
      price: string;
      stock: number;
    }[]
  >`
    SELECT id, name, ean, supplier, price::text, stock
    FROM products
    ORDER BY id DESC;
  `;

  return Response.json(products);
}

