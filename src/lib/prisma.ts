import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const getPrisma = () => {
  if (typeof window !== 'undefined') return {} as any

  if (!globalThis.prisma) {
    // DATABASE_URL is set in env; empty constructor avoids 'Unknown property datasources' in Prisma 7.
    globalThis.prisma = new PrismaClient()
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
