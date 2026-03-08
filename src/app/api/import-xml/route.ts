export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const xml2js = await import("xml2js");

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const xmlText = await file.text();
    const parsed = await xml2js.parseStringPromise(xmlText, {
      explicitArray: false,
    });

    // Υποθέτουμε δομή XML:
    // <products>
    //   <item>
    //     <name>...</name>
    //     <ean>...</ean>
    //     <supplier>...</supplier>
    //     <price>...</price>
    //     <stock>...</stock>
    //   </item>
    // </products>
    const rawItems = parsed.products?.item ?? [];
    const items = Array.isArray(rawItems) ? rawItems : [rawItems];

    let count = 0;

    for (const raw of items) {
      try {
        const name = String(raw?.name ?? "").trim();
        const ean = String(raw?.ean ?? "").trim();
        const supplier = String(raw?.supplier ?? "").trim();
        const rawPrice = String(raw?.price ?? "").trim();
        const rawStock = String(raw?.stock ?? "").trim();

        if (!name || !ean || !supplier || !rawPrice || !rawStock) {
          // Skip incomplete rows instead of failing the whole import
          // eslint-disable-next-line no-continue
          continue;
        }

        const price = parseFloat(rawPrice.replace(",", "."));
        const stock = Number.parseInt(rawStock, 10);

        if (Number.isNaN(price) || Number.isNaN(stock)) {
          // eslint-disable-next-line no-continue
          continue;
        }

        await prisma.product.upsert({
          where: { ean },
          create: {
            name,
            ean,
            supplier,
            price,
            stock,
          },
          update: {
            name,
            supplier,
            price,
            stock,
          },
        });

        count += 1;
      } catch (err) {
        // If a single product fails (e.g. existing duplicates or constraint issues),
        // log and continue with the rest instead of aborting the whole import.
        console.error("Skipping product due to import error:", err);
        // eslint-disable-next-line no-continue
        continue;
      }
    }

    return NextResponse.json({ success: true, count });
  } catch (error) {
    console.error("XML Import Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to import XML data" },
      { status: 500 },
    );
  }
}