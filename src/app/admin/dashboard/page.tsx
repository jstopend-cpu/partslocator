"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  Loader2,
  TrendingUp,
  ShoppingCart,
  Clock,
  Percent,
  Users,
  Package,
  Building2,
} from "lucide-react";
import { getDashboardStats, type DashboardStats } from "@/app/actions/orders";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

const formatMonth = (monthKey: string) => {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, m - 1, 1);
  return d.toLocaleDateString("el-GR", { month: "short", year: "2-digit" });
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Σε αναμονή",
  CONFIRMED: "Επιβεβαιωμένη",
  SHIPPED: "Απεστάλη",
  COMPLETED: "Ολοκληρωμένη",
  CANCELLED: "Ακυρωμένη",
};

const PIE_COLORS = [
  "#3b82f6", // blue
  "#10b981", // emerald
  "#f59e0b", // amber
  "#8b5cf6", // violet
  "#ef4444", // red
  "#06b6d4", // cyan
];

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDashboardStats().then((data) => {
      setStats(data ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  const barData =
    stats?.monthlySales.map(({ month, revenue }) => ({
      month: formatMonth(month),
      revenue: Math.round(revenue * 100) / 100,
    })) ?? [];

  const pieData =
    stats?.orderStatusDistribution.map(({ status, count }) => ({
      name: STATUS_LABELS[status] ?? status,
      value: count,
    })) ?? [];

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-semibold sm:text-xl">Admin Dashboard</h1>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        {/* Quick Stats cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-emerald-500/40 bg-emerald-500/20 text-emerald-400">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Revenue
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats ? formatCurrency(stats.totalRevenue) : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-cyan-500/40 bg-cyan-500/20 text-cyan-400">
                <Users className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Unique Customers
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats?.uniqueCustomers ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-blue-500/40 bg-blue-500/20 text-blue-400">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Orders
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats?.totalOrders ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-amber-500/40 bg-amber-500/20 text-amber-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Pending
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats?.pendingOrders ?? "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/20 text-violet-400">
                <Package className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Parts
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats?.totalParts != null ? stats.totalParts.toLocaleString() : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-400">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  Total Suppliers
                </p>
                <p className="text-xl font-semibold text-white">
                  {stats?.totalSuppliers ?? "—"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Growth card (optional single row) */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-5 py-3">
          <div className="flex items-center gap-3">
            <Percent className="h-5 w-5 text-slate-500" />
            <span className="text-sm text-slate-500">Μηνιαία ανάπτυξη εσόδων:</span>
            <span
              className={`text-lg font-semibold ${
                (stats?.growthPercent ?? 0) >= 0 ? "text-emerald-400" : "text-red-400"
              }`}
            >
              {stats != null ? `${stats.growthPercent >= 0 ? "+" : ""}${stats.growthPercent}%` : "—"}
            </span>
          </div>
        </div>

        {/* Bar chart - Revenue trend */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-200 sm:mb-4 sm:text-lg">
            Έσοδα ανά μήνα
          </h2>
          <div className="h-[300px] min-h-[200px]">
            {barData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Δεν υπάρχουν δεδομένα ακόμα.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                  <XAxis
                    dataKey="month"
                    stroke="#94a3b8"
                    tick={{ fill: "#e2e8f0", fontSize: 10 }}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    tick={{ fill: "#e2e8f0", fontSize: 10 }}
                    tickFormatter={(v: unknown) => `${((Number(v) || 0) / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    labelStyle={{ color: "#e2e8f0" }}
                    formatter={(value: unknown) => [formatCurrency(Number(value) || 0), "Έσοδα"]}
                    labelFormatter={(label: unknown) => String(label ?? "")}
                  />
                  <Bar
                    dataKey="revenue"
                    fill="#06b6d4"
                    stroke="#22d3ee"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie chart - Order status distribution */}
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5">
          <h2 className="mb-3 text-base font-semibold text-slate-200 sm:mb-4 sm:text-lg">
            Κατανομή παραγγελιών ανά κατάσταση
          </h2>
          <div className="h-[300px] min-h-[200px]">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-slate-500 text-sm">
                Δεν υπάρχουν δεδομένα ακόμα.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }: { name?: string; percent?: number }) =>
                      `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                    }
                    labelLine={{ stroke: "#94a3b8" }}
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="#0f172a"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0f172a",
                      border: "1px solid #475569",
                      borderRadius: "8px",
                    }}
                    formatter={(value: unknown) => [Number(value) || 0, "Παραγγελίες"]}
                  />
                  <Legend
                    wrapperStyle={{ color: "#e2e8f0" }}
                    formatter={(value: unknown) => <span className="text-slate-200 text-xs sm:text-sm">{String(value ?? "")}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top products - table on desktop, cards on mobile */}
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 shadow-sm">
          <h2 className="border-b border-slate-800 px-4 py-3 text-base font-semibold text-slate-200 sm:px-6 sm:py-4 sm:text-lg">
            Top Products (πιο παραγγελμένα ανταλλακτικά)
          </h2>
          {!stats?.topProducts.length ? (
            <p className="py-12 text-center text-slate-500 text-sm">Δεν υπάρχουν δεδομένα ακόμα.</p>
          ) : (
            <>
              <ul className="divide-y divide-slate-800 lg:hidden">
                {stats.topProducts.map((row, idx) => (
                  <li
                    key={row.partNumber}
                    className="flex items-center justify-between gap-3 px-4 py-3 sm:px-6"
                  >
                    <span className="text-sm font-medium text-slate-400">{idx + 1}</span>
                    <span className="min-w-0 flex-1 font-mono text-sm text-slate-200 truncate">{row.partNumber}</span>
                    <span className="text-sm font-medium text-slate-100">{row.totalQuantity.toLocaleString()} τμχ</span>
                  </li>
                ))}
              </ul>
              <div className="hidden overflow-x-auto lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-6 py-4">#</th>
                      <th className="px-6 py-4">Κωδικός</th>
                      <th className="px-6 py-4 text-right">Συνολική ποσότητα</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.topProducts.map((row, idx) => (
                      <tr
                        key={row.partNumber}
                        className="bg-slate-900/30 transition-colors hover:bg-slate-800/30"
                      >
                        <td className="px-6 py-4 font-medium text-slate-400">{idx + 1}</td>
                        <td className="px-6 py-4 font-mono text-slate-200">{row.partNumber}</td>
                        <td className="px-6 py-4 text-right font-medium text-slate-100">
                          {row.totalQuantity.toLocaleString()} τμχ
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
