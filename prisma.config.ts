import { defineConfig } from 'prisma';

export default defineConfig({
  schema: './prisma/schema.prisma',
  url: process.env.DATABASE_URL, // Αυτή η γραμμή είναι το "κλειδί"
});