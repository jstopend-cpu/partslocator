"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { useAuth, UserButton } from "@clerk/nextjs";
import {
  getCart,
  addToCart as addToCartAction,
  removeFromCart as removeFromCartAction,
  updateCartQuantity as updateCartQuantityAction,
  type CartItemRow,
} from "@/app/actions/cart";
import { createOrder as createOrderAction } from "@/app/actions/orders";
import {
  LayoutDashboard,
  Search,
  ChevronDown,
  X,
  Loader2,
  ShoppingCart,
  Package,
  ShieldCheck,
} from "lucide-react";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

type SupplierDTO = {
  id: string;
  name: string;
  location: string | null;
};

type SupplierStockDTO = {
  id: string;
  supplierPrice: number;
  quantity: number;
  updatedAt: string;
  supplier: SupplierDTO;
};

type MasterProductDTO = {
  id: string;
  partNumber: string;
  name: string;
  brand: string;
  officialMsrp: number;
  updatedAt: string;
  stocks: SupplierStockDTO[];
};


const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/", active: true },
  { label: "Παραγγελίες", icon: Package, href: "/dashboard/orders", active: false },
];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);

const MIN_SEARCH_LENGTH = 3;
const SEARCH_LIMIT = 100;

export default function MarketplaceDashboard() {
  const { userId } = useAuth();
  const [products, setProducts] = useState<MasterProductDTO[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [cart, setCart] = useState<CartItemRow[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartLoading, setCartLoading] = useState(false);

  const refreshCart = useCallback(() => {
    return getCart().then(setCart);
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const handleSearch = useCallback(async () => {
    const query = searchTerm.trim();
    if (query.length < MIN_SEARCH_LENGTH) return;
    try {
      setIsLoading(true);
      setError(null);
      const params = new URLSearchParams({ q: query, limit: String(SEARCH_LIMIT) });
      const res = await fetch(`/api/master-products?${params}`, { cache: "no-store" });
      if (!res.ok) {
        throw new Error(`Αποτυχία φόρτωσης (${res.status})`);
      }
      const data = (await res.json()) as MasterProductDTO[] | { error?: string };
      if (!Array.isArray(data)) {
        throw new Error((data as { error?: string }).error || "Μη έγκυρη απάντηση.");
      }
      setProducts(data);
      setHasSearched(true);
    } catch (e) {
      console.error(e);
      setError("Δεν ήταν δυνατή η φόρτωση του τιμοκαταλόγου.");
      setProducts([]);
      setHasSearched(true);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const addToCart = async (product: MasterProductDTO) => {
    const msrp = product.officialMsrp ?? 0;
    if (msrp == null || msrp === 0) return;
    setCartLoading(true);
    const result = await addToCartAction({
      masterProductId: product.id,
      partNumber: product.partNumber,
      price: msrp,
      brand: product.brand,
      description: product.name,
    });
    setCartLoading(false);
    if (!result.ok) {
      alert(result.error ?? "Αποτυχία προσθήκης στο καλάθι.");
      return;
    }
    await refreshCart();
    setCartOpen(true);
  };

  const removeFromCart = async (cartItemId: string) => {
    const result = await removeFromCartAction(cartItemId);
    if (!result.ok) alert(result.error);
    else await refreshCart();
  };

  const updateCartQuantity = async (cartItemId: string, delta: number) => {
    const item = cart.find((i) => i.id === cartItemId);
    if (!item) return;
    const newQty = item.quantity + delta;
    const result =
      newQty < 1
        ? await removeFromCartAction(cartItemId)
        : await updateCartQuantityAction(cartItemId, newQty);
    if (!result.ok) alert(result.error);
    else await refreshCart();
  };

  const cartTotalWithVat = cart.reduce(
    (sum, i) => sum + i.price * 1.24 * i.quantity,
    0,
  );

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    const result = await createOrderAction();
    if (!result.ok) {
      alert(result.error ?? "Αποτυχία υποβολής.");
      return;
    }
    await refreshCart();
    setCartOpen(false);
    alert("Η παραγγελία σου υποβλήθηκε με επιτυχία. Θα επικοινωνήσουμε σύντομα.");
  };

  const handleToggleRow = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <aside className="flex w-64 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95">
        <div className="border-b border-slate-800 p-6">
          <h1 className="text-xl font-semibold">Parts Marketplace</h1>
          <p className="text-xs text-slate-500">Master Catalog & Suppliers</p>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <Link
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  item.active
                    ? "border border-blue-500/30 bg-blue-500/15 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header / Filters / Uploaders */}
        <header className="flex flex-wrap items-center gap-4 border-b border-slate-800 bg-slate-950/98 px-6 py-4">
          <form
            onSubmit={handleSearchSubmit}
            className="relative flex min-w-[220px] flex-1 max-w-md items-center gap-2"
          >
            <div className="relative flex flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Αναζήτηση με κωδικό, περιγραφή ή brand (min 3 χαρακτήρες)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 pl-10 pr-10 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all focus:border-blue-500"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 transition-colors hover:bg-slate-700/80 hover:text-slate-200"
                  aria-label="Καθαρισμός αναζήτησης"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={searchTerm.trim().length < MIN_SEARCH_LENGTH || isLoading}
              className="shrink-0 rounded-lg border border-blue-500/50 bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-300 transition-colors hover:bg-blue-500/30 disabled:pointer-events-none disabled:opacity-50"
            >
              Αναζήτηση
            </button>
          </form>

          <div className="ml-auto flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCartOpen(true)}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500 hover:text-blue-300"
              aria-label="Άνοιγμα καλαθιού"
            >
              <ShoppingCart className="h-5 w-5" />
              {cart.length > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-[10px] font-semibold text-white">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              )}
            </button>
            {userId === ADMIN_USER_ID && (
              <Link
                href="/admin/dashboard"
                className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-xs font-medium text-slate-400 transition-colors hover:border-slate-600 hover:bg-slate-800 hover:text-slate-200"
                title="Διαχείριση (Admin)"
              >
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Διαχείριση</span>
              </Link>
            )}
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "h-9 w-9",
                },
              }}
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {/* Parts table */}
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/90">
            <div className="border-b border-slate-800 px-6 py-4">
              <h2 className="text-lg font-semibold text-slate-100">
                Master Price List
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Κωδικοί, περιγραφές, επίσημη τιμή καταλόγου (MSRP) και
                διαθέσιμοι προμηθευτές.
              </p>
            </div>
            <div className="overflow-x-auto">
              {isLoading ? (
                <div className="flex items-center gap-3 p-6 text-sm text-slate-400">
                  <Loader2 className="h-5 w-5 animate-spin shrink-0" />
                  <span>Searching...</span>
                </div>
              ) : error ? (
                <p className="p-6 text-sm text-red-400">{error}</p>
              ) : hasSearched && products.length === 0 ? (
                <p className="p-6 text-sm text-slate-400">No parts found.</p>
              ) : !hasSearched ? (
                <p className="p-6 text-sm text-slate-500">
                  Πληκτρολόγησε τουλάχιστον 3 χαρακτήρες και πάτα Enter ή κλικ στο &quot;Αναζήτηση&quot; για να φορτώσεις αποτελέσματα.
                </p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-3"></th>
                      <th className="px-6 py-3">Κωδικός</th>
                      <th className="px-6 py-3">Περιγραφή</th>
                      <th className="px-6 py-3">Brand</th>
                      <th className="px-6 py-3">Τιμή (Χωρίς ΦΠΑ)</th>
                      <th className="px-6 py-3">Τιμή (με ΦΠΑ 24%)</th>
                      <th className="px-6 py-3 w-20"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => {
                      const isExpanded = !!expanded[product.id];
                      const stocks = product.stocks || [];
                      const msrp = product.officialMsrp ?? 0;
                      const minOffer =
                        stocks.length > 0
                          ? Math.min(
                              ...stocks.map((s) => s.supplierPrice ?? Infinity),
                            )
                          : undefined;

                      return (
                        <React.Fragment key={product.id}>
                          <tr className="border-b border-slate-800/80 bg-slate-900/80 hover:bg-slate-800/70 transition-colors">
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => handleToggleRow(product.id)}
                                className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 hover:border-blue-500 hover:text-blue-300"
                                aria-label={
                                  isExpanded
                                    ? "Απόκρυψη προμηθευτών"
                                    : "Εμφάνιση προμηθευτών"
                                }
                              >
                                <ChevronDown
                                  className={`h-4 w-4 transition-transform ${
                                    isExpanded ? "rotate-180" : ""
                                  }`}
                                />
                              </button>
                            </td>
                            <td className="px-6 py-3 align-top font-mono text-xs text-blue-300">
                              {product.partNumber}
                            </td>
                            <td className="px-6 py-3 align-top text-slate-100">
                              {product.name}
                            </td>
                            <td className="px-6 py-3 align-top text-xs text-slate-400">
                              {product.brand}
                            </td>
                            <td className="px-6 py-3 align-top text-slate-100">
                              {msrp == null || msrp === 0
                                ? "—"
                                : formatCurrency(msrp)}
                              {minOffer !== undefined &&
                                Number.isFinite(minOffer) &&
                                minOffer < msrp &&
                                msrp > 0 && (
                                  <span className="ml-2 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                                    Καλύτερη: {formatCurrency(minOffer)}
                                  </span>
                                )}
                            </td>
                            <td className="px-6 py-3 align-top text-slate-100">
                              {msrp == null || msrp === 0
                                ? "—"
                                : formatCurrency(msrp * 1.24)}
                            </td>
                            <td className="px-4 py-3 align-top">
                              <button
                                type="button"
                                onClick={() => addToCart(product)}
                                disabled={msrp == null || msrp === 0 || cartLoading}
                                className="flex h-8 w-8 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-amber-500/60 hover:bg-amber-500/10 hover:text-amber-400 disabled:pointer-events-none disabled:opacity-50"
                                aria-label="Προσθήκη στο καλάθι"
                                title="Προσθήκη στο καλάθι"
                              >
                                <ShoppingCart className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>

                          {isExpanded && (
                            <tr className="border-b border-slate-800/80 bg-slate-950/80">
                              <td colSpan={7} className="px-10 pb-4 pt-0">
                                {stocks.length === 0 ? (
                                  <div className="py-3 text-xs text-slate-500">
                                    Δεν υπάρχουν ακόμα εγγραφές αποθέματος από
                                    προμηθευτές για αυτόν τον κωδικό.
                                  </div>
                                ) : (
                                  <table className="mt-2 w-full text-xs">
                                    <thead>
                                      <tr className="border-b border-slate-800 text-left text-[11px] uppercase tracking-wide text-slate-500">
                                        <th className="px-2 py-2">
                                          Προμηθευτής
                                        </th>
                                        <th className="px-2 py-2">
                                          Τιμή Προσφοράς
                                        </th>
                                        <th className="px-2 py-2">
                                          Διαθεσιμότητα
                                        </th>
                                        <th className="px-2 py-2">
                                          Τελευταία Ενημέρωση
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {stocks.map((stock) => {
                                        const isBest =
                                          Number.isFinite(minOffer) &&
                                          stock.supplierPrice === minOffer &&
                                          (minOffer as number) < msrp;

                                        return (
                                          <tr
                                            key={stock.id}
                                            className="border-b border-slate-800/60 last:border-0"
                                          >
                                            <td className="px-2 py-2 text-slate-200">
                                              {stock.supplier?.name || "—"}
                                            </td>
                                            <td
                                              className={`px-2 py-2 ${
                                                isBest
                                                  ? "font-semibold text-emerald-300"
                                                  : "text-slate-200"
                                              }`}
                                            >
                                              {formatCurrency(
                                                stock.supplierPrice,
                                              )}
                                            </td>
                                            <td className="px-2 py-2 text-slate-200">
                                              {stock.quantity} τμχ
                                            </td>
                                            <td className="px-2 py-2 text-[11px] text-slate-500">
                                              {stock.updatedAt
                                                ? new Date(
                                                    stock.updatedAt,
                                                  ).toLocaleString("el-GR")
                                                : "—"}
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                )}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Cart drawer */}
      {cartOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/60"
            aria-hidden
            onClick={() => setCartOpen(false)}
          />
          <aside
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-xl"
            aria-label="Καλάθι"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <h2 className="text-lg font-semibold text-slate-100">
                Καλάθι ({cart.reduce((s, i) => s + i.quantity, 0)} προϊόντα)
              </h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                className="rounded p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {cart.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Το καλάθι είναι άδειο. Πρόσθεσε ανταλλακτικά από τον πίνακα.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-start justify-between gap-2 rounded-lg border border-slate-800 bg-slate-800/50 p-3 text-sm"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-xs text-blue-300">
                          {item.partNumber}
                        </p>
                        <p className="truncate text-slate-200">{item.description}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {formatCurrency(item.price * 1.24)} × {item.quantity} ={" "}
                          {formatCurrency(item.price * 1.24 * item.quantity)}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          aria-label="Μείωση ποσότητας"
                        >
                          −
                        </button>
                        <span className="w-6 text-center text-slate-200">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded border border-slate-600 text-slate-400 hover:bg-slate-700 hover:text-slate-200"
                          aria-label="Αύξηση ποσότητας"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(item.id)}
                          className="ml-1 rounded p-1 text-slate-500 hover:bg-red-500/20 hover:text-red-400"
                          aria-label="Αφαίρεση"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {cart.length > 0 && (
              <div className="border-t border-slate-800 p-4">
                <div className="mb-3 flex items-center justify-between text-sm">
                  <span className="text-slate-500">Σύνολο (με ΦΠΑ 24%)</span>
                  <span className="text-lg font-semibold text-slate-100">
                    {formatCurrency(cartTotalWithVat)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleSubmitOrder}
                  className="w-full rounded-lg bg-blue-600 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-500"
                >
                  Υποβολή παραγγελίας
                </button>
              </div>
            )}
          </aside>
        </>
      )}
    </div>
  );
}