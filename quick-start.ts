import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function main() {
const connectionString = "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"

const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

console.log('--- ENARXI ---')

const brand = await prisma.brand.upsert({
where: { name: 'TOYOTA' },
update: {},
create: { name: 'TOYOTA' },
})
console.log('BRAND_ID:' + brand.id)

const dealer = await prisma.dealer.upsert({
where: { email: 'info@test.gr' },
update: {},
create: {
name: 'KENTRIKI',
email: 'info@test.gr',
location: 'ATHINA'
},
})
console.log('DEALER_ID:' + dealer.id)

console.log('--- TELOS ---')
await prisma.$disconnect()
}

main().catch((e) => console.error(e))