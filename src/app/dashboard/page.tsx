"use client";

import { Suspense } from "react";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import DashboardContent from "./DashboardContent";
import LoginPage from "../login/page";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (isLoaded && !userId) {
    return <LoginPage />;
  }

  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
