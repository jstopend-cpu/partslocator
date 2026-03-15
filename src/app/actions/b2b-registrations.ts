"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

const OWNER_EMAIL = "jstopend@gmail.com";

/** Allow access if user is owner, admin, or support. */
export async function canAccessAdmin(): Promise<boolean> {
  const { userId } = await auth();
  const user = await currentUser();
  const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
  const userEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();
  if (userEmail === OWNER_EMAIL.toLowerCase()) return true;
  if (role === "admin" || role === "support") return true;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  if (adminEmail && userEmail === adminEmail) return true;
  if (userId === ADMIN_USER_ID) return true;
  return false;
}

export type B2BRegistrationRow = {
  id: string;
  email: string;
  companyName: string;
  afm: string;
  registeredAt: Date;
  welcomeEmailSentAt: Date | null;
};

export type GetB2BRegistrationsResult =
  | { ok: true; data: B2BRegistrationRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string };

/** Only allow if current user's email is ADMIN_EMAIL, or (fallback) userId is ADMIN_USER_ID. */
export async function getB2BRegistrations(): Promise<GetB2BRegistrationsResult> {
  const { userId } = await auth();
  const user = await currentUser();
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const userEmail = user?.primaryEmailAddress?.emailAddress?.trim().toLowerCase();

  const allowedByEmail = !!adminEmail && userEmail === adminEmail;
  const allowedByUserId = userId === ADMIN_USER_ID;
  if (!allowedByEmail && !allowedByUserId) {
    return { ok: false, forbidden: true };
  }

  try {
    const rows = await prisma.b2BRegistration.findMany({
      orderBy: { registeredAt: "desc" },
      select: {
        id: true,
        email: true,
        companyName: true,
        afm: true,
        registeredAt: true,
        welcomeEmailSentAt: true,
      },
    });
    return { ok: true, data: rows };
  } catch (e) {
    console.error("getB2BRegistrations:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης δεδομένων." };
  }
}
