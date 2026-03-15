"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowLeft, BarChart3, Package, Loader2, Warehouse, Menu, X, FileInput, Truck, UserPlus, Users } from "lucide-react";
import { canAccessAdmin } from "@/app/actions/b2b-registrations";
import AdminHeader from "./AdminHeader";

const NAV_ITEMS = [
  { href: "/admin", label: "Διαχείριση χρηστών", icon: Users },
  { href: "/admin/b2b", label: "B2B Εγγραφές", icon: UserPlus },
  { href: "/admin/dashboard", label: "Analytics Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Διαχείριση παραγγελιών", icon: Package },
  { href: "/admin/inventory", label: "Απόθεμα", icon: Warehouse },
  { href: "/admin/suppliers/dashboard", label: "Προμηθευτές", icon: Truck },
  { href: "/admin/universal-import", label: "Universal Importer", icon: FileInput },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();
  const { user } = useUser();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminAllowed, setAdminAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!userId) {
      setAdminAllowed(false);
      router.replace("/");
      return;
    }
    const metadata = user?.publicMetadata as { role?: string; suspended?: boolean } | undefined;
    const role = metadata?.role;
    if (role === "SUPPLIER") {
      router.replace("/supplier/dashboard");
      return;
    }
    if (metadata?.suspended === true) {
      setAdminAllowed(false);
      router.replace("/account-suspended");
      return;
    }
    canAccessAdmin().then((allowed) => {
      setAdminAllowed(allowed);
      if (!allowed) router.replace("/");
    });
  }, [isLoaded, userId, user?.publicMetadata, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!isLoaded || adminAllowed === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }
  if (isLoaded && adminAllowed === null && userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Desktop sidebar - same structure as dashboard for seamless feel */}
      <aside className="fixed left-0 top-0 z-30 hidden h-screen w-56 flex-col border-r border-slate-800 bg-slate-950 lg:flex">
        <div className="border-b border-slate-800 px-4 py-4">
          <p className="text-sm font-bold text-white">Parts Marketplace</p>
          <p className="text-xs text-slate-500">Master Catalog &amp; Suppliers</p>
        </div>
        <nav className="flex-1 space-y-0.5 p-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-sm font-medium text-blue-300 ring-1 ring-blue-500/30"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            Dashboard
          </Link>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? "border border-orange-500/30 bg-orange-500/15 text-orange-400"
                    : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm lg:hidden"
            aria-hidden
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-950 shadow-xl lg:hidden"
            aria-label="Admin μενού"
          >
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-4">
              <p className="text-sm font-bold text-white">Parts Marketplace</p>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο μενού"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-slate-800 p-3">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-sm font-medium text-blue-300"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
            </div>
            <nav className="flex-1 space-y-0.5 p-3">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border border-orange-500/30 bg-orange-500/15 text-orange-400"
                        : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main: header (Bell + UserButton) + content (pl-56 for fixed sidebar) */}
      <div className="flex min-w-0 flex-1 flex-col pl-0 lg:pl-56">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/98 px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-orange-500 hover:text-orange-300 lg:hidden"
              aria-label="Άνοιγμα μενού"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-semibold text-slate-200">Admin</span>
          </div>
          <AdminHeader />
        </header>
        <div className="min-w-0 flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
