// VERSION 2.0 - FORCE REFRESH
export const dynamic = 'force-dynamic'
import { neonConfig, Pool } from '@neondatabase/serverless'
import { PrismaNeon } from '@prisma/adapter-neon'
import { PrismaClient } from '@prisma/client'
import ws from 'ws'

if (typeof window === 'undefined') {
  neonConfig.webSocketConstructor = ws
}

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = () => {
  if (typeof window !== 'undefined') return {} as any

  if (!globalThis.prisma) {
    console.log('TIMESTAMP_CHECK:', Date.now())
    console.log('DB_CHECK: Attempting connection to Neon...')
    const NEON_URL =
      "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
    const neonPool = new Pool({ connectionString: NEON_URL })
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

export { prisma }

export const query = async (strings: TemplateStringsArray, ...values: unknown[]) => {
  let sql = ''
  strings.forEach((str, i) => {
    sql += str + (values[i] !== undefined ? '$' + (i + 1) : '')
  })
  return getPrisma().$queryRawUnsafe(sql, ...values)
}

export default prisma
