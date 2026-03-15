"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useClerk, useUser, UserButton } from "@clerk/nextjs";
import {
  Search,
  LogOut,
  ShoppingCart,
  Package,
  PackageSearch,
  CheckCircle2,
  AlertTriangle,
  Shield,
  Loader2,
} from "lucide-react";

type CustomerSession = {
  name: string;
  email: string;
  code: string;
  remember: boolean;
};

export type DashboardProduct = {
  id: string;
  partNumber?: string;
  name: string;
  ean: string;
  supplier: string;
  price: number;
  stock: number;
  updatedAt: string;
};

const STORAGE_KEY = "pl_customer_session";

const BrandBadge = ({ brand }: { brand: string }) => {
  const colors: Record<string, string> = {
    Toyota: "bg-red-600/20 text-red-400 border-red-500/30",
    Audi: "bg-slate-700/50 text-slate-300 border-slate-500/30",
    BMW: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    Directed: "bg-violet-600/20 text-violet-300 border-violet-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        colors[brand] ?? "bg-slate-700/50 text-slate-400 border-slate-600/50"
      }`}
    >
      {brand}
    </span>
  );
};

function formatPrice(price: unknown): string {
  return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(
    Number(price)
  );
}

type Props = {
  initialProducts: DashboardProduct[];
  page: number;
  pageSize: number;
  totalCount: number;
  suppliers: string[];
  searchTerm?: string;
  isLoading?: boolean;
  onSearchChange?: (q: string) => void;
  onPageChange?: (newPage: number) => void;
};

export default function DashboardClient({
  initialProducts,
  page,
  pageSize,
  totalCount,
  suppliers,
  searchTerm: searchTermProp = "",
  isLoading = false,
  onSearchChange,
  onPageChange,
}: Props) {
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const isAdmin = (user?.publicMetadata?.role as string) === "admin";
  const [customer, setCustomer] = useState<CustomerSession | null>(null);
  const [products, setProducts] = useState<DashboardProduct[]>(
    Array.isArray(initialProducts) ? initialProducts : []
  );
  const [searchInput, setSearchInput] = useState(searchTermProp);
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const hasSearched = Boolean(searchTermProp?.trim());

  useEffect(() => {
    setProducts(Array.isArray(initialProducts) ? initialProducts : []);
  }, [initialProducts]);

  useEffect(() => {
    setSearchInput(searchTermProp);
  }, [searchTermProp]);

  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    if (onSearchChange) {
      searchDebounceRef.current = setTimeout(() => onSearchChange(value), 350);
    }
  };

  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<
    {
      productId: string;
      name: string;
      ean: string;
      supplier: string;
      quantity: number;
    }[]
  >([]);
  const [isSending, setIsSending] = useState(false);
  const [sendMessage, setSendMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const verifySession = () => {
      try {
        const win = typeof window !== "undefined" ? window : null;
        if (!win) return;

        const rawSession =
          win.sessionStorage.getItem(STORAGE_KEY) ?? win.localStorage.getItem(STORAGE_KEY);

        if (!rawSession) {
          return;
        }

        let parsed: CustomerSession | null = null;
        try {
          parsed = JSON.parse(rawSession) as CustomerSession;
        } catch {
          parsed = null;
        }

        if (!parsed?.email || !parsed?.code) {
          win.sessionStorage.removeItem(STORAGE_KEY);
          win.localStorage.removeItem(STORAGE_KEY);
          return;
        }

        if (!cancelled) {
          setCustomer(parsed);
        }
      } catch (err) {
        console.error(err);
        if (!cancelled) {
          setError("Σφάλμα ελέγχου συνεδρίας πελάτη.");
        }
      }
    };

    verifySession();

    return () => {
      cancelled = true;
    };
  }, [router]);

  const handleLogout = async () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(STORAGE_KEY);
    }
    await signOut({ redirectUrl: "/login" });
  };

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const supplierValue = supplierFilter === "all" ? null : supplierFilter;
    if (!supplierValue) return list;
    return list.filter((product) => product.supplier === supplierValue);
  }, [products, supplierFilter]);

  const totalProducts = totalCount;
  const productsList = Array.isArray(products) ? products : [];
  const totalOnPage = productsList.length;
  const startItem = totalOnPage === 0 ? 0 : (page - 1) * pageSize + 1;
  const endItem = totalOnPage === 0 ? 0 : (page - 1) * pageSize + totalOnPage;
  const hasPrevious = page > 1;
  const hasNext = endItem < totalProducts;
  const inStock = productsList.filter((p) => p.stock > 0).length;
  const cartItemCount = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getStockBadgeStyles = (stock: number) => {
    if (stock > 5) {
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/15 px-2.5 py-1 text-xs font-medium text-emerald-300",
        iconClass: "h-3.5 w-3.5 text-emerald-400",
        label: `Σε απόθεμα · ${stock} τμχ`,
      };
    }
    if (stock > 0) {
      return {
        container:
          "inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-medium text-amber-200",
        iconClass: "h-3.5 w-3.5 text-amber-300",
        label: `Περιορισμένο απόθεμα · ${stock} τμχ`,
      };
    }
    return {
      container:
        "inline-flex items-center gap-1.5 rounded-full border border-red-500/40 bg-red-500/15 px-2.5 py-1 text-xs font-medium text-red-300",
      iconClass: "h-3.5 w-3.5 text-red-400",
      label: "Μη διαθέσιμο",
    };
  };

  const handleAddToCart = (product: DashboardProduct) => {
    setCart((prev) => {
      const list = prev || [];
      const existing = list.find((item) => item.productId === product.id);
      if (existing) {
        return list.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        );
      }
      return [
        ...list,
        {
          productId: product.id,
          name: product.name,
          ean: product.ean,
          supplier: product.supplier,
          quantity: 1,
        },
      ];
    });
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prev) =>
      (prev || [])
        .map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + delta }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const handleSendRequest = async () => {
    setSendMessage(null);

    if (!customer) {
      setSendMessage("Δεν βρέθηκαν στοιχεία πελάτη για το αίτημα.");
      return;
    }

    if (cart.length === 0) {
      setSendMessage("Το καλάθι αιτήματος είναι άδειο.");
      return;
    }

    setIsSending(true);
    try {
      const res = await fetch("/api/request-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customer: {
            name: customer.name,
            email: customer.email,
            code: customer.code,
          },
          items: cart,
        }),
      });

      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; error?: string }
        | null;

      if (!res.ok || !data?.success) {
        setSendMessage(data?.error || "Αποτυχία αποστολής αιτήματος.");
        return;
      }

      setSendMessage("Το αίτημα στάλθηκε με επιτυχία.");
      setCart([]);
    } catch {
      setSendMessage("Αποτυχία αποστολής αιτήματος.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100">
      {/* Left sidebar - fixed */}
      <aside className="fixed left-0 top-0 z-30 flex h-screen w-56 flex-col border-r border-slate-800 bg-slate-950">
        <div className="border-b border-slate-800 px-4 py-4">
          <p className="text-sm font-bold text-white">Parts Marketplace</p>
          <p className="text-xs text-slate-500">Master Catalog &amp; Suppliers</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-sm font-medium text-blue-300 ring-1 ring-blue-500/30"
          >
            <PackageSearch className="h-4 w-4 shrink-0" aria-hidden />
            Dashboard
          </Link>
          <Link
            href="/dashboard/orders"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
          >
            <Package className="h-4 w-4 shrink-0" aria-hidden />
            Οι Παραγγελίες μου
          </Link>
        </nav>
        <div className="mt-auto space-y-3 border-t border-slate-800 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            SHOP BY BRAND
          </p>
          <select
            value={supplierFilter}
            onChange={(e) => {
              setSupplierFilter(e.target.value);
              if (page !== 1) router.push("/dashboard?page=1");
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
            aria-label="Επίλεξε brand"
          >
            <option value="all">Επίλεξε brand...</option>
            {(suppliers || []).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 hover:bg-slate-800/60 hover:text-red-300"
          >
            <LogOut className="h-4 w-4 shrink-0" aria-hidden />
            Αποσύνδεση
          </button>
        </div>
      </aside>

      {/* Main: header + content */}
      <div className="flex flex-1 flex-col min-h-screen pl-56">
        <header className="flex items-center justify-end gap-3 border-b border-slate-800 bg-transparent px-4 py-3">
          <Link
            href="/dashboard"
            className="relative inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-900/80 p-2 text-slate-200 hover:bg-slate-800"
            aria-label="Καλάθι"
          >
            <ShoppingCart className="h-5 w-5 shrink-0" aria-hidden />
            {cartItemCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-blue-600 px-1 text-xs font-medium text-white">
                {cartItemCount}
              </span>
            )}
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
          >
            <Package className="h-4 w-4 shrink-0" aria-hidden />
            Οι Παραγγελίες μου
          </Link>
          {isAdmin && (
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-900/80 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-800"
            >
              <Shield className="h-4 w-4 shrink-0" aria-hidden />
              Διαχείριση
            </Link>
          )}
          <UserButton appearance={{ elements: { avatarBox: "h-9 w-9" } }} />
        </header>

        <main className="flex-1 overflow-auto bg-slate-950">
          {!hasSearched ? (
            <div className="flex min-h-[calc(100vh-3.5rem)] flex-col items-center justify-center px-4 py-12">
              <div className="w-full max-w-2xl space-y-8">
                <h1 className="text-center text-3xl font-bold tracking-tight text-white md:text-4xl">
                  PARTSLOCATOR
                </h1>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500"
                      aria-hidden
                    />
                    <input
                      type="search"
                      placeholder="Αναζήτηση με κωδικο, περιγραφή ή brand (min 3 χαρακτήρες)..."
                      className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3.5 pl-12 pr-4 text-base text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && onSearchChange) onSearchChange(searchInput);
                      }}
                      autoFocus
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSearchChange?.(searchInput)}
                    className="rounded-xl bg-blue-600 px-5 py-3.5 text-sm font-medium text-white hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-950"
                  >
                    Αναζήτηση
                  </button>
                </div>
                <div className="flex flex-col items-center justify-center gap-2 text-center">
                  <p className="text-base font-medium text-slate-300">
                    Πραγματοποιήστε μια αναζήτηση για να δείτε αποτελέσματα
                  </p>
                  <p className="max-w-sm text-sm text-slate-500">
                    Αναζητήστε με κωδικό, περιγραφή ή επιλέξτε μάρκα από τη sidebar.
                  </p>
                </div>
              </div>
            </div>
          ) : (
          <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8 lg:flex-row">
            {isLoading && (
              <div className="absolute left-0 right-0 top-0 z-10 h-0.5 overflow-hidden rounded-full bg-slate-800">
                <div className="loading-bar h-full min-w-[30%] rounded-full bg-emerald-500" />
              </div>
            )}
            <div className="flex-1 transition-opacity duration-300 ease-out">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-xl backdrop-blur">
            <div className="space-y-6 p-6 md:p-8">
            <section className="space-y-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-white md:text-2xl">
                  Αναζήτηση Ανταλλακτικών
                </h1>
                <p className="text-[11px] text-slate-500">
                  Σύνολο προϊόντων: <span className="font-medium text-slate-200">{totalProducts}</span>
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-3">
              <div className="relative flex-1">
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Αναζήτηση με όνομα, κωδικό, EAN..."
                  className="w-full rounded-lg border border-slate-700 bg-slate-900/90 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
              {isLoading && (
                <div className="flex shrink-0 items-center justify-center" aria-hidden>
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                </div>
              )}
              {/* Brand dropdown - only when results are displayed */}
              <div className="flex w-full items-center gap-2 text-xs text-slate-400 md:w-56">
                <span className="whitespace-nowrap">Μάρκα:</span>
                <select
                  value={supplierFilter}
                  onChange={(e) => {
                    setSupplierFilter(e.target.value);
                    if (page !== 1) router.push("/dashboard?page=1");
                  }}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                >
                  <option value="all">Όλες οι μάρκες</option>
                  {(suppliers || []).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-3 text-xs text-slate-400 sm:grid-cols-3">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300">
                  <PackageSearch className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    Διαθέσιμα προϊόντα
                  </span>
                  <span className="text-sm font-medium text-white">{totalProducts}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    Σε απόθεμα
                  </span>
                  <span className="text-sm font-medium text-emerald-300">{inStock}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-700 bg-slate-900 text-slate-300">
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <span className="text-[11px] uppercase tracking-wide text-slate-500">
                    Τιμές B2B (EUR)
                  </span>
                  <span className="text-sm font-medium text-slate-200">
                    Εμφάνιση καθαρής τιμής ανά προϊόν
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            {error && (
              <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                {error}
              </div>
            )}

            {!error && filteredProducts.length === 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-6 text-sm text-slate-400">
                Δεν βρέθηκαν προϊόντα για την αναζήτηση{" "}
                <span className="font-medium text-slate-200">&quot;{searchTermProp || searchInput}&quot;</span>. Δοκίμαστε άλλη ονομασία ή EAN.
              </div>
            )}

            <div className="flex items-center justify-between gap-3 text-xs text-slate-400">
              <span>
                Εμφάνιση{" "}
                <span className="font-medium text-slate-200">
                  {startItem}-{endItem}
                </span>{" "}
                από{" "}
                <span className="font-medium text-slate-200">{totalProducts}</span> προϊόντα
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={!hasPrevious}
                  onClick={() => {
                    if (!hasPrevious) return;
                    if (onPageChange) onPageChange(page - 1);
                    else router.push(`/dashboard?page=${page - 1}`);
                  }}
                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 hover:bg-slate-800"
                >
                  Προηγούμενα
                </button>
                <button
                  type="button"
                  disabled={!hasNext}
                  onClick={() => {
                    if (!hasNext) return;
                    if (onPageChange) onPageChange(page + 1);
                    else router.push(`/dashboard?page=${page + 1}`);
                  }}
                  className="inline-flex items-center rounded-lg border px-3 py-1.5 text-[11px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 border-emerald-600 bg-emerald-600/15 text-emerald-200 hover:border-emerald-500 hover:bg-emerald-600/30"
                >
                  Επόμενα
                </button>
              </div>
            </div>

            <div className="hidden max-h-[70vh] overflow-x-auto overflow-y-auto rounded-xl border border-slate-800 md:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">{"Προϊόν / EAN"}</th>
                    <th className="px-4 py-3">Προμηθευτής</th>
                    <th className="px-4 py-3 text-right">Τιμή B2B</th>
                    <th className="px-4 py-3 text-center">Απόθεμα</th>
                    <th className="px-4 py-3 w-32 text-right">Ενέργεια</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {!error &&
                    Array.isArray(filteredProducts) &&
                    filteredProducts.map((product) => {
                      const stockStyles = getStockBadgeStyles(product.stock);
                      const inStockBool = product.stock > 0;
                      return (
                        <tr
                          key={product.id}
                          className="bg-slate-900/30 transition-colors hover:bg-slate-800/40"
                        >
                          <td className="px-4 py-3">
                            <div>
                              <p className="font-medium text-slate-100">{product.name}</p>
                              <p className="font-mono text-[11px] text-slate-500">EAN: {product.ean}</p>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <BrandBadge brand={product.supplier} />
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-emerald-300">
                            {formatPrice(product.price)}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={stockStyles.container}>
                              {inStockBool ? (
                                <CheckCircle2 className={stockStyles.iconClass} aria-hidden />
                              ) : (
                                <AlertTriangle className={stockStyles.iconClass} aria-hidden />
                              )}
                              <span className="text-xs">{stockStyles.label}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <button
                              type="button"
                              className="rounded-lg border border-emerald-500/60 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                              onClick={() => {
                                if (!inStockBool) return;
                                handleAddToCart(product);
                              }}
                              disabled={!inStockBool}
                            >
                              Προσθήκη
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>

            {/* Mobile: card grid */}
            <div className="grid gap-4 sm:grid-cols-2 md:hidden xl:grid-cols-3">
              {!error &&
                Array.isArray(filteredProducts) &&
                filteredProducts.map((product) => {
                  const stockStyles = getStockBadgeStyles(product.stock);
                  const inStockBool = product.stock > 0;
                  return (
                    <article
                      key={product.id}
                      className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-900/90 p-4 shadow-sm transition-colors hover:border-emerald-500/40 hover:bg-slate-900"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1.5">
                          <h2 className="text-sm font-semibold text-white line-clamp-2">
                            {product.name}
                          </h2>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="font-mono text-[11px] text-blue-400">
                              EAN: {product.ean}
                            </span>
                            <BrandBadge brand={product.supplier} />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-emerald-300">
                            {formatPrice(product.price)}
                          </p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Τιμή B2B χωρίς ΦΠΑ</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between gap-3">
                        <div className={stockStyles.container}>
                          {inStockBool ? (
                            <CheckCircle2 className={stockStyles.iconClass} aria-hidden />
                          ) : (
                            <AlertTriangle className={stockStyles.iconClass} aria-hidden />
                          )}
                          <span>{stockStyles.label}</span>
                        </div>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/60 bg-emerald-600/10 px-3 py-1.5 text-xs font-medium text-emerald-200 transition-colors hover:bg-emerald-600/25 disabled:cursor-not-allowed disabled:opacity-60"
                          onClick={() => {
                            if (!inStockBool) return;
                            handleAddToCart(product);
                          }}
                          disabled={!inStockBool}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                          <span>Προσθήκη σε αίτημα</span>
                        </button>
                      </div>
                    </article>
                  );
                })}
            </div>
          </section>
            </div>
          </div>
          </div>

          <aside className="w-full space-y-3 rounded-xl border border-slate-800 bg-slate-950/80 p-4 text-xs text-slate-200 shadow-lg lg:mt-0 lg:w-80">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-md border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                  <ShoppingCart className="h-4 w-4" aria-hidden />
                </span>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">Καλάθι Αιτήματος</span>
                  <span className="text-[11px] text-slate-400">
                    Ανταλλακτικά προς αποστολή στον διαχειριστή.
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-slate-900 px-2 py-1 text-[11px] font-medium text-slate-200">
                {cartItemCount} τεμ.
              </span>
            </div>

            <div className="h-px bg-slate-800" />

            {cart.length === 0 ? (
              <p className="text-[11px] text-slate-500">
                Δεν έχεις προσθέσει ακόμη ανταλλακτικά. Χρησιμοποίησε το κουμπί{" "}
                <span className="font-medium text-slate-300">«Προσθήκη σε αίτημα»</span> για να
                δημιουργήσεις λίστα.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
                  {(cart || []).map((item) => (
                    <div
                      key={item.productId}
                      className="rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="line-clamp-2 text-[11px] font-medium text-slate-100">
                            {item.name}
                          </p>
                          <p className="font-mono text-[10px] text-blue-400">
                            EAN: {item.ean}
                          </p>
                          <p className="text-[10px] text-slate-500">{item.supplier}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-[10px]">
                            <button
                              type="button"
                              className="px-1 text-slate-400 hover:text-slate-100"
                              onClick={() => updateQuantity(item.productId, -1)}
                            >
                              −
                            </button>
                            <span className="px-1 text-slate-100">{item.quantity}</span>
                            <button
                              type="button"
                              className="px-1 text-slate-400 hover:text-slate-100"
                              onClick={() => updateQuantity(item.productId, 1)}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isSending || cart.length === 0}
                  onClick={handleSendRequest}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-3 py-2 text-[11px] font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ShoppingCart className="h-3.5 w-3.5" aria-hidden />
                  {isSending ? "Αποστολή αιτήματος..." : "Αποστολή αιτήματος"}
                </button>

                {sendMessage && (
                  <p className="text-[11px] text-slate-300">{sendMessage}</p>
                )}
              </div>
            )}
          </aside>
        </div>
          )}
        </main>
      </div>
    </div>
  );
}

