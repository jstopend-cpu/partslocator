"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";
import { getRowsFromFile, detectFileType } from "@/lib/universal-import/parse";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";
const CHUNK_SIZE = 300;

export type ProcessUniversalImportResult =
  | { ok: true; updated: number; created: number; errors: number; message: string }
  | { ok: false; error: string };

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

/**
 * Process a file using a saved ImportProfile: load mapping, parse rows,
 * apply transformations (price multiplier, default brand).
 * - MASTER_CATALOG: upsert MasterProduct by partNumber (name, brand, officialMsrp).
 * - SUPPLIER_STOCK: resolve masterProductId by partNumber, then upsert SupplierStock
 *   (supplierPrice, quantity) for the profile's config.supplierName; config.supplierName required.
 */
export async function processUniversalImport(
  file: File,
  profileId: string
): Promise<ProcessUniversalImportResult> {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return { ok: false, error: "Unauthorized." };
    }

    if (!profileId?.trim()) {
      return { ok: false, error: "Profile ID is required." };
    }

    const profile = await prisma.importProfile.findUnique({
      where: { id: profileId },
    });
    if (!profile) {
      return { ok: false, error: "Import profile not found." };
    }

    const mapping = (profile.mapping ?? {}) as Record<string, string>;
    const config = (profile.config ?? {}) as Record<string, unknown>;
    const priceMultiplier = Number(config.priceMultiplier) ?? 1;
    const defaultBrand =
      typeof config.defaultBrand === "string" && config.defaultBrand.trim()
        ? config.defaultBrand.trim()
        : "";
    const supplierName =
      typeof config.supplierName === "string" && config.supplierName.trim()
        ? config.supplierName.trim()
        : "";

    const targetTable = String(profile.targetTable ?? "MASTER_CATALOG");

    if (targetTable === "SUPPLIER_STOCK" && !supplierName) {
      return { ok: false, error: "Supplier stock import requires config.supplierName." };
    }

    const fileType = detectFileType(file.name);
    if (!fileType) {
      return { ok: false, error: "Unsupported file type. Use CSV, XML, or XLSX." };
    }

    const { rows } = await getRowsFromFile(file);

    let updated = 0;
    let created = 0;
    let errors = 0;

    let supplierId: string | null = null;
    if (targetTable === "SUPPLIER_STOCK") {
      const supplier = await prisma.supplier.upsert({
        where: { name: supplierName },
        create: { name: supplierName, location: "" },
        update: {},
      });
      supplierId = supplier.id;
    }

    for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
      const chunk = rows.slice(i, i + CHUNK_SIZE);
      const chunkUpdated = await prisma.$transaction(async (tx) => {
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

        // MASTER_CATALOG
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

      updated += chunkUpdated.updated;
      created += chunkUpdated.created;
      errors += chunkUpdated.errors;
    }

    await prisma.importProfile.update({
      where: { id: profileId },
      data: { lastUsed: new Date() },
    });

    const message = `Success: ${updated} updated, ${created} created, ${errors} errors`;
    return {
      ok: true,
      updated,
      created,
      errors,
      message,
    };
  } catch (err) {
    console.error("[processUniversalImport]", err);
    const message = err instanceof Error ? err.message : "Import failed";
    return { ok: false, error: message };
  }
}
