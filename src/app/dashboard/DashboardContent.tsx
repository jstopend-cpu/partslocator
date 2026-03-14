"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

const PAGE_SIZE = 10;

export default function DashboardContent() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();
  const searchParams = useSearchParams();
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const search = searchParams.get("q") ?? searchParams.get("search") ?? "";

  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const FETCH_TIMEOUT_MS = 12000;

  const loadProducts = useCallback((_pageNum: number, _searchTerm: string) => {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    const { signal } = controller;
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const url = `/api/products?page=${_pageNum}&search=${encodeURIComponent(_searchTerm)}`;
    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json().then((body: unknown) => ({
          data: Array.isArray(body) ? body : [],
          total: Number(res.headers.get("X-Total-Count") ?? 0) || 0,
        }));
      })
      .then(({ data, total }) => {
        const mapped = (Array.isArray(data) ? data : []).map((p: Record<string, unknown>) => ({
          id: String(p.id ?? ""),
          partNumber: String(p.partNumber ?? ""),
          name: String(p.name ?? ""),
          ean: String(p.partNumber ?? p.ean ?? ""),
          supplier: String(
            (p.stocks as { supplier?: { name?: string } }[])?.[0]?.supplier?.name ?? p.brand ?? ""
          ),
          price: Number(p.officialMsrp ?? (p.stocks as { supplierPrice?: number }[])?.[0]?.supplierPrice ?? 0) || 0,
          stock: Array.isArray(p.stocks)
            ? (p.stocks as { quantity?: number }[]).reduce((s, t) => s + (Number(t.quantity) || 0), 0)
            : 0,
          updatedAt: String(p.updatedAt ?? ""),
        })) as DashboardProduct[];
        setDashboardData(mapped);
        setTotalCount(total);
        setError(null);
      })
      .catch(() => {
        setDashboardData([]);
        setTotalCount(0);
        setError(null);
      })
      .finally(() => {
        clearTimeout(timeoutId);
        setLoading(false);
      });
    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    if (!search.trim()) {
      setDashboardData([]);
      setTotalCount(0);
      setLoading(false);
      setError(null);
      return;
    }
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

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
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

  return (
    <DashboardClient
      initialProducts={safeProductsList}
      page={page}
      pageSize={PAGE_SIZE}
      totalCount={typeof totalCount === "number" ? totalCount : 0}
      suppliers={Array.isArray(suppliers) ? suppliers : []}
      searchTerm={search}
      isLoading={loading}
      onSearchChange={(q) => {
        const query = q.trim() ? `?page=1&q=${encodeURIComponent(q.trim())}` : "";
        router.replace(`/dashboard${query}`);
      }}
      onPageChange={(newPage) => {
        const query = search ? `page=${newPage}&q=${encodeURIComponent(search)}` : `page=${newPage}`;
        router.push(`/dashboard?${query}`);
      }}
    />
  );
}
