import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = (): PrismaClient => {
  if (globalThis.prisma) return globalThis.prisma

  const dbUrl =
    process.env.DATABASE_URL ||
    "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

  const client = new PrismaClient({
    datasources: {
      db: {
        url: dbUrl,
      },
    },
  } as any)

  if (process.env.NODE_ENV !== 'production') globalThis.prisma = client
  return client
}

// Lazy proxy: no PrismaClient is created until first property access (e.g. in a request handler).
const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    return (getPrisma() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export default prisma
