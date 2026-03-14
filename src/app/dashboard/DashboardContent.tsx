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
  const { isLoaded } = useAuth();
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

  const loadProducts = useCallback((pageNum: number, searchTerm: string) => {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    const { signal } = controller;
    const url = `/api/products?page=${pageNum}&search=${encodeURIComponent(searchTerm)}`;

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        const totalHeader = res.headers.get("X-Total-Count");
        const total = totalHeader != null ? parseInt(totalHeader, 10) || 0 : 0;
        return res.json().then((data) => ({ data, total }));
      })
      .then(({ data, total }) => {
        const raw = Array.isArray(data) ? data : Array.isArray(data?.products) ? data.products : [];
        console.log("[Dashboard] Products response:", { totalCount: total, page: pageNum, itemsReturned: raw.length });
        const list = raw.map((p: { id: string; partNumber?: string; name: string; officialMsrp?: number; updatedAt?: string; stocks?: Array<{ supplier?: { name?: string }; supplierPrice?: number; quantity?: number; updatedAt?: string }> }) => {
          const first = p.stocks?.[0];
          return {
            id: p.id,
            partNumber: p.partNumber,
            name: p.name,
            ean: p.partNumber ?? "",
            supplier: first?.supplier?.name ?? "",
            price: first?.supplierPrice ?? p.officialMsrp ?? 0,
            stock: first?.quantity ?? 0,
            updatedAt: first?.updatedAt ?? p.updatedAt ?? new Date().toISOString(),
          };
        });
        setDashboardData(list);
        setTotalCount(total);
        setLoading(false);
      })
      .catch((e) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setDashboardData([]);
        setTotalCount(0);
        setError("Database connection error. Please refresh.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const cleanup = loadProducts(page, search);
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [page, search, loadProducts]);

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
