"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Package, ChevronDown, ChevronRight } from "lucide-react";
import { getOrders, type OrderRow } from "@/app/actions/orders";

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

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Σε αναμονή",
  CONFIRMED: "Επιβεβαιωμένη",
  SHIPPED: "Απεστάλη",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const toggleOrder = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-950/98 px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω στο Dashboard
          </Link>
          <h1 className="text-xl font-semibold">Ιστορικό παραγγελιών</h1>
        </div>
        <UserButton
          appearance={{
            elements: { avatarBox: "h-9 w-9" },
          }}
        />
      </header>

      <main className="mx-auto max-w-4xl p-6">
        {loading ? (
          <p className="text-slate-500">Φόρτωση...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-12 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">Δεν υπάρχουν ακόμα παραγγελίες.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-blue-400 hover:underline"
            >
              Πήγαινε στο Dashboard για να κάνεις αναζήτηση και παραγγελία
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {orders.map((order) => {
              const isExpanded = !!expanded[order.id];
              return (
                <li
                  key={order.id}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90"
                >
                  <button
                    type="button"
                    onClick={() => toggleOrder(order.id)}
                    className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-slate-800/50"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-5 w-5 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 shrink-0 text-slate-500" />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-mono text-xs text-slate-500">
                          {order.id}
                        </p>
                        <p className="text-sm text-slate-300">
                          {formatDate(order.createdAt)} ·{" "}
                          {STATUS_LABELS[order.status] ?? order.status}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-lg font-semibold text-white">
                      {formatCurrency(order.totalPrice)}
                    </span>
                  </button>
                  {isExpanded && (
                    <div className="border-t border-slate-800 bg-slate-950/50 px-5 pb-4 pt-2">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                            <th className="py-2 pr-4">Κωδικός</th>
                            <th className="py-2 pr-4">Περιγραφή</th>
                            <th className="py-2 pr-4 text-right">Τιμή</th>
                            <th className="py-2 pr-4 text-right">Ποσ.</th>
                            <th className="py-2 text-right">Σύνολο</th>
                          </tr>
                        </thead>
                        <tbody>
                          {order.items.map((item) => (
                            <tr
                              key={item.id}
                              className="border-t border-slate-800/80 text-slate-300"
                            >
                              <td className="py-2 pr-4 font-mono text-xs text-blue-300">
                                {item.partNumber}
                              </td>
                              <td className="py-2 pr-4 truncate max-w-[200px]">
                                {item.description}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {formatCurrency(item.price * 1.24)}
                              </td>
                              <td className="py-2 pr-4 text-right">
                                {item.quantity}
                              </td>
                              <td className="py-2 text-right text-slate-100">
                                {formatCurrency(item.price * 1.24 * item.quantity)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
