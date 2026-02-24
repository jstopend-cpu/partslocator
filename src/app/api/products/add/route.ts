import { query } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, ean, supplier, price, stock } = body ?? {};

    if (!name || !ean || !supplier || price === undefined || stock === undefined) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const numericPrice = Number(price);
    const numericStock = Number(stock);

    if (Number.isNaN(numericPrice) || Number.isNaN(numericStock)) {
      return new Response(
        JSON.stringify({ error: "Price and stock must be numeric" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const rows = await query<
      { id: number }[]
    >`
      INSERT INTO products (name, ean, supplier, price, stock)
      VALUES (${name}, ${ean}, ${supplier}, ${numericPrice}, ${numericStock})
      RETURNING id;
    `;

    const insertedId = rows[0]?.id;

    return new Response(
      JSON.stringify({ id: insertedId }),
      { status: 201, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Error inserting product", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}

