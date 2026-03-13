import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Μη εξουσιοδοτημένο." }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const brand = searchParams.get("brand")?.trim() ?? null;
    const latest = await prisma.updateLog.findFirst({
      where: brand ? { brand } : undefined,
      orderBy: { createdAt: "desc" },
    });
    if (!latest) {
      return Response.json({ latest: null });
    }
    return Response.json({
      latest: {
        userName: latest.userName,
        brand: latest.brand,
        createdAt: latest.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[master-update-log] error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
