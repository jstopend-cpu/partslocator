"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import DashboardContent from "./DashboardContent";

export default function CustomerDashboardPage() {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return <div className="p-10">Φόρτωση...</div>;
  }

  if (!userId) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4">
        <p className="text-slate-300">Παρακαλώ συνδεθείτε.</p>
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Σύνδεση
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
