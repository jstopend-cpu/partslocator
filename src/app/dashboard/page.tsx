"use client";

import { useEffect, useState } from "react";
import DashboardClient from "./DashboardClient";
import type { DashboardProduct } from "./DashboardClient";

export default function CustomerDashboardPage() {
  const [products, setProducts] = useState<DashboardProduct[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to load products");
        const data = await res.json();
        if (!cancelled) {
          setProducts(data.products ?? []);
          setTotalCount(data.totalCount ?? 0);
        }
      } catch (e) {
        if (!cancelled) {
          setError("Database connection error. Please refresh.");
          setProducts([]);
          setTotalCount(0);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="p-10">{error}</div>;
  }

  const suppliers = [...new Set(products.map((p) => p.supplier))].filter(Boolean).sort();

  return (
    <DashboardClient
      initialProducts={products}
      page={1}
      pageSize={50}
      totalCount={totalCount}
      suppliers={suppliers}
    />
  );
}
