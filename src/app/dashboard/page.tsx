"use client";

import { Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div>Φόρτωση...</div>;
  }

  if (isLoaded && !userId) {
    return <div>Παρακαλώ συνδεθείτε στο /login</div>;
  }

  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
