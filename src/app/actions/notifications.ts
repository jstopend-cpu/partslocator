"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";
import { canAccessAdminPage } from "@/app/actions/admin-users";
import { createNotification } from "@/app/actions/notifications-create";

export type { NotificationType } from "@/app/actions/notifications-create";

export type NotificationRow = {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  targetUserId: string | null;
};

/** Get notifications for admin (latest first). */
export async function getNotifications(limit = 50): Promise<
  | { ok: true; data: NotificationRow[] }
  | { ok: false; forbidden: true }
  | { ok: false; error: string }
> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };
  try {
    const list = await prisma.notification.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
    return {
      ok: true,
      data: list.map((n) => ({
        id: n.id,
        type: n.type,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
        targetUserId: n.targetUserId,
      })),
    };
  } catch (e) {
    console.error("getNotifications:", e);
    return { ok: false, error: "Σφάλμα φόρτωσης ειδοποιήσεων." };
  }
}

/** Unread count for bell badge. */
export async function getUnreadNotificationCount(): Promise<
  | { ok: true; count: number }
  | { ok: false; forbidden: true }
  | { ok: false; error: string }
> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };
  try {
    const count = await prisma.notification.count({
      where: { isRead: false },
    });
    return { ok: true, count };
  } catch (e) {
    console.error("getUnreadNotificationCount:", e);
    return { ok: false, error: "Σφάλμα." };
  }
}

/** Mark one notification as read. */
export async function markNotificationRead(id: string): Promise<
  | { ok: true }
  | { ok: false; forbidden: true }
  | { ok: false; error: string }
> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
    return { ok: true };
  } catch (e) {
    console.error("markNotificationRead:", e);
    return { ok: false, error: "Σφάλμα." };
  }
}

/** Mark all notifications as read. */
export async function markAllNotificationsRead(): Promise<
  | { ok: true }
  | { ok: false; forbidden: true }
  | { ok: false; error: string }
> {
  const allowed = await canAccessAdminPage();
  if (!allowed) return { ok: false, forbidden: true };
  try {
    await prisma.notification.updateMany({
      data: { isRead: true },
    });
    return { ok: true };
  } catch (e) {
    console.error("markAllNotificationsRead:", e);
    return { ok: false, error: "Σφάλμα." };
  }
}

/** Call after new user sign-up (e.g. from register page after verification). Creates NEW_USER notification for admins. */
export async function notifyNewUser(): Promise<void> {
  try {
    const user = await currentUser();
    if (!user) return;
    const email = user.primaryEmailAddress?.emailAddress ?? "";
    if (!email) return;
    const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
    const message = name ? `Νέος χρήστης: ${name} (${email})` : `Νέος χρήστης: ${email}`;
    await createNotification("NEW_USER", message);
  } catch (e) {
    console.error("notifyNewUser:", e);
  }
}
