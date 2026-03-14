"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Loader2, ArrowLeft, User, MapPin, Phone } from "lucide-react";
import {
  getSubOrderById,
  updateSubOrderStatus,
  type SubOrderDetailRow,
} from "@/app/actions/supplier-portal";

const STATUS_OPTIONS = [
  { value: "PENDING", label: "Σε αναμονή" },
  { value: "PROCESSING", label: "Σε επεξεργασία" },
  { value: "SHIPPED", label: "Απεστάλη" },
  { value: "COMPLETED", label: "Ολοκληρωμένη" },
];

const STATUS_BADGE: Record<string, string> = {
  PENDING: "border-amber-500/50 bg-amber-500/15 text-amber-300",
  PROCESSING: "border-blue-500/50 bg-blue-500/15 text-blue-300",
  SHIPPED: "border-emerald-500/50 bg-emerald-500/15 text-emerald-300",
  COMPLETED: "border-slate-500/50 bg-slate-500/15 text-slate-300",
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

export default function SupplierOrderDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const [order, setOrder] = useState<SubOrderDetailRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    getSubOrderById(id).then((data) => {
      if (data) setOrder(data);
      else setNotFound(true);
      setLoading(false);
    });
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!id || !order) return;
    setUpdating(true);
    const result = await updateSubOrderStatus(id, newStatus);
    if (result.ok) {
      setOrder((prev) => (prev ? { ...prev, status: newStatus } : null));
    } else {
      alert(result.error);
    }
    setUpdating(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-500">
        <p className="mb-4">Η παραγγελία δεν βρέθηκε ή δεν έχετε δικαίωμα πρόσβασης.</p>
        <Link
          href="/supplier/dashboard"
          className="inline-flex items-center gap-2 text-blue-400 hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Πίσω στο Dashboard
        </Link>
      </div>
    );
  }

  const hasShipping =
    order.shippingName || order.shippingAddress || order.shippingCity || order.shippingPhone;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/supplier/dashboard"
        className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Πίσω στο Dashboard
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-xs text-slate-500">Sub-Order {order.id}</p>
          <p className="text-sm text-slate-400">Master Order: {order.orderId}</p>
          <p className="mt-1 text-slate-500">{formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-semibold text-slate-100">
            {formatCurrency(order.totalPrice)}
          </span>
          <span
            className={`inline-flex rounded-full border px-3 py-1 text-sm font-medium ${
              STATUS_BADGE[order.status] ?? "border-slate-600 bg-slate-700/50 text-slate-400"
            }`}
          >
            {STATUS_OPTIONS.find((o) => o.value === order.status)?.label ?? order.status}
          </span>
        </div>
      </div>

      {/* Shipping info */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-slate-500">
          <User className="h-4 w-4" />
          Shipping info
        </h2>
        {hasShipping ? (
          <ul className="space-y-2 text-sm text-slate-300">
            {order.shippingName && (
              <li className="flex items-center gap-2">
                <User className="h-4 w-4 shrink-0 text-slate-500" />
                {order.shippingName}
              </li>
            )}
            {(order.shippingAddress || order.shippingPostalCode || order.shippingCity) && (
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-500" />
                <span>
                  {[order.shippingAddress, order.shippingPostalCode, order.shippingCity]
                    .filter(Boolean)
                    .join(", ")}
                </span>
              </li>
            )}
            {order.shippingPhone && (
              <li className="flex items-center gap-2">
                <Phone className="h-4 w-4 shrink-0 text-slate-500" />
                {order.shippingPhone}
              </li>
            )}
          </ul>
        ) : (
          <p className="text-sm text-slate-500">Δεν υπάρχουν στοιχεία αποστολής.</p>
        )}
      </section>

      {/* Status updater */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-500">
          Update status
        </h2>
        {updating ? (
          <div className="flex items-center gap-2 text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            Updating…
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handleStatusChange(opt.value)}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  order.status === opt.value
                    ? "border-blue-500 bg-blue-500/20 text-blue-300"
                    : "border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500 hover:bg-slate-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Items */}
      <section className="rounded-xl border border-slate-800 bg-slate-900/50 overflow-hidden">
        <h2 className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200 sm:px-6">
          Items in this sub-order
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50 text-xs font-medium uppercase text-slate-400">
                <th className="px-4 py-2 sm:px-6">Part #</th>
                <th className="px-4 py-2 sm:px-6">Description</th>
                <th className="px-4 py-2 sm:px-6 text-right">Qty</th>
                <th className="px-4 py-2 sm:px-6 text-right">Price</th>
                <th className="px-4 py-2 sm:px-6 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/80">
                  <td className="px-4 py-2 font-mono text-blue-300 sm:px-6">
                    {item.partNumber}
                  </td>
                  <td className="px-4 py-2 text-slate-300 sm:px-6">{item.description}</td>
                  <td className="px-4 py-2 text-right text-slate-300 sm:px-6">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-300 sm:px-6">
                    {formatCurrency(item.price)}
                  </td>
                  <td className="px-4 py-2 text-right font-medium text-slate-200 sm:px-6">
                    {formatCurrency(item.price * item.quantity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
