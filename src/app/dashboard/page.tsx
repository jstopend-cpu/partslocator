"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (isLoaded && userId == null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4">
        <p className="text-slate-300">Please log in to continue</p>
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Log in
        </Link>
      </div>
    );
  }

  return (
    <Suspense fallback={<div className="p-10">Φόρτωση Dashboard...</div>}>
      <DashboardContent />
    </Suspense>
  );
}
