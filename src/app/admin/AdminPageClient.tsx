"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminUsersList,
  getAdminBrandsList,
  updateUserAllowedBrands,
  type AdminUserRow,
} from "@/app/actions/admin-users";
import { Loader2, ArrowLeft, Pencil, X, Check } from "lucide-react";

export default function AdminPageClient() {
  const [result, setResult] = useState<Awaited<ReturnType<typeof getAdminUsersList>> | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = useCallback(() => {
    getAdminUsersList().then(setResult);
    getAdminBrandsList().then(setBrands);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (user: AdminUserRow) => {
    setEditingUser(user);
    setSelectedBrands([...user.allowedBrands]);
    setSaveError(null);
  };

  const closeEdit = () => {
    setEditingUser(null);
    setSelectedBrands([]);
    setSaveError(null);
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  };

  const handleSave = async () => {
    if (!editingUser) return;
    setSaving(true);
    setSaveError(null);
    const updateResult = await updateUserAllowedBrands(editingUser.id, selectedBrands);
    setSaving(false);
    if (updateResult.ok) {
      closeEdit();
      load();
    } else if ("forbidden" in updateResult && updateResult.forbidden) {
      setSaveError("Δεν έχετε δικαίωμα.");
    } else {
      setSaveError("error" in updateResult ? updateResult.error : "Σφάλμα αποθήκευσης.");
    }
  };

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
          href="/dashboard"
          className="mt-4 inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Πίσω στο Dashboard
        </Link>
      </div>
    );
  }

  if (!result.ok) {
    const message = "error" in result ? result.error : "Σφάλμα φόρτωσης.";
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-red-300">
        {message}
      </div>
    );
  }

  const users = result.data;

  return (
    <>
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">
            Διαχείριση χρηστών
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Όλοι οι εγγεγραμμένοι χρήστες · Επεξεργασία Allowed Brands ανά χρήστη
          </p>
        </div>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Πίσω στο Dashboard
        </Link>
      </header>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
        {users.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            Δεν υπάρχουν εγγεγραμμένοι χρήστες.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Όνομα</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Email</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4">Allowed Brands</th>
                  <th className="px-4 py-3 sm:px-6 sm:py-4 w-24 text-right">Ενέργεια</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="bg-slate-900/30 transition-colors hover:bg-slate-800/40"
                  >
                    <td className="px-4 py-3 text-slate-200 sm:px-6 sm:py-4">
                      {user.name}
                    </td>
                    <td className="px-4 py-3 text-slate-300 sm:px-6 sm:py-4">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 text-slate-400 sm:px-6 sm:py-4">
                      {user.allowedBrands.length === 0
                        ? "—"
                        : user.allowedBrands.join(", ")}
                    </td>
                    <td className="px-4 py-3 text-right sm:px-6 sm:py-4">
                      <button
                        type="button"
                        onClick={() => openEdit(user)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit modal */}
      {editingUser && (
        <>
          <div
            className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm"
            aria-hidden
            onClick={closeEdit}
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Allowed Brands · {editingUser.name}
              </h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">{editingUser.email}</p>

            <div className="mb-4 max-h-64 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3">
              {brands.length === 0 ? (
                <p className="text-sm text-slate-500">Δεν υπάρχουν μάρκες στη βάση.</p>
              ) : (
                <ul className="space-y-2">
                  {brands.map((brand) => (
                    <li key={brand}>
                      <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-700/50">
                        <input
                          type="checkbox"
                          checked={selectedBrands.includes(brand)}
                          onChange={() => toggleBrand(brand)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-blue-500 focus:ring-2 focus:ring-blue-500/40"
                        />
                        <span className="text-sm text-slate-200">{brand}</span>
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {saveError && (
              <p className="mb-4 text-sm text-red-400">{saveError}</p>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
              >
                Ακύρωση
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                Αποθήκευση
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
