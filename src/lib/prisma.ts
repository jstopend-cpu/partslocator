import { PrismaClient } from '@prisma/client'

function createPrismaClient(): PrismaClient {
  const url = process.env.DATABASE_URL
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error(
      'DATABASE_URL environment variable is not set. Please add it to your .env file or environment configuration.'
    )
  }
  return new PrismaClient()
}

declare global {
  var prisma: undefined | PrismaClient
}

const prisma = globalThis.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export default prisma
