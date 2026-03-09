import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'
import fs from 'fs'
import { XMLParser } from 'fast-xml-parser'

async function main() {
const connectionString = "postgresql://neondb_owner:npg_KNEMJt9qIZy0@ep-wild-darkness-ad7dmhn8-pooler.c-2.us-east-1.aws.neon.tech/neondb?sslmode=require"
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

console.log('--- ENARXI MAZIKIS EISAGOGIS (22.568 ITEMS) ---')

const brand = await prisma.brand.upsert({ where: { name: 'VOLVO' }, update: {}, create: { name: 'VOLVO' } })
const dealer = await prisma.dealer.findFirst({ where: { email: 'info@test.gr' } })

if (!dealer) { console.log("Dealer not found!"); return; }

const xmlData = fs.readFileSync('products.xml', 'utf8')
const parser = new XMLParser()
const jObj = parser.parse(xmlData)
const items = jObj.products.item

console.log('Fortothikan ' + items.length + ' proionta apo to XML. Ksekinaei i apostoli...')

// Metatropi olon ton dedomenon se morfi gia tin Prisma
const dataToInsert = items.map((item: any) => ({
id: String(item.ean),
partNumber: String(item.ean),
name: String(item.name).substring(0, 191), // Periorismos haraktiron an hrezetai
price: parseFloat(item.price) || 0,
stock: parseInt(item.stock) || 0,
brandId: brand.id,
dealerId: dealer.id
}))

// Maziki eisagogi (Create Many) - Poly pio grigoro!
// To skipDuplicates: true simainei oti an yparhei idi o kodikos den tha stamatisei me sfalma
const result = await prisma.product.createMany({
data: dataToInsert,
skipDuplicates: true,
})

console.log('Eisihthisan ' + result.count + ' nea proionta!')
console.log('--- OLOIKLIROTHIKE ---')

await prisma.$disconnect()
await pool.end()
}

main().catch(e => console.error(e))