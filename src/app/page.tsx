import { Suspense } from "react";
import { BrandGrid } from "@/components/home/BrandGrid";
import MarketplaceDashboardContent from "./MarketplaceDashboardClient";

export type { UserPlan } from "./MarketplaceDashboardClient";

export default function Page() {
  return (
    <div className="min-h-screen bg-slate-950">
      <div className="p-4 sm:p-6">
        <BrandGrid />
      </div>
      <Suspense
        fallback={
          <div className="flex min-h-[200px] items-center justify-center">
            <p className="text-sm text-slate-500">Φόρτωση...</p>
          </div>
        }
      >
        <MarketplaceDashboardContent />
      </Suspense>
    </div>
  );
}
