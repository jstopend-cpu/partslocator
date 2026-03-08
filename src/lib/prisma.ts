import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
const url = process.env.DATABASE_URL

if (!url) {
// Κατά το build time στη Vercel, το URL μπορεί να είναι κενό.
// Επιστρέφουμε έναν dummy client για να μην σταματήσει το build.
return new PrismaClient()
}

return new PrismaClient({
datasources: {
db: { url }
}
})
}

declare global {
var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

export default prisma

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma