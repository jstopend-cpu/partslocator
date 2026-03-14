import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

function getMappedValue(row: Record<string, string>, fileHeader: string | undefined): string {
  if (!fileHeader) return "";
  const v = row[fileHeader];
  return v != null ? String(v).trim() : "";
}

function toNum(value: string, multiplier: number): number {
  const n = Number(String(value).replace(",", "."));
  const val = Number.isFinite(n) ? n : 0;
  return Math.round(val * multiplier * 1e6) / 1e6;
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }

    const body = await request.json();
    const {
      profileId,
      chunk,
      mapping: bodyMapping,
      config: bodyConfig,
      targetTable: bodyTargetTable,
      supplierName: bodySupplierName,
    } = body as {
      profileId?: string;
      chunk?: Record<string, string>[];
      mapping?: Record<string, string>;
      config?: Record<string, unknown>;
      targetTable?: string;
      supplierName?: string;
    };

    if (!chunk || !Array.isArray(chunk)) {
      return Response.json({ error: "Missing or invalid 'chunk' array." }, { status: 400 });
    }

    let mapping: Record<string, string>;
    let config: Record<string, unknown>;
    let targetTable: string;
    let supplierName: string;

    if (profileId) {
      const profile = await prisma.importProfile.findUnique({
        where: { id: profileId },
      });
      if (!profile) {
        return Response.json({ error: "Profile not found." }, { status: 404 });
      }
      mapping = (profile.mapping ?? {}) as Record<string, string>;
      config = (profile.config ?? {}) as Record<string, unknown>;
      targetTable = String(profile.targetTable ?? "MASTER_CATALOG");
      supplierName =
        typeof config.supplierName === "string" && config.supplierName.trim()
          ? String(config.supplierName).trim()
          : "";
    } else {
      if (!bodyMapping || !bodyTargetTable) {
        return Response.json(
          { error: "Without profileId, provide mapping and targetTable." },
          { status: 400 }
        );
      }
      mapping = bodyMapping;
      config = (bodyConfig ?? {}) as Record<string, unknown>;
      targetTable =
        bodyTargetTable === "SUPPLIER"
          ? "SUPPLIER_STOCK"
          : "MASTER_CATALOG";
      supplierName =
        typeof bodySupplierName === "string" && bodySupplierName.trim()
          ? bodySupplierName.trim()
          : "";
    }

    if (targetTable === "SUPPLIER_STOCK" && !supplierName) {
      return Response.json(
        { error: "Supplier stock requires supplierName (in config or body)." },
        { status: 400 }
      );
    }

    const priceMultiplier = Number(config.priceMultiplier) ?? 1;
    const defaultBrand =
      typeof config.defaultBrand === "string" && config.defaultBrand.trim()
        ? config.defaultBrand.trim()
        : "";

    let supplierId: string | null = null;
    if (targetTable === "SUPPLIER_STOCK") {
      const supplier = await prisma.supplier.upsert({
        where: { name: supplierName },
        create: { name: supplierName, location: "" },
        update: {},
      });
      supplierId = supplier.id;
    }

    const result = await prisma.$transaction(async (tx) => {
      let u = 0;
      let c = 0;
      let e = 0;

      if (targetTable === "SUPPLIER_STOCK") {
        const partNumbers = chunk
          .map((row) => getMappedValue(row, mapping.partNumber))
          .filter(Boolean);
        const uniq = [...new Set(partNumbers)];
        const masters = await tx.masterProduct.findMany({
          where: { partNumber: { in: uniq } },
          select: { id: true, partNumber: true },
        });
        const partToId = new Map(masters.map((m) => [m.partNumber, m.id]));
        const stockCreatedInChunk = new Set<string>();

        for (const row of chunk) {
          try {
            const partNumber = getMappedValue(row, mapping.partNumber);
            if (!partNumber) {
              e += 1;
              continue;
            }
            const masterId = partToId.get(partNumber);
            if (!masterId) {
              e += 1;
              continue;
            }
            const priceRaw =
              getMappedValue(row, mapping.purchasePrice) ||
              getMappedValue(row, mapping.retailPrice) ||
              getMappedValue(row, mapping.price);
            const supplierPrice = toNum(priceRaw, priceMultiplier);
            const qtyRaw = getMappedValue(row, mapping.quantity);
            const quantity = Math.max(0, Math.round(toNum(qtyRaw, 1)));

            const existing = await tx.supplierStock.findUnique({
              where: {
                masterProductId_supplierId: {
                  masterProductId: masterId,
                  supplierId: supplierId!,
                },
              },
            });

            await tx.supplierStock.upsert({
              where: {
                masterProductId_supplierId: {
                  masterProductId: masterId,
                  supplierId: supplierId!,
                },
              },
              create: {
                masterProductId: masterId,
                supplierId: supplierId!,
                supplierPrice,
                quantity,
              },
              update: { supplierPrice, quantity },
            });
            const alreadyExisted = existing || stockCreatedInChunk.has(masterId);
            if (alreadyExisted) u += 1;
            else {
              c += 1;
              stockCreatedInChunk.add(masterId);
            }
          } catch {
            e += 1;
          }
        }
        return { updated: u, created: c, errors: e };
      }

      const partNumbers = chunk
        .map((row) => getMappedValue(row, mapping.partNumber))
        .filter(Boolean);
      const uniq = [...new Set(partNumbers)];
      const existingProducts = await tx.masterProduct.findMany({
        where: { partNumber: { in: uniq } },
        select: { partNumber: true },
      });
      const existingSet = new Set(existingProducts.map((p) => p.partNumber));
      const createdInChunk = new Set<string>();

      for (const row of chunk) {
        try {
          const partNumber = getMappedValue(row, mapping.partNumber);
          if (!partNumber) {
            e += 1;
            continue;
          }
          const name = getMappedValue(row, mapping.name) || partNumber;
          let brand = getMappedValue(row, mapping.brand);
          if (!brand) brand = defaultBrand || "Unknown";
          const retailRaw = getMappedValue(row, mapping.retailPrice);
          const purchaseRaw = getMappedValue(row, mapping.purchasePrice);
          const priceRaw = retailRaw || purchaseRaw;
          const officialMsrp = toNum(priceRaw, priceMultiplier);

          const existed = existingSet.has(partNumber) || createdInChunk.has(partNumber);
          await tx.masterProduct.upsert({
            where: { partNumber },
            create: { partNumber, name, brand, officialMsrp },
            update: { name, brand, officialMsrp },
          });
          if (existed) u += 1;
          else {
            c += 1;
            createdInChunk.add(partNumber);
          }
        } catch {
          e += 1;
        }
      }
      return { updated: u, created: c, errors: e };
    });

    if (profileId) {
      await prisma.importProfile.update({
        where: { id: profileId },
        data: { lastUsed: new Date() },
      });
    }

    return Response.json(result);
  } catch (err) {
    console.error("[universal-import/chunk]", err);
    const message = err instanceof Error ? err.message : "Chunk processing failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
