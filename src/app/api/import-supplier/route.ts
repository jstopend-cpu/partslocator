import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { Parser } from "xml2js";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const parser = new Parser({ explicitArray: true, trim: true });

type SupplierXmlItem = {
  ean?: string[];
  name?: string[];
  price?: string[];
  quantity?: string[];
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

function extractItems(root: any): SupplierXmlItem[] {
  const items: SupplierXmlItem[] = [];

  const visit = (node: any) => {
    if (!node || typeof node !== "object") return;
    const maybeItem =
      (node.product as SupplierXmlItem) ||
      (node.item as SupplierXmlItem) ||
      (node.Item as SupplierXmlItem) ||
      (node as SupplierXmlItem);

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
    const formData = await request.formData();
    const supplierNameEntry = formData.get("supplierName");
    const file = formData.get("file");

    const supplierName = supplierNameEntry
      ? String(supplierNameEntry).trim()
      : "";

    if (!supplierName) {
      return Response.json(
        { error: "Missing 'supplierName' field." },
        { status: 400 },
      );
    }

    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Missing XML file (field 'file')." },
        { status: 400 },
      );
    }

    // Upsert supplier (location can be empty string for now)
    const supplier = await prisma.supplier.upsert({
      where: { name: supplierName },
      create: {
        name: supplierName,
        location: "",
      },
      update: {
        name: supplierName,
      },
    });

    let xmlText = await file.text();
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
      console.error("[import-supplier] XML parse error:", parseError);
      if (parseError instanceof Error) {
        console.error("[import-supplier] message:", parseError.message);
        console.error("[import-supplier] stack:", parseError.stack);
      }
      const message =
        parseError instanceof Error ? parseError.message : "XML parse failed";
      return Response.json({ error: message }, { status: 400 });
    }

    const rawItems = extractItems(parsed);

    let processed = 0;
    for (const raw of rawItems) {
      const partNumber = toStringField(raw.ean?.[0]);
      if (!partNumber) continue;

      const quantity = Math.round(toNumberField(raw.quantity?.[0]) ?? 0);

      const supplierPrice = toNumberField(raw.price?.[0]) ?? 0;

      const master = await prisma.masterProduct.findUnique({
        where: { partNumber },
        select: { id: true },
      });

      if (!master) {
        // Master catalog does not know this partNumber; skip quietly
        continue;
      }

      await prisma.supplierStock.upsert({
        where: {
          masterProductId_supplierId: {
            masterProductId: master.id,
            supplierId: supplier.id,
          },
        },
        create: {
          masterProductId: master.id,
          supplierId: supplier.id,
          supplierPrice,
          quantity,
        },
        update: {
          supplierPrice,
          quantity,
        },
      });

      processed += 1;
    }

    return Response.json({
      success: true,
      supplierId: supplier.id,
      supplierName: supplier.name,
      count: processed,
      message: `Successfully processed ${processed} items using ean as part number`,
    });
  } catch (error) {
    console.error("[import-supplier] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}