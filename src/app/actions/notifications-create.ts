"use server";

import prisma from "@/database/client";

export type NotificationType = "NEW_USER" | "SEARCH_LIMIT" | "NEW_ORDER" | "ADMIN_ACTION";

/** Create a notification (called from triggers). No auth - used by admin-users and notifyNewUser. */
export async function createNotification(
  type: NotificationType,
  message: string,
  options?: { targetUserId?: string }
): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        type,
        message,
        targetUserId: options?.targetUserId ?? null,
      },
    });
  } catch (e) {
    console.error("createNotification:", e);
  }
}
