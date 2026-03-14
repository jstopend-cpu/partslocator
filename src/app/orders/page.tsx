"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ArrowLeft, Package, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
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
  COMPLETED: "Ολοκληρωμένη",
  CANCELLED: "Ακυρωμένη",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "border-amber-500/50 bg-amber-500/15 text-amber-300",
    CONFIRMED: "border-blue-500/50 bg-blue-500/15 text-blue-300",
    SHIPPED: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
    COMPLETED: "border-slate-500/50 bg-slate-500/15 text-slate-300",
    CANCELLED: "border-red-500/50 bg-red-500/15 text-red-300",
  };
  const style = colors[status] ?? "border-slate-600 bg-slate-700/50 text-slate-400";
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${style}`}
    >
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    getOrders().then((data) => {
      setOrders(data);
      setLoading(false);
    });
  }, []);

  const toggleDetails = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/98 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Πίσω</span>
          </Link>
          <h1 className="text-lg font-semibold sm:text-xl">Οι Παραγγελίες μου</h1>
        </div>
        <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
      </header>

      <main className="mx-auto max-w-4xl space-y-4 p-4 sm:space-y-6 sm:p-6">
        {loading ? (
          <p className="text-slate-500">Φόρτωση...</p>
        ) : orders.length === 0 ? (
          <div className="rounded-xl border border-slate-800 bg-slate-800/50 py-16 text-center">
            <Package className="mx-auto h-12 w-12 text-slate-600" />
            <p className="mt-4 text-slate-400">Δεν υπάρχουν ακόμα παραγγελίες.</p>
            <Link
              href="/"
              className="mt-4 inline-block text-sm text-blue-400 hover:underline"
            >
              Πήγαινε στο Dashboard για αναζήτηση και παραγγελία
            </Link>
          </div>
        ) : (
          <>
            {/* Mobile: cards */}
            <ul className="space-y-4 lg:hidden">
              {orders.map((order) => {
                const isExpanded = expandedId === order.id;
                return (
                  <li
                    key={order.id}
                    className="overflow-hidden rounded-xl border border-slate-700 bg-slate-800/50"
                  >
                    <div className="p-4">
                      <p className="font-mono text-xs text-slate-500">{order.id}</p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDate(order.createdAt)}
                      </p>
                      <div className="mt-2">
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="mt-2 text-lg font-semibold text-slate-100">
                        {formatCurrency(order.totalPrice)}
                      </p>
                      <button
                        type="button"
                        onClick={() => toggleDetails(order.id)}
                        className="mt-3 flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-700"
                      >
                        {isExpanded ? (
                          <>
                            <ChevronDown className="h-4 w-4" />
                            Απόκρυψη λεπτομερειών
                          </>
                        ) : (
                          <>
                            <ExternalLink className="h-4 w-4" />
                            Προβολή λεπτομερειών
                          </>
                        )}
                      </button>
                    </div>
                    {isExpanded && (
                      <div className="border-t border-slate-700 bg-slate-900/50 px-4 pb-4 pt-2">
                        <p className="mb-2 text-xs font-medium uppercase text-slate-500">
                          Στοιχεία παραγγελίας
                        </p>
                        <ul className="space-y-2">
                          {order.items.map((item) => (
                            <li
                              key={item.id}
                              className="flex justify-between gap-2 border-b border-slate-700/80 pb-2 text-sm last:border-0"
                            >
                              <span className="min-w-0 flex-1 truncate font-mono text-xs text-blue-300">
                                {item.partNumber}
                              </span>
                              <span className="text-slate-400">
                                {formatCurrency(item.price * 1.24 * item.quantity)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* Desktop: table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-700 lg:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3">ID / Ημερομηνία</th>
                    <th className="px-4 py-3">Κατάσταση</th>
                    <th className="px-4 py-3 text-right">Σύνολο</th>
                    <th className="w-32 px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const isExpanded = expandedId === order.id;
                    return (
                      <React.Fragment key={order.id}>
                        <tr className="border-b border-slate-700/80 bg-slate-800/30 transition-colors hover:bg-slate-800/50">
                          <td className="px-4 py-3">
                            <p className="font-mono text-xs text-slate-500">{order.id}</p>
                            <p className="text-slate-200">{formatDate(order.createdAt)}</p>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={order.status} />
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-100">
                            {formatCurrency(order.totalPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              type="button"
                              onClick={() => toggleDetails(order.id)}
                              className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-700"
                            >
                              {isExpanded ? "Απόκρυψη" : "Προβολή λεπτομερειών"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className="border-b border-slate-700/80 bg-slate-950/50">
                            <td colSpan={4} className="px-4 pb-4 pt-0">
                              <table className="mt-2 w-full text-xs">
                                <thead>
                                  <tr className="text-left text-[11px] uppercase tracking-wide text-slate-500">
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
                                      <td className="py-2 pr-4 font-mono text-blue-300">
                                        {item.partNumber}
                                      </td>
                                      <td className="max-w-[200px] truncate py-2 pr-4">
                                        {item.description}
                                      </td>
                                      <td className="py-2 pr-4 text-right">
                                        {formatCurrency(item.price * 1.24)}
                                      </td>
                                      <td className="py-2 pr-4 text-right">{item.quantity}</td>
                                      <td className="py-2 text-right text-slate-100">
                                        {formatCurrency(item.price * 1.24 * item.quantity)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
