"use server";

import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export type LatestUpdateLog = {
  userName: string;
  brand: string;
  createdAt: string;
} | null;

/**
 * Returns the most recent UpdateLog entry for the given brand.
 * Admin-only: only visible in the admin section.
 */
export async function getLatestUpdateLog(brand: string): Promise<LatestUpdateLog> {
  const { userId } = await auth();
  if (userId !== ADMIN_USER_ID) {
    return null;
  }
  const trimmed = brand?.trim();
  if (!trimmed) return null;

  const latest = await prisma.updateLog.findFirst({
    where: { brand: trimmed },
    orderBy: { createdAt: "desc" },
  });
  if (!latest) return null;

  return {
    userName: latest.userName,
    brand: latest.brand,
    createdAt: latest.createdAt.toISOString(),
  };
}
