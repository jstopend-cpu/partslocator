import { PrismaClient } from '@prisma/client'

function createPrismaClient(): PrismaClient | null {
  try {
    return new PrismaClient()
  } catch {
    return null
  }
}

declare global {
  var prisma: undefined | PrismaClient | null
}

const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production' && prisma) globalThis.prisma = prisma

export default prisma