import { NextRequest } from "next/server";
import { Parser } from "xml2js";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const parser = new Parser({ explicitArray: true, trim: true });
const CHUNK_SIZE = 1000;

type MasterXmlItem = {
  ean?: string[];
  name?: string[];
  price?: string[];
  brand?: string[];
};

function toStringField(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s || undefined;
}

function toNumberField(v: unknown): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "number" ? v : Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : undefined;
}

function extractItems(root: any): MasterXmlItem[] {
  const items: MasterXmlItem[] = [];

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    const maybeItem =
      (node.product as MasterXmlItem) ||
      (node.item as MasterXmlItem) ||
      (node.Item as MasterXmlItem) ||
      (node as MasterXmlItem);

    const hasEan =
      maybeItem?.ean != null &&
      (Array.isArray(maybeItem.ean) ? maybeItem.ean.length > 0 : true);
    if (maybeItem && hasEan) {
      items.push(maybeItem);
    }

    Object.values(node).forEach((value) => {
      if (Array.isArray(value)) {
        value.forEach(visit);
      } else if (value && typeof value === "object") {
        visit(value);
      }
    });
  };

  visit(root);
  return items;
}

/**
 * Sanitize XML string: replace bare & with &amp; so they don't break parsing.
 * Leaves existing entities (e.g. &amp;, &lt;, &gt;, &quot;, &apos;, &#123;, &#x7B;) unchanged.
 */
function sanitizeXml(xml: string): string {
  return xml.replace(
    /&(?!amp;|lt;|gt;|quot;|apos;|#\d+;|#x[0-9a-fA-F]+;)/g,
    "&amp;",
  );
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") ?? "";
    let xmlText = "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      if (file && file instanceof File) {
        xmlText = await file.text();
      } else {
        return Response.json(
          { error: "Missing XML file (field 'file')." },
          { status: 400 },
        );
      }
    } else {
      xmlText = await request.text();
    }

    if (!xmlText.trim()) {
      return Response.json(
        { error: "Empty XML payload." },
        { status: 400 },
      );
    }

    const sanitized = sanitizeXml(xmlText);

    let parsed: any;
    try {
      parsed = await parser.parseStringPromise(sanitized);
    } catch (parseError) {
      console.error("[import-master] XML parse error:", parseError);
      if (parseError instanceof Error) {
        console.error("[import-master] message:", parseError.message);
        console.error("[import-master] stack:", parseError.stack);
      }
      const message =
        parseError instanceof Error ? parseError.message : "XML parse failed";
      return Response.json({ error: message }, { status: 400 });
    }
    const rawItems = extractItems(parsed);

    const records: { partNumber: string; name: string; brand: string; officialMsrp: number }[] = [];
    for (const raw of rawItems) {
      const partNumber = toStringField(raw.ean?.[0]);
      if (!partNumber) continue;
      const name = toStringField(raw.name?.[0]) || partNumber;
      const brand = toStringField(raw.brand?.[0]) || "Volvo";
      const officialMsrp = Number.parseFloat(String(raw.price?.[0] ?? "").replace(",", ".")) || 0;
      records.push({ partNumber, name, brand, officialMsrp });
    }

    let processed = 0;
    for (let i = 0; i < records.length; i += CHUNK_SIZE) {
      const chunk = records.slice(i, i + CHUNK_SIZE);
      await prisma.masterProduct.createMany({
        data: chunk,
        skipDuplicates: true,
      });
      processed += chunk.length;
      const chunkNum = Math.floor(i / CHUNK_SIZE) + 1;
      const totalChunks = Math.ceil(records.length / CHUNK_SIZE);
      console.log(
        `[import-master] Chunk ${chunkNum}/${totalChunks}: processed items ${i + 1}-${i + chunk.length} (${chunk.length} items)`,
      );
    }

    return Response.json({
      success: true,
      count: processed,
      message: `Successfully processed ${processed} items using ean as part number`,
    });
  } catch (error) {
    console.error("[import-master] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}