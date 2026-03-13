"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, Download, Loader2 } from "lucide-react";
import {
  getAllOrdersAdmin,
  updateOrderStatus,
  type AdminOrderRow,
} from "@/app/actions/orders";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Σε αναμονή" },
  { value: "CONFIRMED", label: "Επιβεβαιωμένη" },
  { value: "SHIPPED", label: "Απεστάλη" },
  { value: "COMPLETED", label: "Ολοκληρωμένη" },
  { value: "CANCELLED", label: "Ακυρωμένη" },
] as const;

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
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
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
    if (!isLoaded) return;
    if (userId !== ADMIN_USER_ID) {
      router.replace("/");
      return;
    }
    refresh();
  }, [isLoaded, userId, router, refresh]);

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

  if (!isLoaded || (isLoaded && userId !== ADMIN_USER_ID)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/98 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω
          </Link>
          <h1 className="text-xl font-semibold">Διαχείριση παραγγελιών (Admin)</h1>
        </div>
        <button
          type="button"
          onClick={() => exportToCsv(orders)}
          disabled={orders.length === 0}
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300 transition-colors hover:border-emerald-500/50 hover:text-emerald-300 disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download className="h-4 w-4" />
          Export to CSV
        </button>
      </header>

      <main className="mx-auto max-w-6xl p-6">
        <div className="overflow-hidden rounded-lg border border-slate-800 bg-slate-900/50 shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
            </div>
          ) : orders.length === 0 ? (
            <p className="py-12 text-center text-slate-500">
              Δεν υπάρχουν παραγγελίες.
            </p>
          ) : (
            <div className="overflow-x-auto">
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
                        <div className="font-mono text-xs text-slate-500">
                          {order.id}
                        </div>
                        <div className="mt-0.5 text-slate-200">
                          {formatDate(order.createdAt)}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-300">
                        {order.userId}
                      </td>
                      <td className="px-6 py-4 text-right font-medium text-slate-100">
                        {formatCurrency(order.totalPrice)}
                      </td>
                      <td className="px-6 py-4">
                        {updatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
                        ) : (
                          <select
                            value={order.status}
                            onChange={(e) =>
                              handleStatusChange(order.id, e.target.value)
                            }
                            className="rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-sm text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
          )}
        </div>
      </main>
    </div>
  );
}
