"use client";

import React from "react";
import { X, Check, Lock } from "lucide-react";

type PricingTableModalProps = {
  open: boolean;
  onClose: () => void;
};

const ROWS = [
  { feature: "Supplier name", free: "Hidden", pro: "Full access" },
  { feature: "Stock quantity", free: "Available", pro: "Exact stock" },
  { feature: "Purchase / discounted price", free: "Connect for price", pro: "Full access" },
  { feature: "Best price & supplier", free: "—", pro: "Yes" },
  { feature: "Shipping estimates", free: "—", pro: "Yes" },
];

export function PricingTableModal({ open, onClose }: PricingTableModalProps) {
  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm"
        aria-hidden
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pricing-table-title"
        className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
      >
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <h2 id="pricing-table-title" className="text-lg font-semibold text-slate-100">
            Pricing & features
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/50">
                <th className="px-4 py-2 font-medium text-slate-400">Feature</th>
                <th className="px-4 py-2 font-medium text-slate-400">FREE</th>
                <th className="px-4 py-2 font-medium text-amber-300">PRO</th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.feature} className="border-b border-slate-800/80">
                  <td className="px-4 py-2 text-slate-200">{row.feature}</td>
                  <td className="px-4 py-2 text-slate-500">{row.free}</td>
                  <td className="px-4 py-2 text-emerald-300">
                    <span className="inline-flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      {row.pro}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-800 p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/20 py-2.5 text-sm font-medium text-amber-200 transition-colors hover:bg-amber-500/30"
          >
            <Lock className="h-4 w-4" />
            Upgrade to PRO
          </button>
        </div>
      </div>
    </>
  );
}
