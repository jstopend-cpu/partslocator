import { PrismaClient } from '@prisma/client'

const NEON_URL =
  "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = () => {
  if (typeof window !== 'undefined') return {} as any

  if (!globalThis.prisma) {
    const url = process.env.DATABASE_URL || NEON_URL
    // Force engine endpoint; bypasses top-level constructor validation (as any).
    globalThis.prisma = new PrismaClient({
      __internal: {
        engine: {
          endpoint: url,
        },
      },
    } as any)
  }
  return globalThis.prisma
}

const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    const client = getPrisma()
    return (client as any)[prop]
  },
})

export default prisma
