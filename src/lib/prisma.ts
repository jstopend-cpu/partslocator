import { neonConfig, Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

const NEON_URL =
  "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = () => {
  if (typeof window !== 'undefined') return {} as any

  if (!globalThis.prisma) {
    const connectionString = process.env.DATABASE_URL || NEON_URL
    const neonPool = new Pool({ connectionString })
    const adapter = new PrismaNeon(neonPool as any)
    globalThis.prisma = new PrismaClient({ adapter })
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
