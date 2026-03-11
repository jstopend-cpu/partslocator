"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

export default function CustomerDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [dashboardData, setDashboardData] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const loadProducts = useCallback(() => {
    setError(null);
    setLoading(true);
    const controller = new AbortController();
    const { signal } = controller;

    fetch("/api/products", { signal })
      .then((res) => {
        if (!res.ok) throw new Error("Network response was not ok");
        if (res.status === 404) {
          setDashboardData([]);
          setTotalCount(0);
          setLoading(false);
          return null;
        }
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        if (data === null) return;
        setDashboardData(Array.isArray(data.products) ? data.products : []);
        setTotalCount(typeof data?.totalCount === "number" ? data.totalCount : 0);
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
    const cleanup = loadProducts();
    return () => {
      if (typeof cleanup === "function") cleanup();
    };
  }, [loadProducts]);

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

  if (!isMounted) {
    return <div className="p-10">Loading Dashboard...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return (
      <div className="p-10">
        <p className="mb-3 text-slate-300">{error}</p>
        <button
          type="button"
          onClick={() => loadProducts()}
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
      page={1}
      pageSize={50}
      totalCount={typeof totalCount === "number" ? totalCount : 0}
      suppliers={Array.isArray(suppliers) ? suppliers : []}
    />
  );
}
