"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, X, Minus, Plus, Package } from "lucide-react";
import {
  getCart,
  removeFromCart,
  updateCartQuantity,
  type CartItemRow,
} from "@/app/actions/cart";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

export default function CartPage() {
  const [cart, setCart] = useState<CartItemRow[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshCart = useCallback(() => getCart().then(setCart), []);

  useEffect(() => {
    refreshCart().finally(() => setLoading(false));
  }, [refreshCart]);

  const updateQuantity = async (itemId: string, delta: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    if (newQty < 1) {
      const ok = await removeFromCart(itemId);
      if (ok) await refreshCart();
    } else {
      const ok = await updateCartQuantity(itemId, newQty);
      if (ok) await refreshCart();
    }
  };

  const removeItem = async (itemId: string) => {
    const ok = await removeFromCart(itemId);
    if (ok) await refreshCart();
  };

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const vat = subtotal * 0.24;
  const totalWithVat = subtotal + vat;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        <span>Φόρτωση καλαθιού...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/98 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Πίσω</span>
        </Link>
        <h1 className="text-lg font-semibold sm:text-xl">Καλάθι</h1>
        <div className="w-20 shrink-0 sm:w-24" aria-hidden />
      </header>

      <main className="mx-auto max-w-6xl space-y-4 p-4 pb-32 sm:space-y-6 sm:p-6 sm:pb-6 lg:flex lg:gap-6 lg:space-y-0 lg:pb-6">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-slate-800 bg-slate-800/50 py-16 text-center">
            <ShoppingCart className="h-14 w-14 text-slate-600" />
            <p className="mt-4 text-slate-400">Το καλάθι είναι άδειο.</p>
            <Link
              href="/"
              className="mt-4 inline-block rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Αναζήτηση ανταλλακτικών
            </Link>
          </div>
        ) : (
          <>
            {/* Cart items: list on mobile, table on desktop */}
            <section className="min-w-0 flex-1 space-y-4 lg:space-y-4" aria-label="Προϊόντα στο καλάθι">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Προϊόντα ({itemCount})
              </h2>

              {/* Mobile: list of cards */}
              <ul className="space-y-4 lg:hidden">
                {cart.map((item) => (
                  <li
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
                  >
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-slate-700 bg-slate-800 text-slate-500">
                      <Package className="h-6 w-6" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs text-blue-300">{item.partNumber}</p>
                      <p className="mt-0.5 line-clamp-2 text-sm font-medium text-slate-200">
                        {item.description}
                      </p>
                      <p className="mt-1 text-sm text-slate-400">
                        {formatCurrency(item.price * 1.24)} × {item.quantity}
                      </p>
                      <p className="mt-0.5 text-sm font-medium text-slate-100">
                        {formatCurrency(item.price * 1.24 * item.quantity)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="rounded p-2 text-slate-500 hover:bg-slate-700 hover:text-red-400"
                        aria-label="Αφαίρεση"
                      >
                        <X className="h-5 w-5" />
                      </button>
                      <div className="flex items-center gap-0 rounded-lg border border-slate-600 bg-slate-800">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, -1)}
                          className="flex h-11 w-11 items-center justify-center rounded-l-lg text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
                          aria-label="Μείωση ποσότητας"
                        >
                          <Minus className="h-5 w-5" />
                        </button>
                        <span className="w-10 text-center text-sm font-medium text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, 1)}
                          className="flex h-11 w-11 items-center justify-center rounded-r-lg text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-100"
                          aria-label="Αύξηση ποσότητας"
                        >
                          <Plus className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              {/* Desktop: table */}
              <div className="hidden overflow-hidden rounded-xl border border-slate-700 lg:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 bg-slate-800/80 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">Προϊόν</th>
                      <th className="px-4 py-3">Τιμή</th>
                      <th className="px-4 py-3">Ποσότητα</th>
                      <th className="px-4 py-3 text-right">Σύνολο</th>
                      <th className="w-12 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item) => (
                      <tr
                        key={item.id}
                        className="border-b border-slate-700/80 bg-slate-800/30 transition-colors hover:bg-slate-800/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-mono text-xs text-blue-300">{item.partNumber}</p>
                          <p className="text-slate-200">{item.description}</p>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {formatCurrency(item.price * 1.24)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, -1)}
                              className="flex h-9 w-9 items-center justify-center rounded border border-slate-600 text-slate-400 hover:bg-slate-700"
                              aria-label="Μείωση"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="w-8 text-center text-slate-200">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(item.id, 1)}
                              className="flex h-9 w-9 items-center justify-center rounded border border-slate-600 text-slate-400 hover:bg-slate-700"
                              aria-label="Αύξηση"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-200">
                          {formatCurrency(item.price * 1.24 * item.quantity)}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => removeItem(item.id)}
                            className="rounded p-1.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                            aria-label="Αφαίρεση"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Order Summary - prominent card on mobile (after list); sidebar on desktop */}
            <section
              className="lg:w-80 lg:shrink-0 rounded-xl border border-slate-700 bg-slate-800/50 p-4"
              aria-label="Σύνοψη παραγγελίας"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                Σύνοψη παραγγελίας
              </h2>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-400">Υποσύνολο (χωρίς ΦΠΑ)</dt>
                  <dd className="text-slate-200">{formatCurrency(subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">ΦΠΑ 24%</dt>
                  <dd className="text-slate-200">{formatCurrency(vat)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-400">Μεταφορικά</dt>
                  <dd className="text-slate-500">—</dd>
                </div>
                <div className="flex justify-between border-t border-slate-700 pt-2">
                  <dt className="font-medium text-slate-200">Σύνολο</dt>
                  <dd className="text-lg font-semibold text-slate-100">
                    {formatCurrency(totalWithVat)}
                  </dd>
                </div>
              </dl>
              <Link
                href="/checkout"
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
              >
                Συνέχεια στο Checkout
              </Link>
            </section>
          </>
        )}
      </main>

      {/* Sticky bottom bar on mobile: Order Summary + Checkout when cart has items */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-900/98 p-4 lg:hidden">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
            <div>
              <p className="text-xs text-slate-500">Σύνολο (με ΦΠΑ)</p>
              <p className="text-lg font-semibold text-slate-100">
                {formatCurrency(totalWithVat)}
              </p>
            </div>
            <Link
              href="/checkout"
              className="shrink-0 rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              Checkout
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
