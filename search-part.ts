import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

async function search(partNo: string) {
const connectionString = "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

console.log('--- ANAZITISI GIA: ' + partNo + ' ---')

const product = await prisma.product.findFirst({
where: {
partNumber: partNo
},
include: {
brand: true,
dealer: true
}
})

if (product) {
console.log('VRETHIKE!')
console.log('ONOMA: ' + product.name)
console.log('MARKA: ' + product.brand.name)
console.log('TIMI: ' + product.price + ' EUR')
console.log('APOTHEMA: ' + product.stock)
console.log('PROMITHEFTIS: ' + product.dealer.name)
console.log('TOPOTHESIA: ' + product.dealer.location)
} else {
console.log('TO ANTALLAKTIKO DEN VRETHIKE STI VASI.')
}

await prisma.$disconnect()
await pool.end()
}

// Πάρε τον κωδικό από την εντολή που γράφεις στο τερματικό
const args = process.argv.slice(2)
const searchCode = args[0]

if (!searchCode) {
console.log('Parakalo grapse enan kodiko. PX: npx tsx search-part.ts 1161059')
} else {
search(searchCode)
}