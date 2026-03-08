import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
// Στην Prisma 7, η σύνδεση διαβάζεται αυτόματα από το περιβάλλον
// ή ορίζεται μέσω του prisma.config.ts
return new PrismaClient()
}

declare global {
var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma