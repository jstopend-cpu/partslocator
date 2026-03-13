/**
 * Streams ford.csv with csv-parser and imports rows into MasterProduct via createMany.
 * Run: npx tsx import-ford-csv.ts
 * Requires: DATABASE_URL in .env
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import csv from "csv-parser";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.join(__dirname, "ford.csv");
const CHUNK_SIZE = 5_000;

const PNE_VALUES = new Set(["P.N.E.", "-"]);

function isPne(value: string | undefined): boolean {
  if (value == null) return false;
  const t = String(value).trim();
  return t === "P.N.E." || t === "-";
}

function parsePrice(value: string | undefined): number | null {
  if (value == null) return null;
  const s = String(value).trim().replace(",", ".");
  const n = Number.parseFloat(s);
  return Number.isFinite(n) ? n : null;
}

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const buffer: { partNumber: string; name: string; brand: string; officialMsrp: number }[] = [];
  let totalRowsRead = 0;
  let skippedPne = 0;
  let successfullyImported = 0;
  let pendingFlush: Promise<void> = Promise.resolve();

  function flush(): Promise<void> {
    if (buffer.length === 0) return pendingFlush;
    const batch = buffer.splice(0, buffer.length);
    pendingFlush = pendingFlush
      .then(() => prisma.masterProduct.createMany({ data: batch, skipDuplicates: true }))
      .then(() => {
        successfullyImported += batch.length;
      })
      .catch((err: unknown) => {
        console.error(err);
        process.exit(1);
      });
    return pendingFlush;
  }

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(CSV_PATH, { encoding: "utf8" })
      .pipe(csv({ headers: false }))
      .on("data", (row: Record<string, string>) => {
        totalRowsRead += 1;

        const col13 = row["13"] ?? row[13];
        const col14 = row["14"] ?? row[14];
        if (isPne(col13) || isPne(col14)) {
          skippedPne += 1;
          return;
        }

        const price = parsePrice(col13);
        if (price === null) return;

        const partNumber = String((row["0"] ?? row[0]) ?? "").trim();
        if (!partNumber) return;

        const name = String((row["1"] ?? row[1]) ?? "").trim() || "FORD PART";

        buffer.push({
          partNumber,
          name,
          brand: "Ford",
          officialMsrp: price,
        });

        if (buffer.length >= CHUNK_SIZE) {
          flush();
        }
      })
      .on("end", () => {
        resolve();
      })
      .on("error", reject);
  });

  await flush();

  console.log("--- Import summary ---");
  console.log("Total rows read:", totalRowsRead.toLocaleString());
  console.log("Skipped due to P.N.E. or '-':", skippedPne.toLocaleString());
  console.log("Successfully imported to database:", successfullyImported.toLocaleString());

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
