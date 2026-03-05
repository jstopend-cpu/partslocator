import { query } from "@/lib/db";

async function initializeProducts() {
// 1. Δημιουργία πίνακα αν δεν υπάρχει
await queryCREATE TABLE IF NOT EXISTS products ( id SERIAL PRIMARY KEY, name TEXT NOT NULL, ean TEXT NOT NULL UNIQUE, supplier TEXT NOT NULL, price DECIMAL(10, 2) NOT NULL, stock INTEGER NOT NULL );;

// 2. Έλεγχος αν είναι άδειος
// @ts-ignore
const rows: any = await querySELECT COUNT(*)::int AS count FROM products;;

const count = Number(rows?.[0]?.count ?? 0);

// 3. Εισαγωγή αρχικών δεδομένων μόνο αν η βάση είναι άδεια
if (count === 0) {
await queryINSERT INTO products (name, ean, supplier, price, stock) VALUES  ('Directed DB3 Bypass Module', '9990000000012', 'Directed', 129.90, 15), ('Directed DS4 Remote Start System', '9990000000013', 'Directed', 249.00, 8), ('Directed DS4+ Premium Kit', '9990000000014', 'Directed', 329.00, 5), ('Directed High-Power Siren', '9990000000015', 'Directed', 59.90, 24), ('Directed Digital Shock Sensor', '9990000000016', 'Directed', 44.50, 32) ON CONFLICT (ean) DO NOTHING;;
}

return {
success: true,
created: count === 0,
total: count === 0 ? 5 : count,
};
}

export async function GET() {
try {
const result = await initializeProducts();
return Response.json(result);
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}

export async function POST() {
try {
const result = await initializeProducts();
return Response.json(result);
} catch (error: any) {
return Response.json({ error: error.message }, { status: 500 });
}
}