"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export type SupplierStats = {
  totalSuppliers: number;
  totalSkus: number;
  globalPriceGapPct: number | null;
  suppliers: SupplierRow[];
};

export type SupplierRow = {
  id: string;
  name: string;
  itemsCount: number;
  lastUsed: Date | null;
  priceAdvantagePct: number;
  priceHealthPct: number; // % of products where supplierPrice <= officialMsrp (good)
};

export async function getSupplierStats(): Promise<SupplierStats | null> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return null;

  const [totalSuppliers, totalSkus, priceGapRow, supplierCounts, advantageRows, profiles] =
    await Promise.all([
      prisma.supplier.count(),
      prisma.supplierStock.count(),
      prisma.$queryRaw<[{ avg: number | null }]>`
        SELECT AVG(
          (s."supplierPrice" - m."officialMsrp") / NULLIF(m."officialMsrp", 0) * 100
        ) AS avg
        FROM "SupplierStock" s
        INNER JOIN "MasterProduct" m ON s."masterProductId" = m.id
        WHERE m."officialMsrp" > 0
      `,
      prisma.supplier.findMany({
        select: {
          id: true,
          name: true,
          _count: { select: { stocks: true } },
        },
      }),
      prisma.$queryRaw<{ supplierId: string; total: unknown; advantage: unknown }[]>`
        SELECT s."supplierId", COUNT(*) AS total,
          SUM(CASE WHEN s."supplierPrice" < m."officialMsrp" THEN 1 ELSE 0 END) AS advantage
        FROM "SupplierStock" s
        INNER JOIN "MasterProduct" m ON s."masterProductId" = m.id
        GROUP BY s."supplierId"
      `,
      prisma.importProfile.findMany({
        where: { targetTable: "SUPPLIER_STOCK" },
        select: { name: true, lastUsed: true, config: true },
      }),
    ]);

  const advantageMap = new Map(
    advantageRows.map((r) => {
      const total = Number(r.total);
      const advantage = Number(r.advantage);
      return [r.supplierId, total > 0 ? (advantage / total) * 100 : 0] as const;
    })
  );

  const lastUsedBySupplierName = new Map<string, Date>();
  for (const p of profiles) {
    const config = p.config as Record<string, unknown> | null;
    const supplierName =
      typeof config?.supplierName === "string" ? config.supplierName.trim() : null;
    if (supplierName && p.lastUsed) {
      const existing = lastUsedBySupplierName.get(supplierName);
      if (!existing || p.lastUsed > existing) {
        lastUsedBySupplierName.set(supplierName, p.lastUsed);
      }
    }
    if (p.name && p.lastUsed) {
      const existing = lastUsedBySupplierName.get(p.name);
      if (!existing || p.lastUsed > existing) {
        lastUsedBySupplierName.set(p.name, p.lastUsed);
      }
    }
  }

  const globalPriceGapPct =
    priceGapRow?.[0]?.avg != null ? Number(priceGapRow[0].avg) : null;

  const suppliers: SupplierRow[] = supplierCounts.map((s) => {
    const itemsCount = s._count.stocks;
    const priceAdvantagePct = advantageMap.get(s.id) ?? 0;
    const lastUsed = lastUsedBySupplierName.get(s.name) ?? null;
    const priceHealthPct = priceAdvantagePct;
    return {
      id: s.id,
      name: s.name,
      itemsCount,
      lastUsed,
      priceAdvantagePct,
      priceHealthPct,
    };
  });

  return {
    totalSuppliers,
    totalSkus,
    globalPriceGapPct,
    suppliers,
  };
}
