"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export type LatestUpdateLog = {
  userName: string;
  categoryName: string | null;
  brandName: string | null;
  createdAt: string;
} | null;

/**
 * Returns the most recent UpdateLog entry for the given brand (by brandId).
 * Admin-only: only visible in the admin section.
 */
export async function getLatestUpdateLog(brandId: string): Promise<LatestUpdateLog> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) return null;
  const trimmed = brandId?.trim();
  if (!trimmed) return null;

  const latest = await prisma.updateLog.findFirst({
    where: { brandId: trimmed },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return null;

  return {
    userName: latest.userName,
    categoryName: latest.categoryName ?? null,
    brandName: latest.brandName ?? null,
    createdAt: latest.createdAt.toISOString(),
  };
}
