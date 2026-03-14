"use client";

import { Suspense, useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoaded) return;
    setIsAuthorized(!!userId);
  }, [isLoaded, userId]);

  if (!isLoaded) return <div>Φόρτωση...</div>;
  if (!userId) return <div>Παρακαλώ συνδεθείτε στο /login</div>;
  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
