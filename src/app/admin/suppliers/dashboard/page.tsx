"use client";

import React, { useState, useEffect } from "react";
import {
  Truck,
  BarChart3,
  AlertCircle,
  Loader2,
  Package,
  TrendingDown,
  Calendar,
  Percent,
} from "lucide-react";
import { getSupplierStats, type SupplierStats, type SupplierRow } from "@/app/actions/suppliers";

function formatDate(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function priceHealthColor(pct: number): string {
  if (pct >= 70) return "bg-emerald-500";
  if (pct >= 40) return "bg-amber-500";
  return "bg-red-500/80";
}

export default function SuppliersDashboardPage() {
  const [data, setData] = useState<SupplierStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSupplierStats().then((d) => {
      setData(d ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-amber-300">
        Δεν έχετε δικαιώματα ή δεν βρέθηκαν δεδομένα.
      </div>
    );
  }

  const { totalSuppliers, totalSkus, globalPriceGapPct, suppliers } = data;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-semibold sm:text-xl">Προμηθευτές (Suppliers)</h1>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 p-4 sm:p-6">
        {/* Cards */}
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-blue-500/40 bg-blue-500/20 text-blue-400">
              <Truck className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Σύνολο προμηθευτών
              </p>
              <p className="text-2xl font-semibold text-white">{totalSuppliers}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-violet-500/40 bg-violet-500/20 text-violet-400">
              <Package className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                SKUs σε απόθεμα
              </p>
              <p className="text-2xl font-semibold text-white">
                {totalSkus.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20 text-amber-400">
              <BarChart3 className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                Global Price Gap
              </p>
              <p className="text-2xl font-semibold text-white">
                {globalPriceGapPct != null ? (
                  <>
                    <TrendingDown className="mr-1 inline h-5 w-5 text-slate-400" />
                    {globalPriceGapPct >= 0 ? "+" : ""}
                    {globalPriceGapPct.toFixed(1)}%
                  </>
                ) : (
                  "—"
                )}
              </p>
              <p className="text-xs text-slate-500">
                Μέσο % διαφορά τιμής προμηθευτή vs MSRP
              </p>
            </div>
          </div>
        </section>

        {/* Supplier Table */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50">
          <h2 className="border-b border-slate-800 px-4 py-3 text-base font-semibold text-slate-200 sm:px-6">
            Λίστα προμηθευτών
          </h2>

          {suppliers.length === 0 ? (
            <div className="flex items-center gap-2 px-4 py-8 text-slate-500 sm:px-6">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>Δεν υπάρχουν προμηθευτές με απόθεμα.</span>
            </div>
          ) : (
            <>
              {/* Desktop table */}
              <div className="overflow-x-auto">
                <table className="hidden w-full text-sm lg:table">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/50 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3 sm:px-6">Προμηθευτής</th>
                      <th className="px-4 py-3 sm:px-6 text-right">Items</th>
                      <th className="px-4 py-3 sm:px-6">Freshness</th>
                      <th className="px-4 py-3 sm:px-6 text-right">Price Advantage</th>
                      <th className="w-32 px-4 py-3 sm:px-6">Price Health</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {suppliers.map((row) => (
                      <SupplierTableRow key={row.id} row={row} />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <ul className="space-y-4 p-4 lg:hidden sm:p-6">
                {suppliers.map((row) => (
                  <SupplierCard key={row.id} row={row} />
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </>
  );
}

function SupplierTableRow({ row }: { row: SupplierRow }) {
  const healthPct = Math.round(row.priceHealthPct);
  return (
    <tr className="bg-slate-900/30 transition-colors hover:bg-slate-800/30">
      <td className="px-4 py-3 font-medium text-slate-200 sm:px-6">{row.name}</td>
      <td className="px-4 py-3 text-right text-slate-300 sm:px-6">
        {row.itemsCount.toLocaleString()}
      </td>
      <td className="px-4 py-3 text-slate-400 sm:px-6">
        <span className="inline-flex items-center gap-1.5">
          <Calendar className="h-4 w-4 text-slate-500" />
          {formatDate(row.lastUsed)}
        </span>
      </td>
      <td className="px-4 py-3 text-right text-slate-300 sm:px-6">
        <span className="inline-flex items-center gap-1">
          <Percent className="h-4 w-4 text-slate-500" />
          {row.priceAdvantagePct.toFixed(1)}%
        </span>
      </td>
      <td className="px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${priceHealthColor(healthPct)}`}
              style={{ width: `${Math.min(100, healthPct)}%` }}
            />
          </div>
          <span className="w-10 shrink-0 text-right text-xs text-slate-500">
            {healthPct}%
          </span>
        </div>
      </td>
    </tr>
  );
}

function SupplierCard({ row }: { row: SupplierRow }) {
  const healthPct = Math.round(row.priceHealthPct);
  return (
    <li className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
      <p className="font-medium text-slate-200">{row.name}</p>
      <dl className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <dt className="text-slate-500">Items</dt>
          <dd className="font-medium text-slate-300">{row.itemsCount.toLocaleString()}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Freshness</dt>
          <dd className="text-slate-300">{formatDate(row.lastUsed)}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Price Advantage</dt>
          <dd className="font-medium text-slate-300">{row.priceAdvantagePct.toFixed(1)}%</dd>
        </div>
      </dl>
      <div className="mt-3">
        <p className="mb-1 text-xs text-slate-500">Price Health</p>
        <div className="flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full rounded-full transition-all ${priceHealthColor(healthPct)}`}
              style={{ width: `${Math.min(100, healthPct)}%` }}
            />
          </div>
          <span className="text-sm font-medium text-slate-400">{healthPct}%</span>
        </div>
      </div>
    </li>
  );
}
