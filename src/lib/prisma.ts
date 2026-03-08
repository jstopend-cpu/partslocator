import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
const url = process.env.DATABASE_URL

if (!url) {
return new PrismaClient()
}

return new PrismaClient({
datasourceUrl: url
})
}

declare global {
var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma