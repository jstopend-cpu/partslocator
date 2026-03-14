"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Download, Loader2 } from "lucide-react";
import {
  getAllOrdersAdmin,
  updateOrderStatus,
  type AdminOrderRow,
} from "@/app/actions/orders";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Σε αναμονή" },
  { value: "CONFIRMED", label: "Επιβεβαιωμένη" },
  { value: "SHIPPED", label: "Απεστάλη" },
  { value: "COMPLETED", label: "Ολοκληρωμένη" },
  { value: "CANCELLED", label: "Ακυρωμένη" },
] as const;

const STATUS_BADGE_CLASS: Record<string, string> = {
  PENDING: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  CONFIRMED: "border-blue-500/50 bg-blue-500/15 text-blue-300",
  SHIPPED: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  COMPLETED: "border-slate-500/50 bg-slate-500/15 text-slate-300",
  CANCELLED: "border-red-500/50 bg-red-500/15 text-red-300",
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const formatDate = (d: Date) =>
  new Date(d).toLocaleString("el-GR", {
    dateStyle: "medium",
    timeStyle: "short",
  });

function exportToCsv(orders: AdminOrderRow[]) {
  const headers = [
    "Order ID",
    "Date",
    "Customer ID",
    "Total Price (€)",
    "Status",
  ];
  const rows = orders.map((o) => [
    o.id,
    formatDate(o.createdAt),
    o.userId,
    o.totalPrice.toFixed(2),
    o.status,
  ]);
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")),
  ].join("\n");
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const refresh = useCallback(() => {
    return getAllOrdersAdmin().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    const result = await updateOrderStatus(orderId, newStatus);
    setUpdatingId(null);
    if (!result.ok) {
      alert(result.error ?? "Αποτυχία ενημέρωσης.");
      return;
    }
    await refresh();
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-semibold sm:text-xl">Διαχείριση παραγγελιών</h1>
        <button
          type="button"
          onClick={() => exportToCsv(orders)}
          disabled={orders.length === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
          </div>
        ) : orders.length === 0 ? (
          <p className="py-12 text-center text-slate-500">Δεν υπάρχουν παραγγελίες.</p>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="space-y-4 lg:hidden">
              {orders.map((order) => (
                <li
                  key={order.id}
                  className="rounded-xl border border-slate-700 bg-slate-800/50 p-4 shadow-sm"
                >
                  <p className="font-mono text-xs text-slate-500 truncate">{order.id}</p>
                  <p className="mt-1 text-sm text-slate-300">{formatDate(order.createdAt)}</p>
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
                        STATUS_BADGE_CLASS[order.status] ?? "border-slate-600 bg-slate-700/50 text-slate-400"
                      }`}
                    >
                      {STATUS_OPTIONS.find((o) => o.value === order.status)?.label ?? order.status}
                    </span>
                    <span className="text-lg font-semibold text-slate-100">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500 truncate">Customer: {order.userId}</p>
                  <div className="mt-4">
                    {updatingId === order.id ? (
                      <div className="flex h-12 items-center justify-center rounded-lg border border-slate-600 bg-slate-800">
                        <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
                      </div>
                    ) : (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        className="h-12 w-full min-h-[48px] rounded-lg border border-slate-700 bg-slate-800 px-4 text-base text-slate-100 outline-none focus:border-blue-500"
                      >
                        {STATUS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 shadow-sm lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-6 py-4">Order ID & Date</th>
                    <th className="px-6 py-4">Customer ID</th>
                    <th className="px-6 py-4 text-right">Total Price</th>
                    <th className="px-6 py-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {orders.map((order) => (
                    <tr
                      key={order.id}
                      className="bg-slate-900/30 transition-colors hover:bg-slate-800/30"
                    >
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-500">{order.id}</div>
                        <div className="mt-0.5 text-slate-200">{formatDate(order.createdAt)}</div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">{order.userId}</td>
                      <td className="px-6 py-4 text-right font-medium text-slate-100">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        {updatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:border-blue-500"
                          >
                            {STATUS_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </>
  );
}
