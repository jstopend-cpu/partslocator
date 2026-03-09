import { PrismaClient } from '@prisma/client'

const DATABASE_URL = "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const prismaClientSingleton = () => {
return new PrismaClient({
datasources: {
db: {
url: DATABASE_URL,
},
},
} as any)
}

declare global {
var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma