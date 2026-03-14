import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import { Parser } from "xml2js";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

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
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
    }
    const contentType = request.headers.get("content-type") ?? "";
    let xmlText = "";

    // Extract category, brand, and file from body (formData)
    let categoryId = "";
    let categoryName = "";
    let brandId = "";
    let brandName = "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file");
      const cId = formData.get("categoryId");
      const cName = formData.get("categoryName");
      const bId = formData.get("brandId");
      const bName = formData.get("brandName");
      if (typeof cId === "string" && cId.trim()) categoryId = cId.trim();
      if (typeof cName === "string" && cName.trim()) categoryName = cName.trim();
      if (typeof bId === "string" && bId.trim()) brandId = bId.trim();
      if (typeof bName === "string" && bName.trim()) brandName = bName.trim();
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

    if (!brandId || !brandName) {
      return Response.json(
        { error: "Category and Brand are required. Select both from the dropdowns." },
        { status: 400 },
      );
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
      const officialMsrp = Number.parseFloat(String(raw.price?.[0] ?? "").replace(",", ".")) || 0;
      records.push({
        partNumber,
        name,
        brand: brandName,
        officialMsrp,
      });
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

    // After the import loop, create an UpdateLog record (category + brand for audit trail)
    const user = await currentUser();
    const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim()
      || user?.emailAddresses?.[0]?.emailAddress
      || userId;
    await prisma.updateLog.create({
      data: {
        userId,
        userName: displayName,
        categoryId: categoryId || undefined,
        categoryName: categoryName || undefined,
        brandId: brandId || undefined,
        brandName: brandName || undefined,
      },
    });

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