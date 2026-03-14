import { Suspense } from "react";
import MarketplaceDashboardContent from "./MarketplaceDashboardClient";

export type { UserPlan } from "./MarketplaceDashboardClient";

export default function Page() {
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
