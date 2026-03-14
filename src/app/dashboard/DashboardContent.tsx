"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

const PAGE_SIZE = 10;

export default function DashboardContent() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("q") ?? searchParams.get("search") ?? "";

  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // TEMPORARILY DISABLED: fetch commented out to rule out data volume causing auth timeout / redirect loop.
  const loadProducts = useCallback((_pageNum: number, _searchTerm: string) => {
    setLoading(false);
    // setError(null);
    // setLoading(true);
    // const controller = new AbortController();
    // const { signal } = controller;
    // const url = `/api/products?page=${_pageNum}&search=${encodeURIComponent(_searchTerm)}`;
    // fetch(url, { signal })
    //   .then((res) => { ... })
    //   .then(({ data, total }) => { ... })
    //   .catch((e) => { ... });
    // return () => controller.abort();
    return () => {};
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    const cleanup = loadProducts(page, search);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [isLoaded, page, search, loadProducts]);

  const safeProductsList = useMemo(
    () => (Array.isArray(dashboardData) ? dashboardData : []) as DashboardProduct[],
    [dashboardData]
  );

  const suppliers = useMemo(
    () =>
      [...new Set((Array.isArray(dashboardData) ? dashboardData : []).map((p: DashboardProduct) => p.supplier))]
        .filter(Boolean)
        .sort(),
    [dashboardData]
  );

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (isLoaded && !isSignedIn) {
    router.push("/login");
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (loading) {
    return <div className="p-10">Φόρτωση...</div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <p className="mb-3 text-slate-300">{error}</p>
        <button
          type="button"
          onClick={() => loadProducts(page, search)}
          className="rounded-md border border-slate-600 bg-slate-700 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-600"
        >
          Retry
        </button>
      </div>
    );
  }

  if (safeProductsList.length === 0) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 px-4 py-12">
        <p className="max-w-md text-center text-slate-300">
          Δεν βρέθηκαν προϊόντα. Ξεκινήστε προσθέτοντας το πρώτο σας ανταλλακτικό!
        </p>
        <p className="text-sm text-slate-500">
          Μπορείτε να εισάγετε δεδομένα από το Admin ή να τρέξετε το seed της βάσης.
        </p>
      </div>
    );
  }

  return (
    <DashboardClient
      initialProducts={safeProductsList}
      page={page}
      pageSize={PAGE_SIZE}
      totalCount={typeof totalCount === "number" ? totalCount : 0}
      suppliers={Array.isArray(suppliers) ? suppliers : []}
      searchTerm={search}
      onSearchChange={(q) => {
        const query = q ? `?page=1&q=${encodeURIComponent(q)}` : "?page=1";
        router.replace(`/dashboard${query}`);
      }}
      onPageChange={(newPage) => {
        const query = search ? `page=${newPage}&q=${encodeURIComponent(search)}` : `page=${newPage}`;
        router.push(`/dashboard?${query}`);
      }}
    />
  );
}
