"use client";

import React from "react";
import { useUser } from "@clerk/nextjs";
import { getSubscriptionTier, type SubscriptionTier } from "@/app/actions/subscription";
import { UpgradeToPro } from "@/components/UpgradeToPro";

type SubscriptionGateProps = {
  /** Minimum tier required to see content (PRO > BASIC > FREE). */
  requiredTier: SubscriptionTier;
  /** Content to show when user has required tier or higher. */
  children: React.ReactNode;
  /** Optional: content to show when gate blocks (default: UpgradeToPro card). */
  fallback?: React.ReactNode;
  /** Optional: while resolving tier, show this (default: null). */
  loading?: React.ReactNode;
};

const TIER_ORDER: Record<SubscriptionTier, number> = { FREE: 0, BASIC: 1, PRO: 2 };

function meetsTier(userTier: SubscriptionTier, required: SubscriptionTier): boolean {
  return TIER_ORDER[userTier] >= TIER_ORDER[required];
}

export function SubscriptionGate({
  requiredTier,
  children,
  fallback,
  loading = null,
}: SubscriptionGateProps) {
  const { isLoaded } = useUser();
  const [tier, setTier] = React.useState<SubscriptionTier | null>(null);

  React.useEffect(() => {
    if (!isLoaded) return;
    getSubscriptionTier().then(setTier);
  }, [isLoaded]);

  if (!isLoaded || tier === null) {
    return <>{loading}</>;
  }

  if (meetsTier(tier, requiredTier)) {
    return <>{children}</>;
  }

  return <>{fallback ?? <UpgradeToPro />}</>;
}
