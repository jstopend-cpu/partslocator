import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Cannot run seed.");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const AUTO_PARTS = [
  { partNumber: "OLF-001", name: "Φίλτρο Λαδιού", brand: "Generic", officialMsrp: 12.5 },
  { partNumber: "BRK-002", name: "Τακάκια Φρένων (πρόσθια)", brand: "Generic", officialMsrp: 89.0 },
  { partNumber: "AIR-003", name: "Φίλτρο Αέρα Κινητήρα", brand: "Generic", officialMsrp: 18.0 },
  { partNumber: "SPK-004", name: "Μπουζί", brand: "Generic", officialMsrp: 8.5 },
  { partNumber: "BAT-005", name: "Μπαταρία 12V 45Ah", brand: "Generic", officialMsrp: 65.0 },
  { partNumber: "WIP-006", name: "Υαλοκαθαριστήρες (ζευγάρι)", brand: "Generic", officialMsrp: 22.0 },
  { partNumber: "OIL-007", name: "Λάδι Κινητήρα 5W-30 (5L)", brand: "Generic", officialMsrp: 35.0 },
  { partNumber: "FLT-008", name: "Φίλτρο Καμπίνας", brand: "Generic", officialMsrp: 14.0 },
  { partNumber: "BLB-009", name: "Λάμπα Πίσω Φαναριού", brand: "Generic", officialMsrp: 6.0 },
  { partNumber: "BELT-010", name: "Ιμάντας Σερπαντίνης", brand: "Generic", officialMsrp: 42.0 },
];

async function main() {
  console.log("Seeding MasterProduct with", AUTO_PARTS.length, "auto parts...");
  for (const part of AUTO_PARTS) {
    await prisma.masterProduct.upsert({
      where: { partNumber: part.partNumber },
      create: part,
      update: { name: part.name, brand: part.brand, officialMsrp: part.officialMsrp },
    });
  }
  console.log("Seed completed. Products in DB:", await prisma.masterProduct.count());
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
