"use client";

import { useAuth } from "@clerk/nextjs";
import { Suspense } from "react";
import LandingPage from "./LandingPage";
import MarketplaceDashboardContent from "./MarketplaceDashboardClient";

export default function HomePageGate() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-500">Φόρτωση...</p>
      </div>
    );
  }

  if (!userId) {
    return <LandingPage />;
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-950">
          <p className="text-sm text-slate-500">Φόρτωση...</p>
        </div>
      }
    >
      <MarketplaceDashboardContent />
    </Suspense>
  );
}
