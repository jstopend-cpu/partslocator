import { query } from "@/lib/db";

async function initializeProducts() {
  // Create products table if it doesn't exist
  await query`
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      ean TEXT NOT NULL,
      supplier TEXT NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      stock INTEGER NOT NULL
    );
  `;

  const rows = await query`
    SELECT COUNT(*)::int AS count
    FROM products;
  `;

  const count = Number(rows[0]?.count ?? 0);

  if (count === 0) {
    await query`
      INSERT INTO products (name, ean, supplier, price, stock)
      VALUES
        ('Directed DB3 Bypass Module', '9990000000012', 'Directed', 129.90, 15),
        ('Directed DS4 Remote Start System', '9990000000013', 'Directed', 249.00, 8),
        ('Directed DS4+ Premium Kit', '9990000000014', 'Directed', 329.00, 5),
        ('Directed High-Power Siren', '9990000000015', 'Directed', 59.90, 24),
        ('Directed Digital Shock Sensor', '9990000000016', 'Directed', 44.50, 32);
    `;
  }

  return {
    created: count === 0,
    total: count || 5,
  };
}

export async function GET() {
  const result = await initializeProducts();
  return Response.json(result);
}

export async function POST() {
  const result = await initializeProducts();
  return Response.json(result);
}

