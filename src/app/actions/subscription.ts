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

export type ProfileInfo = { subscriptionTier: SubscriptionTier; searchCredits: number } | null;

/** Returns current user's profile (subscriptionTier, searchCredits). For FREE users, searchCredits is used for search limit. */
export async function getProfile(): Promise<ProfileInfo> {
  const { userId } = await auth();
  if (!userId) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { subscriptionTier: true, searchCredits: true },
  });
  if (!profile) return null;

  const tier = (profile.subscriptionTier === "PRO" || profile.subscriptionTier === "BASIC"
    ? profile.subscriptionTier
    : "FREE") as SubscriptionTier;
  return {
    subscriptionTier: tier,
    searchCredits: profile.searchCredits ?? 0,
  };
}

/** Decrement search credits for FREE user. No-op for BASIC/PRO. Returns new count or error. */
export async function decrementSearchCredits(): Promise<{ ok: true; remaining: number } | { ok: false; error: string }> {
  const { userId } = await auth();
  if (!userId) return { ok: false, error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId },
    select: { subscriptionTier: true, searchCredits: true },
  });
  if (!profile) return { ok: false, error: "Profile not found" };
  if (profile.subscriptionTier !== "FREE") {
    return { ok: true, remaining: -1 }; // unlimited
  }

  const current = Math.max(0, profile.searchCredits ?? 0);
  const next = Math.max(0, current - 1);
  await prisma.profile.update({
    where: { userId },
    data: { searchCredits: next },
  });
  return { ok: true, remaining: next };
}
