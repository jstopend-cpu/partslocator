"use client";

import React from "react";
import { Sparkles, Check, Lock } from "lucide-react";

type UpgradeToProProps = {
  /** Optional: show inline (e.g. next to a blurred field) instead of as a card */
  variant?: "card" | "inline";
  /** Short reason to show in inline mode */
  reason?: string;
  className?: string;
  /** Optional: when user clicks Upgrade (e.g. open pricing modal) */
  onUpgradeClick?: () => void;
};

const PRO_FEATURES = [
  "Ακριβείς τιμές προμηθευτών & ποσότητες",
  "Ονόματα προμηθευτών & λεπτομέρειες καλύτερης προσφοράς",
  "Εκτιμήσεις χρόνου παράδοσης",
  "Ειδικές εκπτωτικές τιμές",
];

export function UpgradeToPro({ variant = "card", reason, className = "", onUpgradeClick }: UpgradeToProProps) {
  const handleClick = (e: React.MouseEvent) => {
    if (onUpgradeClick) {
      e.preventDefault();
      onUpgradeClick();
    }
  };

  if (variant === "inline") {
    return (
      <div
        className={`inline-flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-200 ${className}`}
      >
        <Lock className="h-4 w-4 shrink-0 text-amber-400" />
        <span>{reason ?? "PRO feature"}</span>
        <button
          type="button"
          onClick={handleClick}
          className="ml-1 font-medium text-amber-300 underline decoration-amber-400/60 hover:text-amber-200"
        >
          Upgrade to PRO
        </button>
      </div>
    );
  }

  return (
    <div
      id="upgrade-pro"
      className={`rounded-xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-slate-900/80 p-6 shadow-lg ${className}`}
    >
      <div className="flex items-center gap-3 text-amber-300">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-amber-500/40 bg-amber-500/20">
          <Sparkles className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-slate-100">Αναβάθμιση σε PRO</h3>
          <p className="text-sm text-slate-400">
            Ξεκλειδώστε ακριβείς τιμές, διαθεσιμότητες, ονόματα προμηθευτών και εκτιμήσεις αποστολής.
          </p>
        </div>
      </div>
      <ul className="mt-4 space-y-2">
        {PRO_FEATURES.map((feature) => (
          <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
            <Check className="h-4 w-4 shrink-0 text-emerald-400" />
            {feature}
          </li>
        ))}
      </ul>
      <button
        type="button"
        onClick={handleClick}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/20 py-2.5 text-sm font-medium text-amber-200 shadow-[0_0_15px_rgba(251,191,36,0.4)] transition-colors hover:bg-amber-500/30 hover:shadow-[0_0_20px_rgba(251,191,36,0.5)]"
      >
        Αναβάθμιση σε PRO
      </button>
    </div>
  );
}
