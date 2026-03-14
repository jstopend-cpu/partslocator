"use client";

import { Suspense, useEffect } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (userId == null && typeof window !== "undefined") {
      window.location.href = "/login";
      return;
    }
  }, [isLoaded, userId]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (userId == null) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
