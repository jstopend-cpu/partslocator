"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Loader2, Package, TrendingUp, Box, Eye } from "lucide-react";
import {
  getSupplierDashboardStats,
  getSupplierSubOrders,
  type SupplierDashboardStats,
  type SupplierSubOrderRow,
} from "@/app/actions/supplier-portal";

const STATUS_BADGE: Record<string, string> = {
  PENDING: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  PROCESSING: "border-blue-500/50 bg-blue-500/15 text-blue-300",
  SHIPPED: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  COMPLETED: "border-slate-500/50 bg-slate-500/15 text-slate-300",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Σε αναμονή",
  PROCESSING: "Σε επεξεργασία",
  SHIPPED: "Απεστάλη",
  COMPLETED: "Ολοκληρωμένη",
};

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(n);

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function SupplierDashboardPage() {
  const [stats, setStats] = useState<SupplierDashboardStats | null>(null);
  const [subOrders, setSubOrders] = useState<SupplierSubOrderRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([getSupplierDashboardStats(), getSupplierSubOrders()]).then(
      ([s, list]) => {
        setStats(s ?? null);
        setSubOrders(list);
        setLoading(false);
      },
    );
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <>
      <h1 className="mb-6 text-xl font-semibold text-slate-200">Dashboard</h1>

      {/* Summary cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Pending Orders</p>
              <p className="text-2xl font-semibold text-slate-100">
                {stats?.pendingOrders ?? 0}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Sales (this month)</p>
              <p className="text-2xl font-semibold text-slate-100">
                {formatCurrency(stats?.totalSalesThisMonth ?? 0)}
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/20 text-blue-400">
              <Box className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500">Total Products</p>
              <p className="text-2xl font-semibold text-slate-100">
                {stats?.totalProducts ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub-orders list */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50">
        <h2 className="border-b border-slate-800 px-4 py-3 text-base font-semibold text-slate-200 sm:px-6">
          Sub-Orders (Vendor Orders)
        </h2>
        {subOrders.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            Δεν υπάρχουν ακόμα παραγγελίες.
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="space-y-3 p-4 sm:p-6 md:hidden">
              {subOrders.map((row) => (
                <li
                  key={row.id}
                  className="rounded-lg border border-slate-700/80 bg-slate-800/50 p-4"
                >
                  <p className="font-mono text-xs text-slate-500 truncate">{row.orderId}</p>
                  <p className="mt-1 text-sm text-slate-300">{formatDate(row.createdAt)}</p>
                  <p className="mt-0.5 text-sm text-slate-400">{row.customerName ?? "—"}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">
                    {formatCurrency(row.totalPrice)}
                  </p>
                  <span
                    className={`mt-2 inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      STATUS_BADGE[row.status] ?? "border-slate-600 bg-slate-700/50 text-slate-400"
                    }`}
                  >
                    {STATUS_LABELS[row.status] ?? row.status}
                  </span>
                  <Link
                    href={`/supplier/orders/${row.id}`}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-800 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-blue-500/15 hover:text-blue-300"
                  >
                    <Eye className="h-4 w-4" />
                    Order Details
                  </Link>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 sm:px-6">Order ID</th>
                    <th className="px-4 py-3 sm:px-6">Date</th>
                    <th className="px-4 py-3 sm:px-6">Customer</th>
                    <th className="px-4 py-3 sm:px-6">Total</th>
                    <th className="px-4 py-3 sm:px-6">Status</th>
                    <th className="px-4 py-3 sm:px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {subOrders.map((row) => (
                    <tr
                      key={row.id}
                      className="border-b border-slate-800/80 transition-colors hover:bg-slate-800/50"
                    >
                      <td className="px-4 py-3 font-mono text-xs text-slate-500 sm:px-6">
                        {row.orderId}
                      </td>
                      <td className="px-4 py-3 text-slate-300 sm:px-6">
                        {formatDate(row.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-slate-300 sm:px-6">
                        {row.customerName ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200 sm:px-6">
                        {formatCurrency(row.totalPrice)}
                      </td>
                      <td className="px-4 py-3 sm:px-6">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                            STATUS_BADGE[row.status] ?? "border-slate-600 bg-slate-700/50 text-slate-400"
                          }`}
                        >
                          {STATUS_LABELS[row.status] ?? row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right sm:px-6">
                        <Link
                          href={`/supplier/orders/${row.id}`}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-blue-500/15 hover:text-blue-300"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Order Details
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </>
  );
}
