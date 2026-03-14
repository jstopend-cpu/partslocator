"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import prisma from "@/database/client";

export type SubscriptionTier = "FREE" | "BASIC" | "PRO";

/**
 * Primary source of truth: Clerk publicMetadata.subscriptionTier.
 * Fallback: publicMetadata.plan (PRO/BASIC), then Profile.subscriptionTier, else FREE.
 */
export async function getSubscriptionTier(): Promise<SubscriptionTier> {
  const { userId } = await auth();
  if (!userId) return "FREE";

  const user = await currentUser();
  const metadata = user?.publicMetadata as { subscriptionTier?: string; plan?: string } | undefined;
  const fromMetadata = metadata?.subscriptionTier ?? metadata?.plan;
  if (fromMetadata === "PRO" || fromMetadata === "BASIC") {
    return fromMetadata as SubscriptionTier;
  }
  if (fromMetadata === "FREE") return "FREE";

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { subscriptionTier: true },
  });
  if (profile?.subscriptionTier === "PRO" || profile?.subscriptionTier === "BASIC") {
    return profile.subscriptionTier as SubscriptionTier;
  }
  if (profile?.subscriptionTier === "FREE") return "FREE";

  return "FREE";
}
