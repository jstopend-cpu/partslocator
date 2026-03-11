import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = (): PrismaClient => {
  if (globalThis.prisma) return globalThis.prisma

  const client = new PrismaClient()
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
