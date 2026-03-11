"use client";

import { useEffect, useMemo, useState } from "react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

export default function CustomerDashboardPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [products, setProducts] = useState([]);
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
          setProducts([]);
          setTotalCount(0);
          setLoading(false);
          return null;
        }
        return res.json().catch(() => ({}));
      })
      .then((data) => {
        if (data === null) return;
        if (data && Array.isArray(data.products)) {
          setProducts(data.products);
        } else {
          setProducts([]);
        }
        setTotalCount(typeof data?.totalCount === "number" ? data.totalCount : 0);
        setLoading(false);
      })
      .catch((e) => {
        if (e instanceof Error && e.name === "AbortError") return;
        setProducts([]);
        setTotalCount(0);
        setError("Database connection error. Please refresh.");
        setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const safeProductsList = useMemo(() => (products || []) as DashboardProduct[], [products]);

  const suppliers = useMemo(
    () =>
      [...new Set((products || []).map((p: DashboardProduct) => p.supplier))].filter(Boolean).sort(),
    [products]
  );

  if (!isMounted) {
    return <div>Loading...</div>;
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
      suppliers={suppliers}
    />
  );
}
