"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

export default function CustomerDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const { signal } = controller;

    let aborted = false;
    async function load() {
      try {
        const res = await fetch("/api/products", { signal });
        if (!res.ok) throw new Error("Network response was not ok");
        const data = await res.json().catch(() => ({}));

        if (res.status === 404) {
          setProducts([]);
          setTotalCount(0);
          return;
        }

        setProducts(Array.isArray(data.products) ? data.products : []);
        setTotalCount(typeof data?.totalCount === "number" ? data.totalCount : 0);
      } catch (e) {
        if (e instanceof Error && e.name === "AbortError") {
          aborted = true;
          return;
        }
        setProducts([]);
        setTotalCount(0);
        setError("Database connection error. Please refresh.");
      } finally {
        if (!aborted) setLoading(false);
      }
    }

    load();
    return () => controller.abort();
  }, []);

  const safeProducts = useMemo(
    () => (Array.isArray(products) ? products : []),
    [products]
  );

  const suppliers = useMemo(
    () =>
      [...new Set((products || []).map((p) => p.supplier))].filter(Boolean).sort(),
    [products]
  );

  if (!isMounted) {
    return <div className="p-20">Loading...</div>;
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="p-10">{error}</div>;
  }

  return (
    <DashboardClient
      initialProducts={safeProducts}
      page={1}
      pageSize={50}
      totalCount={typeof totalCount === "number" ? totalCount : 0}
      suppliers={suppliers}
    />
  );
}
