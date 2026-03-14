"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCart } from "@/app/actions/cart";
import { createOrder } from "@/app/actions/orders";

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const INPUT_HEIGHT = "h-12 sm:h-14";

export default function CheckoutPage() {
  const router = useRouter();
  const [cart, setCart] = useState<Awaited<ReturnType<typeof getCart>>>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    shippingName: "",
    shippingAddress: "",
    shippingCity: "",
    shippingPostalCode: "",
    shippingPhone: "",
    billingSame: true,
    billingName: "",
    billingAddress: "",
    billingCity: "",
    billingPostalCode: "",
  });

  useEffect(() => {
    getCart().then((data) => {
      setCart(data);
      setLoading(false);
    });
  }, []);

  const updateForm = (key: string, value: string | boolean) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const totalWithVat = cart.reduce(
    (sum, i) => sum + i.price * 1.24 * i.quantity,
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      const result = await createOrder();
      if (result.ok) {
        router.push("/dashboard/orders?placed=1");
      } else {
        alert(result.error ?? "Αποτυχία υποβολής.");
      }
    } catch (err) {
      console.error(err);
      alert("Αποτυχία υποβολής παραγγελίας.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 text-slate-400">
        <span>Φόρτωση...</span>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 p-4 text-slate-400">
        <p>Το καλάθι είναι άδειο.</p>
        <Link
          href="/cart"
          className="mt-4 text-blue-400 hover:underline"
        >
          Πήγαινε στο καλάθι
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800 bg-slate-900/98 px-4 py-3 sm:px-6">
        <Link
          href="/cart"
          className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Πίσω στο καλάθι</span>
        </Link>
        <h1 className="text-lg font-semibold sm:text-xl">Checkout</h1>
        <div className="w-20 shrink-0 sm:w-24" aria-hidden />
      </header>

      <form
        id="checkout-form"
        onSubmit={handleSubmit}
        className="mx-auto max-w-4xl space-y-4 p-4 pb-28 sm:space-y-6 sm:p-6 sm:pb-6"
      >
        {/* Shipping & Billing: single column mobile, two columns desktop */}
        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-800/30 p-4 sm:p-6">
          <h2 className="text-base font-semibold text-slate-200">
            Διεύθυνση αποστολής
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="space-y-1.5 md:col-span-2">
              <span className="block text-xs font-medium text-slate-500">Ονοματεπώνυμο</span>
              <input
                type="text"
                value={form.shippingName}
                onChange={(e) => updateForm("shippingName", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-blue-500 ${INPUT_HEIGHT}`}
                placeholder="Όνομα και επώνυμο"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="block text-xs font-medium text-slate-500">Διεύθυνση</span>
              <input
                type="text"
                value={form.shippingAddress}
                onChange={(e) => updateForm("shippingAddress", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                placeholder="Οδός, αριθμός"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-500">Πόλη</span>
              <input
                type="text"
                value={form.shippingCity}
                onChange={(e) => updateForm("shippingCity", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                placeholder="Πόλη"
              />
            </label>
            <label className="space-y-1.5">
              <span className="block text-xs font-medium text-slate-500">Ταχ. κώδικας</span>
              <input
                type="text"
                value={form.shippingPostalCode}
                onChange={(e) => updateForm("shippingPostalCode", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                placeholder="ΤΚ"
              />
            </label>
            <label className="space-y-1.5 md:col-span-2">
              <span className="block text-xs font-medium text-slate-500">Τηλέφωνο</span>
              <input
                type="tel"
                value={form.shippingPhone}
                onChange={(e) => updateForm("shippingPhone", e.target.value)}
                className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                placeholder="Τηλέφωνο επικοινωνίας"
              />
            </label>
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-800/30 p-4 sm:p-6">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={form.billingSame}
              onChange={(e) => updateForm("billingSame", e.target.checked)}
              className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-blue-500"
            />
            <span className="text-sm text-slate-300">Η διεύθυνση χρέωσης είναι ίδια</span>
          </label>
          {!form.billingSame && (
            <div className="grid grid-cols-1 gap-4 pt-2 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="block text-xs font-medium text-slate-500">Ονοματεπώνυμο (χρέωση)</span>
                <input
                  type="text"
                  value={form.billingName}
                  onChange={(e) => updateForm("billingName", e.target.value)}
                  className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                  placeholder="Όνομα και επώνυμο"
                />
              </label>
              <label className="space-y-1.5 md:col-span-2">
                <span className="block text-xs font-medium text-slate-500">Διεύθυνση (χρέωση)</span>
                <input
                  type="text"
                  value={form.billingAddress}
                  onChange={(e) => updateForm("billingAddress", e.target.value)}
                  className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                  placeholder="Οδός, αριθμός"
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-medium text-slate-500">Πόλη</span>
                <input
                  type="text"
                  value={form.billingCity}
                  onChange={(e) => updateForm("billingCity", e.target.value)}
                  className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                  placeholder="Πόλη"
                />
              </label>
              <label className="space-y-1.5">
                <span className="block text-xs font-medium text-slate-500">Ταχ. κώδικας</span>
                <input
                  type="text"
                  value={form.billingPostalCode}
                  onChange={(e) => updateForm("billingPostalCode", e.target.value)}
                  className={`w-full rounded-lg border border-slate-700 bg-slate-800 px-4 text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500 ${INPUT_HEIGHT}`}
                  placeholder="ΤΚ"
                />
              </label>
            </div>
          )}
        </section>

        {/* Order total summary */}
        <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-4">
          <p className="flex justify-between text-sm">
            <span className="text-slate-400">Σύνολο παραγγελίας (με ΦΠΑ)</span>
            <span className="font-semibold text-slate-100">{formatCurrency(totalWithVat)}</span>
          </p>
        </div>

        {/* Place Order - prominent on desktop; on mobile the fixed bar below is used */}
        <div className="hidden lg:block lg:pt-4">
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-blue-600 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
          >
            {submitting ? "Υποβολή..." : "Ολοκλήρωση παραγγελίας"}
          </button>
        </div>
      </form>

      {/* Fixed bottom bar on mobile: Place Order */}
      <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-slate-800 bg-slate-900/98 p-4 lg:hidden">
        <button
          type="submit"
          form="checkout-form"
          disabled={submitting}
          className="flex w-full items-center justify-center rounded-lg bg-blue-600 py-4 text-base font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
        >
          {submitting ? "Υποβολή..." : `Ολοκλήρωση · ${formatCurrency(totalWithVat)}`}
        </button>
      </div>
    </div>
  );
}
