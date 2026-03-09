import { PrismaClient } from '@prisma/client'

// Ορίζουμε το URL σε μια σταθερά
const connectionString = "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const prismaClientSingleton = () => {
return new PrismaClient({
// Χρησιμοποιούμε το standard αντικείμενο που περιμένει η Prisma
datasources: {
db: {
url: connectionString,
},
},
} as any) // Το "as any" θα σταματήσει το TypeScript από το να παραπονιέται στο build
}

declare global {
var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma