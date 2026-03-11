import { defineConfig } from 'prisma/config'
import { PrismaNeon } from '@prisma/adapter-neon'

const connectionString =
  'postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require'

export default defineConfig({
  adapter: () => new PrismaNeon({ connectionString }),
} as import('prisma/config').PrismaConfig)
