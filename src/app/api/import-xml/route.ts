import { NextRequest } from "next/server";
import { XMLParser } from "fast-xml-parser";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const VOLVO_EMAIL = "volvo@parts.loc";

/** Ensures every new/updated product is saved with supplier 'Volvo' (via dealerId/brandId). */
async function getOrCreateVolvoDealerAndBrand() {
  let dealer = await prisma.dealer.findFirst({
    where: { email: VOLVO_EMAIL },
  });
  if (!dealer) {
    dealer = await prisma.dealer.create({
      data: { name: "Volvo", email: VOLVO_EMAIL },
    });
  }

  let brand = await prisma.brand.findFirst({
    where: { name: "Volvo" },
  });
  if (!brand) {
    brand = await prisma.brand.create({
      data: { name: "Volvo" },
    });
  }

  return { dealerId: dealer.id, brandId: brand.id };
}

function normalizeProductRow(row: Record<string, unknown>): { id: string; partNumber: string; name: string; price: number; stock: number } | null {
  const id = String(row.id ?? row.ean ?? row.sku ?? row.partNumber ?? "").trim();
  const partNumber = String(row.partNumber ?? row.partnumber ?? row.sku ?? id).trim();
  const name = String(row.name ?? row.title ?? "").trim();
  const price = Number(row.price ?? 0);
  const stock = Number(row.stock ?? row.quantity ?? 0);
  if (!id || !name) return null;
  return { id, partNumber: partNumber || id, name, price: isNaN(price) ? 0 : price, stock: isNaN(stock) ? 0 : Math.floor(stock) };
}

function extractProductsFromXml(xmlText: string): Array<{ id: string; partNumber: string; name: string; price: number; stock: number }> {
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });
  const parsed = parser.parse(xmlText);
  const out: Array<{ id: string; partNumber: string; name: string; price: number; stock: number }> = [];
  const walk = (obj: unknown): void => {
    if (!obj || typeof obj !== "object") return;
    const o = obj as Record<string, unknown>;
    if (o.id != null || o.partNumber != null || o.name != null || (o.product && typeof o.product === "object")) {
      const row = (o.product ?? o.item ?? o) as Record<string, unknown>;
      const norm = normalizeProductRow(row);
      if (norm) out.push(norm);
    }
    Object.values(o).forEach((v) => (Array.isArray(v) ? v.forEach(walk) : walk(v)));
  };
  walk(parsed);
  return out;
}

export async function GET() {
  try {
    const count = await prisma.product.count();
    return Response.json({ success: true, total: count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Import-xml GET error:", error);
    return Response.json({ error: message }, { status: 503 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { dealerId, brandId } = await getOrCreateVolvoDealerAndBrand();
    let products: Array<{ id: string; partNumber: string; name: string; price: number; stock: number }> = [];

    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") ?? formData.get("xml");
      if (file && file instanceof File) {
        const xmlText = await file.text();
        products = extractProductsFromXml(xmlText);
      }
    } else {
      const body = await request.json().catch(() => ({}));
      const raw = body.products ?? body.items ?? [];
      if (Array.isArray(raw)) {
        for (const row of raw) {
          const norm = normalizeProductRow(typeof row === "object" && row ? (row as Record<string, unknown>) : {});
          if (norm) products.push(norm);
        }
      }
    }

    let count = 0;
    for (const p of products) {
      await prisma.product.upsert({
        where: { id: p.id },
        create: {
          id: p.id,
          partNumber: p.partNumber,
          name: p.name,
          price: p.price,
          stock: p.stock,
          brandId,
          dealerId,
        },
        update: {
          partNumber: p.partNumber,
          name: p.name,
          price: p.price,
          stock: p.stock,
          brandId,
          dealerId,
        },
      });
      count += 1;
    }

    return Response.json({ success: true, count });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Database error";
    console.error("Import-xml POST error:", error);
    return Response.json({ error: message }, { status: 503 });
  }
}