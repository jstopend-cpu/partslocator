"use client";

import React from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  Search,
  Plus,
  Hash,
  Building2,
  ClipboardList,
} from "lucide-react";

// Απλά SVG badges για τις μάρκες (placeholder style – όχι επίσημα λογότυπα)
const BrandBadge = ({ brand }: { brand: string }) => {
  const colors: Record<string, string> = {
    Toyota: "bg-red-600/20 text-red-400 border-red-500/30",
    Audi: "bg-slate-700/50 text-slate-300 border-slate-500/30",
    BMW: "bg-blue-600/20 text-blue-400 border-blue-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${colors[brand] ?? "bg-slate-700/50 text-slate-400 border-slate-600/50"}`}
    >
      {brand}
    </span>
  );
};

const MOCK_PARTS = [
  { sku: "PL-TOY-001", name: "Φίλτρο λαδιού", brand: "Toyota", price: "24,50 €", stock: 156 },
  { sku: "PL-AUD-002", name: "Τακάκια μπροστά", brand: "Audi", price: "189,00 €", stock: 0 },
  { sku: "PL-BMW-003", name: "Φίλτρο καμπίνας", brand: "BMW", price: "32,90 €", stock: 42 },
  { sku: "PL-TOY-004", name: "Σετ μπουζί", brand: "Toyota", price: "12,80 €", stock: 89 },
  { sku: "PL-AUD-005", name: "Δίσκοι πίσω", brand: "Audi", price: "145,00 €", stock: 8 },
  { sku: "PL-BMW-006", name: "Ψυκτικό υγρό", brand: "BMW", price: "28,40 €", stock: 0 },
];

const STATS = [
  { label: "Συνολικά Ανταλλακτικά", value: "1.248", icon: Hash },
  { label: "Συνδεδεμένοι Προμηθευτές", value: "12", icon: Building2 },
  { label: "Εκκρεμείς Παραγγελίες", value: "7", icon: ClipboardList },
];

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Inventory", icon: Package, active: false },
  { label: "Suppliers", icon: Truck, active: false, brands: ["Toyota", "Audi", "BMW"] },
  { label: "Settings", icon: Settings, active: false },
];

export default function PartsLocatorDashboard() {
  return (
    <div className="flex h-screen w-full min-h-0 overflow-hidden bg-slate-950 text-slate-100 font-[family-name:var(--font-dm-sans),system-ui,sans-serif]">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95">
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-xl font-semibold tracking-tight text-white">Parts Locator</h1>
          <p className="mt-0.5 text-xs text-slate-500">B2B Dashboard</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = item.active;
            return (
              <div key={item.label}>
                <a
                  href="#"
                  className={
                    isActive
                      ? "flex items-center gap-3 rounded-lg border border-blue-500/30 bg-blue-500/15 px-3 py-2.5 text-blue-400 transition-colors"
                      : "flex items-center gap-3 rounded-lg px-3 py-2.5 text-slate-400 transition-colors hover:bg-slate-800/80 hover:text-slate-200"
                  }
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span>{item.label}</span>
                </a>
                {item.label === "Suppliers" && item.brands && (
                  <div className="ml-8 mt-2 flex flex-wrap gap-1.5">
                    {item.brands.map((b) => (
                      <BrandBadge key={b} brand={b} />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="flex shrink-0 items-center gap-4 border-b border-slate-800 bg-slate-950/98 px-6 py-4">
          <div className="relative flex-1 max-w-md">
            <Search
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
              aria-hidden
            />
            <input
              type="search"
              placeholder="Αναζήτηση ανταλλακτικών, SKU..."
              aria-label="Αναζήτηση"
              className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 font-medium text-white transition-colors hover:bg-blue-500"
          >
            <Plus className="h-5 w-5" aria-hidden />
            Add New Part
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          {/* Stats */}
          <div className="mb-8 grid gap-4 sm:grid-cols-3">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="rounded-xl border border-slate-800 bg-slate-900/90 p-6 transition-colors hover:border-blue-500/40"
                >
                  <p className="mb-2 text-sm font-medium text-slate-500">{stat.label}</p>
                  <div className="flex items-center gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-lg border border-blue-500/25 bg-blue-500/15 text-blue-400">
                      <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="text-2xl font-semibold tabular-nums text-white sm:text-3xl">
                      {stat.value}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90">
            <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Ανταλλακτικά</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Επισκόπηση αποθέματος – Toyota, Audi, BMW
                </p>
              </div>
              <span className="text-xs text-slate-500">{MOCK_PARTS.length} εγγραφές</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/50">
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      SKU
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Όνομα Ανταλλακτικού
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Μάρκα
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Τιμή
                    </th>
                    <th className="whitespace-nowrap px-6 py-4 text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Απόθεμα
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_PARTS.map((part) => (
                    <tr
                      key={part.sku}
                      className="border-b border-slate-800/80 transition-colors hover:bg-slate-800/30 last:border-b-0"
                    >
                      <td className="whitespace-nowrap px-6 py-4 font-mono text-sm text-blue-400">
                        {part.sku}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-white">
                        {part.name}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <BrandBadge brand={part.brand} />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-slate-300">{part.price}</td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={
                            part.stock > 0
                              ? "inline-flex items-center rounded-full border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-400"
                              : "inline-flex items-center rounded-full border border-red-500/30 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-400"
                          }
                        >
                          {part.stock > 0 ? part.stock : "Μη διαθέσιμο"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
