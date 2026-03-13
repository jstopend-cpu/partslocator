import { NextRequest } from "next/server";
import { Parser } from "xml2js";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const parser = new Parser({ explicitArray: false, trim: true });

type MasterXmlItem = {
  partNumber?: string;
  PartNumber?: string;
  code?: string;
  Code?: string;
  name?: string;
  Name?: string;
  description?: string;
  Description?: string;
  brand?: string;
  Brand?: string;
  msrp?: string | number;
  MSRP?: string | number;
  officialMsrp?: string | number;
  price?: string | number;
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

    if (
      maybeItem &&
      (maybeItem.partNumber ||
        maybeItem.PartNumber ||
        maybeItem.code ||
        maybeItem.Code)
    ) {
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

    let processed = 0;

    for (const raw of rawItems) {
      const partNumber =
        toStringField(raw.partNumber) ||
        toStringField(raw.PartNumber) ||
        toStringField(raw.code) ||
        toStringField(raw.Code);

      if (!partNumber) continue;

      const name =
        toStringField(raw.name) ||
        toStringField(raw.Name) ||
        toStringField(raw.description) ||
        toStringField(raw.Description) ||
        partNumber;

      const brand = toStringField(raw.brand) || toStringField(raw.Brand) || "Volvo";

      const msrp =
        toNumberField(raw.officialMsrp) ??
        toNumberField(raw.MSRP) ??
        toNumberField(raw.msrp) ??
        toNumberField(raw.price) ??
        0;

      await prisma.masterProduct.upsert({
        where: { partNumber },
        create: {
          partNumber,
          name,
          brand,
          officialMsrp: msrp,
        },
        update: {
          name,
          brand,
          officialMsrp: msrp,
        },
      });

      processed += 1;
    }

    return Response.json({ success: true, count: processed });
  } catch (error) {
    console.error("[import-master] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}