"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { ArrowLeft, BarChart3, Package, Loader2, Warehouse, Menu, X, FileInput, Truck } from "lucide-react";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

const NAV_ITEMS = [
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

  useEffect(() => {
    if (!isLoaded) return;
    const role = (user?.publicMetadata as { role?: string } | undefined)?.role;
    if (role === "SUPPLIER") {
      router.replace("/supplier/dashboard");
      return;
    }
    if (userId !== ADMIN_USER_ID) {
      router.replace("/");
    }
  }, [isLoaded, userId, user?.publicMetadata, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  if (!isLoaded || (isLoaded && userId !== ADMIN_USER_ID)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Desktop sidebar */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95 lg:flex">
        <div className="border-b border-slate-800 p-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω
          </Link>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "border border-blue-500/30 bg-blue-500/15 text-blue-400"
                    : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                }`}
              >
                <item.icon className="h-5 w-5" />
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
            className="fixed left-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-r border-slate-800 bg-slate-900 shadow-xl lg:hidden"
            aria-label="Admin μενού"
          >
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <span className="text-sm font-semibold text-slate-300">Admin</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο μενού"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="border-b border-slate-800 p-4">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                <ArrowLeft className="h-4 w-4" />
                Πίσω
              </Link>
            </div>
            <nav className="flex-1 space-y-1 p-4">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                      isActive
                        ? "border border-blue-500/30 bg-blue-500/15 text-blue-400"
                        : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </aside>
        </>
      )}

      {/* Main: fixed top bar on mobile + content */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-800 bg-slate-950/98 px-4 py-3 lg:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-700 bg-slate-900 text-slate-300 transition-colors hover:border-blue-500 hover:text-blue-300"
            aria-label="Άνοιγμα μενού"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-semibold text-slate-200">Admin</span>
        </header>
        <div className="min-w-0 flex-1 p-4">{children}</div>
      </div>
    </div>
  );
}
