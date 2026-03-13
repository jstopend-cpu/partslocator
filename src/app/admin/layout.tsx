"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { ArrowLeft, BarChart3, Package, Loader2, Warehouse } from "lucide-react";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

const NAV_ITEMS = [
  { href: "/admin/dashboard", label: "Analytics Dashboard", icon: BarChart3 },
  { href: "/admin/orders", label: "Διαχείριση παραγγελιών", icon: Package },
  { href: "/admin/inventory", label: "Απόθεμα", icon: Warehouse },
] as const;

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { userId, isLoaded } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (userId !== ADMIN_USER_ID) {
      router.replace("/");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded || (isLoaded && userId !== ADMIN_USER_ID)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      <aside className="flex w-56 shrink-0 flex-col border-r border-slate-800 bg-slate-900/95">
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
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
