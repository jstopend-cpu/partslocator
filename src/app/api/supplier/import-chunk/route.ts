import { NextRequest } from "next/server";
import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";

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
    if (!userId) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const user = await currentUser();
    const metadata = user?.publicMetadata as { role?: string; supplierId?: string } | undefined;
    if (metadata?.role !== "SUPPLIER" || !metadata?.supplierId) {
      return Response.json({ error: "Supplier access only." }, { status: 403 });
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: metadata.supplierId },
    });
    if (!supplier) {
      return Response.json({ error: "Supplier not found." }, { status: 403 });
    }

    const body = await request.json();
    const { chunk, mapping: bodyMapping, priceMultiplier: bodyMultiplier } = body as {
      chunk?: Record<string, string>[];
      mapping?: Record<string, string>;
      priceMultiplier?: number;
    };

    if (!chunk || !Array.isArray(chunk)) {
      return Response.json({ error: "Missing or invalid 'chunk' array." }, { status: 400 });
    }
    if (!bodyMapping?.partNumber || !bodyMapping?.price) {
      return Response.json(
        { error: "Mapping must include partNumber and price." },
        { status: 400 }
      );
    }

    const mapping = bodyMapping as Record<string, string>;
    const priceMultiplier = Number(bodyMultiplier) ?? 1;

    const result = await prisma.$transaction(async (tx) => {
      let u = 0;
      let c = 0;
      let e = 0;

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
            getMappedValue(row, mapping.price) ||
            getMappedValue(row, mapping.purchasePrice) ||
            getMappedValue(row, mapping.retailPrice);
          const supplierPrice = toNum(priceRaw, priceMultiplier);
          const qtyRaw = getMappedValue(row, mapping.quantity);
          const quantity = Math.max(0, Math.round(toNum(qtyRaw, 1)));

          const existing = await tx.supplierStock.findUnique({
            where: {
              masterProductId_supplierId: {
                masterProductId: masterId,
                supplierId: supplier.id,
              },
            },
          });

          await tx.supplierStock.upsert({
            where: {
              masterProductId_supplierId: {
                masterProductId: masterId,
                supplierId: supplier.id,
              },
            },
            create: {
              masterProductId: masterId,
              supplierId: supplier.id,
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
    });

    return Response.json(result);
  } catch (err) {
    console.error("[supplier/import-chunk]", err);
    const message = err instanceof Error ? err.message : "Chunk processing failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
