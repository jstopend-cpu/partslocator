"use server";

import { currentUser, clerkClient } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const OWNER_EMAIL = "jstopend@gmail.com";

export async function canAccessAdminPage(): Promise<boolean> {
  const user = await currentUser();
  if (!user) return false;
  const role = (user.publicMetadata as { role?: string } | undefined)?.role;
  const email = user.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  return role === "admin" || email === OWNER_EMAIL.toLowerCase();
}

export type AdminUserRow = {
  id: string;
  name: string;
  email: string;
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
      const metadata = (u.publicMetadata as { allowedBrands?: string[] } | undefined) ?? {};
      const allowedBrands = Array.isArray(metadata.allowedBrands) ? metadata.allowedBrands : [];
      const firstName = u.firstName ?? "";
      const lastName = u.lastName ?? "";
      const name = [firstName, lastName].filter(Boolean).join(" ") || "—";
      const email = u.primaryEmailAddress?.emailAddress ?? u.emailAddresses?.[0]?.emailAddress ?? "—";
      return {
        id: u.id,
        name,
        email,
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

/** Update a user's allowedBrands in Clerk publicMetadata. Only allowed if current user is admin. */
export async function updateUserAllowedBrands(
  userId: string,
  allowedBrands: string[]
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
        allowedBrands,
      },
    });
    return { ok: true };
  } catch (e) {
    console.error("updateUserAllowedBrands:", e);
    return { ok: false, error: "Σφάλμα ενημέρωσης χρήστη." };
  }
}
