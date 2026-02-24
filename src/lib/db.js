import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Please configure your database connection string."
  );
}

// Δημιουργούμε ένα Neon SQL client πάνω στο DATABASE_URL
const sql = neon(process.env.DATABASE_URL);

// Εξάγουμε μια συνάρτηση query που τυλίγει τον neon client
export function query(strings, ...values) {
  // Υποστηρίζει tagged template usage: query`SELECT ... WHERE id = ${id}`
  return sql(strings, ...values);
}

