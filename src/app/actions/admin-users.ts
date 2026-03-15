"use server";

import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const OWNER_EMAIL = "jstopend@gmail.com";

export type AdminRole = "owner" | "admin" | "support" | null;

/** True if user can access admin panel (owner, admin, or support). */
export async function canAccessAdminPage(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  return (
    email === OWNER_EMAIL.toLowerCase() ||
    role === "admin" ||
    role === "support"
  );
}

/** Current user's admin role for permission checks. Support cannot edit users/brands. */
export async function getCurrentAdminRole(): Promise<AdminRole> {
  const user = await currentUser();
  if (!user) return null;
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (email === OWNER_EMAIL.toLowerCase()) return "owner";
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  if (role === "admin") return "admin";
  if (role === "support") return "support";
  return null;
}

export function isOwnerEmail(email: string): boolean {
  return email?.trim().toLowerCase() === OWNER_EMAIL.toLowerCase();
}

export type AuditLogRow = { id: string; action: string; performedBy: string; targetUser: string; details: string; createdAt: Date };

/** Create an audit log entry. performedBy is set from current user (name or email). */
async function createAuditLog(action: string, targetUser: string, details: string): Promise<void> {
  try {
    const user = await currentUser();
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim();
    const email = user?.primaryEmailAddress?.emailAddress ?? "";
    const performedBy = name || email || "—";
    await prisma.auditLog.create({
      data: { action, performedBy, targetUser, details },
    });
  } catch (e) {
    console.error("createAuditLog:", e);
  }
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
  isOwner: boolean;
  suspended: boolean;
};

export type GetAdminUsersResult =
  | { ok: true; data: AdminUserRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** List all users for admin. Only allowed if current user is admin/owner/support. */
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
      const metadata = (u.publicMetadata as { allowedBrands?: string[]; role?: string; suspended?: boolean } | undefined) ?? {};
      const allowedBrands = Array.isArray(metadata.allowedBrands) ? metadata.allowedBrands : [];
      const role = typeof metadata.role === "string" ? metadata.role : "";
      const suspended = metadata.suspended === true;
      const firstName = u.firstName ?? "";
      const lastName = u.lastName ?? "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || "—";
      const email = u.primaryEmailAddress?.emailAddress ?? (u as { emailAddresses?: { emailAddress?: string }[] }).emailAddresses?.[0]?.emailAddress ?? "—";
      const isOwner = isOwnerEmail(email);
      const displayRole = isOwner ? "owner" : (role || "customer");
      return {
        id: u.id,
        name,
        email,
        role: displayRole,
        allowedBrands,
        isOwner,
        suspended,
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

/** Update a user's role and/or allowedBrands. Only owner can change another Admin's role. Support cannot call this. */
export async function updateUserMetadata(
  userId: string,
  data: { role?: string; allowedBrands?: string[] }
): Promise<UpdateUserBrandsResult> {
  const role = await getCurrentAdminRole();
  if (!role || role === "support") return { ok: false, forbidden: true };

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existing = (user.publicMetadata as Record<string, unknown>) ?? {};
    const currentRole = (existing.role as string) || "";
    const currentBrands = Array.isArray(existing.allowedBrands) ? (existing.allowedBrands as string[]) : [];
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const targetName = [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "—";

    if (data.role !== undefined) {
      if (isOwnerEmail(email)) return { ok: false, error: "Δεν μπορείτε να αλλάξετε το ρόλο του Owner." };
      if (currentRole === "admin" && role !== "owner") return { ok: false, forbidden: true };
    }

    const nextMetadata: Record<string, unknown> = {
      ...existing,
      allowedBrands: data.allowedBrands !== undefined ? data.allowedBrands : currentBrands,
    };
    if (data.role !== undefined && !isOwnerEmail(email)) nextMetadata.role = data.role;

    await client.users.updateUserMetadata(userId, { publicMetadata: nextMetadata });

    const performer = await currentUser();
    const performerName = [performer?.firstName, performer?.lastName].filter(Boolean).join(" ").trim() || performer?.primaryEmailAddress?.emailAddress ?? "—";
    if (data.role !== undefined && !isOwnerEmail(email)) {
      const details = `Ο ${performerName} άλλαξε το ρόλο του χρήστη ${targetName} από [${currentRole || "customer"}] σε [${data.role}].`;
      await createAuditLog("UPDATE_ROLE", email, details);
    }
    if (data.allowedBrands !== undefined) {
      const oldStr = currentBrands.length ? currentBrands.join(", ") : "—";
      const newStr = data.allowedBrands.length ? data.allowedBrands.join(", ") : "—";
      const details = `Ο ${performerName} άλλαξε τις μάρκες του χρήστη ${targetName} από [${oldStr}] σε [${newStr}].`;
      await createAuditLog("UPDATE_BRANDS", email, details);
    }
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

export type SetUserSuspendedResult =
  | { ok: true }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Suspend or activate a user (sets publicMetadata.suspended). Only owner can suspend an Admin. */
export async function setUserSuspended(userId: string, suspended: boolean): Promise<SetUserSuspendedResult> {
  const currentRole = await getCurrentAdminRole();
  if (!currentRole || currentRole === "support") return { ok: false, forbidden: true };

  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existing = (user.publicMetadata as Record<string, unknown>) ?? {};
    const targetRole = (existing.role as string) || "";
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    const targetName = [user.firstName, user.lastName].filter(Boolean).join(" ") || email || "—";

    if (targetRole === "admin" && currentRole !== "owner") return { ok: false, forbidden: true };
    if (isOwnerEmail(email)) return { ok: false, error: "Δεν μπορείτε να αναστείλετε τον Owner." };

    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...existing, suspended },
    });

    const action = suspended ? "SUSPEND" : "ACTIVATE";
    const performer = await currentUser();
    const performerName = [performer?.firstName, performer?.lastName].filter(Boolean).join(" ").trim() || performer?.primaryEmailAddress?.emailAddress ?? "—";
    const details = suspended
      ? `Ο ${performerName} απέκλεισε την πρόσβαση του χρήστη ${targetName}.`
      : `Ο ${performerName} ενεργοποίησε ξανά τον χρήστη ${targetName}.`;
    await createAuditLog(action, email, details);
    return { ok: true };
  } catch (e) {
    console.error("setUserSuspended:", e);
    return { ok: false, error: "Σφάλμα ενημέρωσης χρήστη." };
  }
}

export type GetAuditLogsResult =
  | { ok: true; data: AuditLogRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Fetch audit log. Only Owner can view the full audit log. */
export async function getAuditLogs(): Promise<GetAuditLogsResult> {
  const role = await getCurrentAdminRole();
  if (role !== "owner") return { ok: false, forbidden: true };

  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 500,
    });
    return {
      ok: true,
      data: logs.map((l) => ({
        id: l.id,
        action: l.action,
        performedBy: l.performedBy,
        targetUser: l.targetUser,
        details: l.details,
        createdAt: l.createdAt,
      })),
    };
  } catch (e) {
    console.error("getAuditLogs:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης ιστορικού." };
  }
}

export type PendingInvitationRow = { id: string; email: string; role: string; createdAt: Date };

export type GetPendingInvitationsResult =
  | { ok: true; data: PendingInvitationRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

export async function getPendingInvitations(): Promise<GetPendingInvitationsResult> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };
  try {
    const list = await prisma.pendingInvitation.findMany({
      orderBy: { createdAt: "desc" },
    });
    return { ok: true, data: list };
  } catch (e) {
    console.error("getPendingInvitations:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης προσκλήσεων." };
  }
}

export type CreateInvitationResult =
  | { ok: true }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Create a pending invitation (email + role). Only owner or admin. User gets role when they sign up (sync). */
export async function createInvitation(email: string, role: string): Promise<CreateInvitationResult> {
  const currentRole = await getCurrentAdminRole();
  if (currentRole !== "owner" && currentRole !== "admin") return { ok: false, forbidden: true };

  const trimmed = email?.trim().toLowerCase();
  if (!trimmed) return { ok: false, error: "Το email είναι υποχρεωτικό." };
  const allowedRoles = ["admin", "support", "customer"];
  const roleNorm = role === "member" ? "customer" : role;
  if (!allowedRoles.includes(roleNorm)) return { ok: false, error: "Μη έγκυρος ρόλος." };

  try {
    await prisma.pendingInvitation.upsert({
      where: { email: trimmed },
      create: { email: trimmed, role: roleNorm },
      update: { role: roleNorm },
    });
    const performer = await currentUser();
    const performerName = [performer?.firstName, performer?.lastName].filter(Boolean).join(" ").trim() || performer?.primaryEmailAddress?.emailAddress ?? "—";
    const details = `Πρόσκληση για ${trimmed} με ρόλο ${roleNorm} από ${performerName}.`;
    await createAuditLog("INVITE", trimmed, details);
    return { ok: true };
  } catch (e) {
    console.error("createInvitation:", e);
    return { ok: false, error: "Σφάλμα δημιουργίας πρόσκλησης." };
  }
}

/** Apply pending invitations to existing users (set role) and remove from pending. Call on admin load. */
export async function syncPendingInvitations(): Promise<{ ok: true; applied: number } | { ok: false }> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false };

  try {
    const pending = await prisma.pendingInvitation.findMany();
    if (pending.length === 0) return { ok: true, applied: 0 };

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({ limit: 500 });
    const emailToUser = new Map<string, { id: string; publicMetadata: Record<string, unknown> }>();
    for (const u of users) {
      const email = u.primaryEmailAddress?.emailAddress ?? (u as { emailAddresses?: { emailAddress?: string }[] }).emailAddresses?.[0]?.emailAddress;
      if (email) emailToUser.set(email.trim().toLowerCase(), { id: u.id, publicMetadata: (u.publicMetadata as Record<string, unknown>) ?? {} });
    }

    let applied = 0;
    for (const inv of pending) {
      const user = emailToUser.get(inv.email);
      if (!user) continue;
      await client.users.updateUserMetadata(user.id, {
        publicMetadata: {
          ...user.publicMetadata,
          role: inv.role,
        },
      });
      await prisma.pendingInvitation.delete({ where: { id: inv.id } });
      applied++;
    }
    return { ok: true, applied };
  } catch (e) {
    console.error("syncPendingInvitations:", e);
    return { ok: false };
  }
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
