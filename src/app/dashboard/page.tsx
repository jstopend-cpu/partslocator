import { Suspense } from "react";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
