"use client";

import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
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

  const safeProductsList = useMemo(
    () => (Array.isArray(dashboardData) ? dashboardData : []) as DashboardProduct[],
    [dashboardData]
  );

  const suppliers = useMemo(
    () =>
      [...new Set((dashboardData || []).map((p: DashboardProduct) => p.supplier))]
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
    return <div className="p-10">{error}</div>;
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
