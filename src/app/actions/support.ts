"use server";

import { currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";
import { sendAdminCriticalEmail } from "@/lib/admin-email";

export type SupportPriority = "LOW" | "MEDIUM" | "HIGH";

export type SubmitSupportTicketResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Submit a support ticket from the Help Center form.
 * Saves to DB and sends email notification to admin.
 */
export async function submitSupportTicket(
  subject: string,
  message: string,
  priority: SupportPriority
): Promise<SubmitSupportTicketResult> {
  const trimmedSubject = subject?.trim();
  const trimmedMessage = message?.trim();
  if (!trimmedSubject || !trimmedMessage) {
    return { ok: false, error: "Συμπληρώστε θέμα και μήνυμα." };
  }
  const validPriorities: SupportPriority[] = ["LOW", "MEDIUM", "HIGH"];
  if (!validPriorities.includes(priority)) {
    return { ok: false, error: "Μη έγκυρη προτεραιότητα." };
  }

  try {
    const user = await currentUser();
    const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;
    const userId = user?.id ?? null;

    await prisma.supportTicket.create({
      data: {
        subject: trimmedSubject.slice(0, 500),
        message: trimmedMessage.slice(0, 5000),
        priority,
        userEmail,
        userId,
      },
    });

    const priorityLabel = priority === "HIGH" ? "Υψηλή" : priority === "MEDIUM" ? "Μέτρια" : "Χαμηλή";
    const body = [
      `Θέμα: ${trimmedSubject}`,
      `Προτεραιότητα: ${priorityLabel}`,
      `Από: ${userEmail ?? "Ανώνυμος"}`,
      "",
      trimmedMessage,
    ].join("\n");
    await sendAdminCriticalEmail(`Support: ${trimmedSubject} [${priorityLabel}]`, body);

    return { ok: true };
  } catch (e) {
    console.error("submitSupportTicket:", e);
    return { ok: false, error: "Αποτυχία αποστολής. Δοκιμάστε ξανά." };
  }
}
