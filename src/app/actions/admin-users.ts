"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const OWNER_EMAIL = "jstopend@gmail.com";

export async function canAccessAdminPage(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  return role === "admin" || email === OWNER_EMAIL.toLowerCase();
}

/** Log a dashboard search for the current user (for admin stats and activity log). */
export async function logSearch(query: string): Promise<void> {
  const { userId } = await auth();
  const user = await currentUser();
  if (!userId || !query?.trim()) return;
  try {
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
    await prisma.searchLog.create({
      data: {
        userId,
        userEmail,
        query: query.trim().slice(0, 500),
      },
    });
  } catch (e) {
    console.error("logSearch:", e);
  }
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
  role: string;
  allowedBrands: string[];
};

export type GetAdminUsersResult =
  | { ok: true; data: AdminUserRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** List all users for admin. Only allowed if current user is admin (role or owner email). */
export async function getAdminUsersList(): Promise<GetAdminUsersResult> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };

  try {
    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      limit: 500,
      orderBy: "-created_at",
    });

    const rows: AdminUserRow[] = users.map((u) => {
      const metadata = (u.publicMetadata as { allowedBrands?: string[]; role?: string } | undefined) ?? {};
      const allowedBrands = Array.isArray(metadata.allowedBrands) ? metadata.allowedBrands : [];
      const role = typeof metadata.role === "string" ? metadata.role : "—";
      const firstName = u.firstName ?? "";
      const lastName = u.lastName ?? "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || "—";
      const email = u.primaryEmailAddress?.emailAddress ?? (u as { emailAddresses?: { emailAddress?: string }[] }).emailAddresses?.[0]?.emailAddress ?? "—";
      return {
        id: u.id,
        name,
        email,
        role,
        allowedBrands,
      };
    });

    return { ok: true, data: rows };
  } catch (e) {
    console.error("getAdminUsersList:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης χρηστών." };
  }
}

/** All brand names for admin UI (multi-select). Only returns data if current user is admin. */
export async function getAdminBrandsList(): Promise<string[]> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return [];

  const list = await prisma.brand.findMany({
    orderBy: { name: "asc" },
    select: { name: true },
  });
  return list.map((b) => b.name).filter(Boolean);
}

export type UpdateUserBrandsResult =
  | { ok: true }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Update a user's role and allowedBrands in Clerk publicMetadata. Only allowed if current user is admin. */
export async function updateUserMetadata(
  userId: string,
  data: { role?: string; allowedBrands: string[] }
): Promise<UpdateUserBrandsResult> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existing = (user.publicMetadata as Record<string, unknown>) ?? {};
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existing,
        ...(data.role !== undefined && { role: data.role }),
        allowedBrands: data.allowedBrands,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("updateUserMetadata:", e);
    return { ok: false, error: "Σφάλμα ενημέρωσης χρήστη." };
  }
}

/** @deprecated Use updateUserMetadata. */
export async function updateUserAllowedBrands(
  userId: string,
  allowedBrands: string[]
): Promise<UpdateUserBrandsResult> {
  return updateUserMetadata(userId, { allowedBrands });
}

export type AdminStats = {
  totalUsers: number;
  searchesToday: number;
  searchesMonth: number;
  mostPopularBrand: string;
  searchesByDay: { date: string; count: number }[];
  recentSearches: { userEmail: string | null; query: string; createdAt: Date }[];
};

export type GetAdminStatsResult =
  | { ok: true; data: AdminStats }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Stats and activity for admin dashboard. */
export async function getAdminStats(): Promise<GetAdminStatsResult> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };

  try {
    const client = await clerkClient();
    const listRes = await client.users.getUserList({ limit: 1 });
    const totalUsers = (listRes as { totalCount?: number }).totalCount ?? 0;

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [searchesToday, searchesMonth, allLogs, recentLogs] = await Promise.all([
      prisma.searchLog.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.searchLog.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.searchLog.findMany({
        where: { createdAt: { gte: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000) } },
        select: { query: true, createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.searchLog.findMany({
        take: 10,
        orderBy: { createdAt: "desc" },
        select: { userEmail: true, query: true, createdAt: true },
      }),
    ]);

    const byDay = new Map<string, number>();
    for (let d = 13; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      const key = date.toISOString().slice(0, 10);
      byDay.set(key, 0);
    }
    for (const log of allLogs) {
      const key = new Date(log.createdAt).toISOString().slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + 1);
    }
    const searchesByDay = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));

    const queryCounts = new Map<string, number>();
    const monthLogs = await prisma.searchLog.findMany({
      where: { createdAt: { gte: startOfMonth } },
      select: { query: true },
    });
    for (const log of monthLogs) {
      const q = log.query.trim() || "—";
      queryCounts.set(q, (queryCounts.get(q) ?? 0) + 1);
    }
    let mostPopularBrand = "—";
    let max = 0;
    queryCounts.forEach((count, query) => {
      if (count > max) {
        max = count;
        mostPopularBrand = query;
      }
    });

    const data: AdminStats = {
      totalUsers: totalUsers ?? 0,
      searchesToday,
      searchesMonth,
      mostPopularBrand,
      searchesByDay,
      recentSearches: recentLogs.map((r) => ({
        userEmail: r.userEmail,
        query: r.query,
        createdAt: r.createdAt,
      })),
    };
    return { ok: true, data };
  } catch (e) {
    console.error("getAdminStats:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης στατιστικών." };
  }
}
