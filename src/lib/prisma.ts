import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = (): PrismaClient => {
  const NEON_URL =
    "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8.us-east-1.aws.neon.tech/neondb?sslmode=require"

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = NEON_URL
  }

  if (globalThis.prisma) return globalThis.prisma

  const client = new PrismaClient()

  if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = client
  }
  return client
}

const prisma = new Proxy({} as PrismaClient, {
  get: (_target, prop) => {
    const client = getPrisma()
    return (client as any)[prop]
  },
})

export default prisma
