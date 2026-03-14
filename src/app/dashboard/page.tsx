import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <h1 className="px-6 py-4 text-xl font-semibold text-white">Dashboard</h1>
      <Suspense fallback={<div className="p-10">Φόρτωση...</div>}>
        <DashboardContent />
      </Suspense>
    </div>
  );
}
