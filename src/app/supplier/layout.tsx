"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { Loader2, Package, Upload, Truck } from "lucide-react";

export default function SupplierLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const metadata = user?.publicMetadata as { role?: string; supplierId?: string } | undefined;
  const isSupplier = metadata?.role === "SUPPLIER";

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSupplier) {
      router.replace("/");
    }
  }, [isLoaded, isSupplier, router]);

  if (!isLoaded || !isSupplier) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6">
        <Link
          href="/supplier/dashboard"
          className="flex items-center gap-2 text-lg font-semibold text-slate-200"
        >
          <Truck className="h-6 w-6 text-blue-400" />
          Supplier Portal
        </Link>
        <nav className="flex items-center gap-2">
          <Link
            href="/supplier/dashboard"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === "/supplier/dashboard"
                ? "bg-blue-500/20 text-blue-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Package className="h-4 w-4" />
            Παραγγελίες
          </Link>
          <Link
            href="/supplier/inventory"
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              pathname === "/supplier/inventory"
                ? "bg-blue-500/20 text-blue-300"
                : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
            }`}
          >
            <Upload className="h-4 w-4" />
            Inventory Sync
          </Link>
        </nav>
      </header>
      <main className="min-w-0 flex-1 p-4 sm:p-6">{children}</main>
    </div>
  );
}
