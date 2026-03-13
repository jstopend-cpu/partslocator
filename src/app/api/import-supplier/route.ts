import { NextRequest } from "next/server";
import { Parser } from "xml2js";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";
export const revalidate = 0;

const parser = new Parser({ explicitArray: false, trim: true });

type SupplierXmlItem = {
  partNumber?: string;
  PartNumber?: string;
  code?: string;
  Code?: string;
  sku?: string;
  SKU?: string;
  quantity?: string | number;
  Quantity?: string | number;
  stock?: string | number;
  Stock?: string | number;
  supplierPrice?: string | number;
  SupplierPrice?: string | number;
  price?: string | number;
  Price?: string | number;
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

    if (
      maybeItem &&
      (maybeItem.partNumber ||
        maybeItem.PartNumber ||
        maybeItem.code ||
        maybeItem.Code ||
        maybeItem.sku ||
        maybeItem.SKU)
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

export async function POST(request: NextRequest) {
  try {
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

    const xmlText = await file.text();
    if (!xmlText.trim()) {
      return Response.json(
        { error: "Empty XML payload." },
        { status: 400 },
      );
    }

    const parsed: any = await parser.parseStringPromise(xmlText);
    const rawItems = extractItems(parsed);

    let processed = 0;
    for (const raw of rawItems) {
      const partNumber =
        toStringField(raw.partNumber) ||
        toStringField(raw.PartNumber) ||
        toStringField(raw.code) ||
        toStringField(raw.Code) ||
        toStringField(raw.sku) ||
        toStringField(raw.SKU);

      if (!partNumber) continue;

      const quantity =
        toNumberField(raw.quantity) ??
        toNumberField(raw.Quantity) ??
        toNumberField(raw.stock) ??
        toNumberField(raw.Stock) ??
        0;

      const supplierPrice =
        toNumberField(raw.supplierPrice) ??
        toNumberField(raw.SupplierPrice) ??
        toNumberField(raw.price) ??
        toNumberField(raw.Price) ??
        0;

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
    });
  } catch (error) {
    console.error("[import-supplier] error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return Response.json({ error: message }, { status: 500 });
  }
}