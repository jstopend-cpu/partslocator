"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { getB2BRegistrations, type B2BRegistrationRow } from "@/app/actions/b2b-registrations";
import { Loader2, Search, Check, ArrowLeft, UserPlus } from "lucide-react";

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString("el-GR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export default function AdminB2BRegistrationsPage() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getB2BRegistrations>> | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    getB2BRegistrations().then(setResult);
  }, []);

  const rows = result?.ok ? result.data : [];
  const filtered = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.afm.toLowerCase().includes(q) ||
        r.companyName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q)
    );
  }, [rows, search]);

  if (result === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!result.ok && "forbidden" in result && result.forbidden) {
    return (
      <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-8 text-center">
        <p className="text-slate-300">Δεν έχετε πρόσβαση σε αυτή τη σελίδα.</p>
        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Πίσω στην αρχική
        </Link>
      </div>
    );
  }

  if (!result.ok) {
    const message = "error" in result ? result.error : "Access Denied";
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-red-300">
        {message}
      </div>
    );
  }

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            B2B Εγγραφές
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Επωνυμία (VIES), ΑΦΜ, Email, ημερομηνία, κατάσταση welcome email
          </p>
        </div>
        <Link
          href="/admin/dashboard"
          className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Dashboard
        </Link>
      </header>

      <div className="mb-4">
        <label htmlFor="search" className="sr-only">
          Αναζήτηση κατά ΑΦΜ ή Επωνυμία
        </label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            id="search"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Αναζήτηση κατά ΑΦΜ ή Επωνυμία..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800/80 py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            {rows.length === 0
              ? "Δεν υπάρχουν εγγραφές ακόμα."
              : "Δεν βρέθηκαν αποτελέσματα για την αναζήτηση."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Επωνυμία</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">ΑΦΜ</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Email</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Ημερομηνία Εγγραφής</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 text-center">Email Απεστάλη</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((row: B2BRegistrationRow) => (
                  <tr
                    key={row.id}
                    className="bg-slate-900/30 transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-200 sm:px-6 sm:py-4">
                      {row.companyName}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-300 sm:px-6 sm:py-4">
                      {row.afm}
                    </td>
                    <td className="px-4 py-3 text-slate-300 sm:px-6 sm:py-4">
                      {row.email}
                    </td>
                    <td className="px-4 py-3 text-slate-400 sm:px-6 sm:py-4">
                      {formatDate(row.registeredAt)}
                    </td>
                    <td className="px-4 py-3 text-center sm:px-6 sm:py-4">
                      {row.welcomeEmailSentAt ? (
                        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400" title="Απεστάλη">
                          <Check className="h-4 w-4" />
                        </span>
                      ) : (
                        <span className="text-slate-500">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
