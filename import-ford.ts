/**
 * Streams ford.xml with sax and imports items into MasterProduct via createMany.
 * Run: npx tsx import-ford.ts   (or: node --loader ts-node/esm import-ford.ts)
 * Requires: DATABASE_URL in .env
 */
import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const sax = require("sax");
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const XML_PATH = path.join(__dirname, "ford.xml");
const CHUNK_SIZE = 5_000;
const TOTAL_ESTIMATE = 643_524;

type RawItem = { ean: string; name: string; price: string };

function main(): void {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is required");
  }
  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const parser = sax.createStream(false, { trim: true, lowercase: true });
  const fileStream = fs.createReadStream(XML_PATH, { encoding: "utf8" });

  const tagStack: string[] = [];
  let currentItem: RawItem | null = null;
  const buffer: { partNumber: string; name: string; brand: string; officialMsrp: number }[] = [];
  let totalProcessed = 0;
  let pendingFlush: Promise<void> = Promise.resolve();

  parser.on("opentag", (tag: { name: string }) => {
    tagStack.push(tag.name);
    if (tag.name === "item") {
      currentItem = { ean: "", name: "", price: "" };
    }
  });

  parser.on("text", (text: string) => {
    if (!currentItem || tagStack.length === 0) return;
    const top = tagStack[tagStack.length - 1];
    if (top === "ean" || top === "name" || top === "price") {
      (currentItem as Record<string, string>)[top] += text;
    }
  });

  parser.on("closetag", (tagName: string) => {
    if (tagStack.length > 0) tagStack.pop();
    if (tagName === "item" && currentItem) {
      const partNumber = currentItem.ean.trim();
      if (!partNumber) {
        currentItem = null;
        return;
      }
      const name = currentItem.name.trim() || partNumber;
      const officialMsrp = Number.parseFloat(currentItem.price.replace(",", ".")) || 0;
      buffer.push({
        partNumber,
        name,
        brand: "Ford",
        officialMsrp,
      });
      currentItem = null;

      if (buffer.length >= CHUNK_SIZE) {
        flush();
      }
    }
  });

  function flush(): Promise<void> {
    if (buffer.length === 0) return pendingFlush;
    const batch = buffer.splice(0, buffer.length);
    pendingFlush = pendingFlush
      .then(() => prisma.masterProduct.createMany({ data: batch, skipDuplicates: true }))
      .then(() => {
        totalProcessed += batch.length;
        const pct = ((totalProcessed / TOTAL_ESTIMATE) * 100).toFixed(1);
        console.log(
          `Processed ${totalProcessed.toLocaleString()} / ${TOTAL_ESTIMATE.toLocaleString()} (${pct}%)...`,
        );
      })
      .catch((err: unknown) => {
        parser.removeAllListeners();
        fileStream.destroy();
        console.error(err);
        process.exit(1);
      });
    return pendingFlush;
  }

  parser.on("end", () => {
    flush().then(() => {
      console.log(`Done. Total processed: ${totalProcessed.toLocaleString()} items.`);
      prisma.$disconnect();
    });
  });

  parser.on("error", (err: Error) => {
    console.error("Parse error:", err);
    fileStream.destroy();
    process.exit(1);
  });

  fileStream.on("error", (err: Error) => {
    console.error("File error:", err);
    process.exit(1);
  });

  fileStream.pipe(parser);
}

main();
