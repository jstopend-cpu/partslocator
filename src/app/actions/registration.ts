"use server";

import { clerkClient } from "@clerk/nextjs/server";
import prisma from "@/database/client";

export type CompleteRegistrationResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * After Clerk sign-up: create Profile (FREE, searchCredits 3), B2BRegistration, and set Clerk publicMetadata.
 */
export async function completeRegistration(
  userId: string,
  data: { email: string; companyName: string; afm: string }
): Promise<CompleteRegistrationResult> {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.profile.upsert({
        where: { userId },
        create: {
          userId,
          subscriptionTier: "FREE",
          searchCredits: 3,
        },
        update: {
          subscriptionTier: "FREE",
          searchCredits: 3,
        },
      });

      await tx.b2BRegistration.upsert({
        where: { email: data.email },
        create: {
          email: data.email,
          companyName: data.companyName,
          afm: data.afm,
        },
        update: {
          companyName: data.companyName,
          afm: data.afm,
        },
      });
    });

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existing = (user.publicMetadata as Record<string, unknown>) ?? {};
    await client.users.updateUserMetadata(userId, {
      publicMetadata: { ...existing, subscriptionTier: "FREE" },
    });

    return { ok: true };
  } catch (e) {
    console.error("completeRegistration:", e);
    return { ok: false, error: "Σφάλμα κατά την ολοκλήρωση εγγραφής." };
  }
}
