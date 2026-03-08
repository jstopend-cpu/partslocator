import { defineConfig } from '@prisma/config';

export default defineConfig({
  datasource: {
    // Πρώτα κοιτάμε το νέο όνομα, μετά το παλιό
    url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
  },
});