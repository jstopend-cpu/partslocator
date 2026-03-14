import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";
import {
  parseFileWithMapping,
  detectFileType,
  type FieldMapping,
} from "@/lib/universal-import/parse";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";
const CHUNK_SIZE = 500;

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function parseBody(formData: FormData): {
  file: File | null;
  mapping: FieldMapping;
  targetTable: "MASTER" | "SUPPLIER";
  priceMultiplier: number;
  updateExisting: boolean;
  supplierName: string | null;
} {
  const file = formData.get("file");
  const mappingRaw = formData.get("mapping");
  const targetTableRaw = formData.get("targetTable");
  const priceMultiplierRaw = formData.get("priceMultiplier");
  const updateExistingRaw = formData.get("updateExisting");
  const supplierNameRaw = formData.get("supplierName");

  let mapping: FieldMapping = {};
  if (typeof mappingRaw === "string") {
    try {
      mapping = JSON.parse(mappingRaw) as FieldMapping;
    } catch {
      mapping = {};
    }
  }

  const targetTable =
    targetTableRaw === "SUPPLIER" ? "SUPPLIER" : "MASTER";
  const priceMultiplier = Math.max(0.001, Math.min(100, Number(priceMultiplierRaw) || 1));
  const updateExisting = updateExistingRaw !== "false" && updateExistingRaw !== "0";
  const supplierName =
    typeof supplierNameRaw === "string" && supplierNameRaw.trim()
      ? supplierNameRaw.trim()
      : null;

  return {
    file: file && file instanceof File ? file : null,
    mapping,
    targetTable,
    priceMultiplier,
    updateExisting,
    supplierName,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }

    const formData = await request.formData();
    const { file, mapping, targetTable, priceMultiplier, updateExisting, supplierName } =
      parseBody(formData);

    if (!file) {
      return Response.json({ error: "Missing file." }, { status: 400 });
    }
    if (!mapping.partNumber) {
      return Response.json(
        { error: "Mapping must include Part Number (partNumber)." },
        { status: 400 }
      );
    }
    if (targetTable === "MASTER") {
      if (!mapping.name || !mapping.brand || !mapping.price) {
        return Response.json(
          { error: "For Master catalog, mapping must include name, brand, and price." },
          { status: 400 }
        );
      }
    } else {
      if (!mapping.price) {
        return Response.json(
          { error: "For Supplier stock, mapping must include price." },
          { status: 400 }
        );
      }
      if (!supplierName) {
        return Response.json(
          { error: "Supplier name is required for Supplier stock import." },
          { status: 400 }
        );
      }
    }

    const fileType = detectFileType(file.name);
    if (!fileType) {
      return Response.json(
        { error: "Unsupported file type. Use CSV, XML, or XLSX." },
        { status: 400 }
      );
    }

    const { master: masterRecords, supplier: supplierRecords } =
      await parseFileWithMapping(file, mapping, fileType, priceMultiplier);

    if (targetTable === "MASTER") {
      if (updateExisting) {
        for (const row of masterRecords) {
          await prisma.masterProduct.upsert({
            where: { partNumber: row.partNumber },
            create: {
              partNumber: row.partNumber,
              name: row.name,
              brand: row.brand,
              officialMsrp: row.officialMsrp,
            },
            update: {
              name: row.name,
              brand: row.brand,
              officialMsrp: row.officialMsrp,
            },
          });
        }
      } else {
        for (let i = 0; i < masterRecords.length; i += CHUNK_SIZE) {
          const chunk = masterRecords.slice(i, i + CHUNK_SIZE);
          await prisma.masterProduct.createMany({
            data: chunk,
            skipDuplicates: true,
          });
        }
      }
      return Response.json({
        success: true,
        targetTable: "MASTER",
        count: masterRecords.length,
        message: `Processed ${masterRecords.length} master product(s).`,
      });
    }

    const supplier = await prisma.supplier.upsert({
      where: { name: supplierName! },
      create: { name: supplierName!, location: "" },
      update: {},
    });

    let processed = 0;
    for (const row of supplierRecords) {
      const master = await prisma.masterProduct.findUnique({
        where: { partNumber: row.partNumber },
        select: { id: true },
      });
      if (!master) continue;

      if (updateExisting) {
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
            supplierPrice: row.supplierPrice,
            quantity: row.quantity,
          },
          update: {
            supplierPrice: row.supplierPrice,
            quantity: row.quantity,
          },
        });
      } else {
        await prisma.supplierStock
          .create({
            data: {
              masterProductId: master.id,
              supplierId: supplier.id,
              supplierPrice: row.supplierPrice,
              quantity: row.quantity,
            },
          })
          .catch(() => {});
      }
      processed += 1;
    }

    return Response.json({
      success: true,
      targetTable: "SUPPLIER",
      supplierId: supplier.id,
      supplierName: supplier.name,
      count: processed,
      message: `Processed ${processed} supplier stock row(s).`,
    });
  } catch (err) {
    console.error("[universal-import]", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
