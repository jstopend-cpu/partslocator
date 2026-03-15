"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getAdminUsersList,
  getAdminBrandsList,
  getAdminStats,
  getPendingInvitations,
  createInvitation,
  syncPendingInvitations,
  updateUserMetadata,
  type AdminUserRow,
  type AdminStats,
  type AdminRole,
} from "@/app/actions/admin-users";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Loader2, ArrowLeft, Pencil, X, Check, Users, Search, TrendingUp, UserPlus } from "lucide-react";

const CHART_COLOR = "#3b82f6";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner" },
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
  { value: "customer", label: "Customer" },
] as const;

const INVITE_ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "support", label: "Support" },
  { value: "customer", label: "Member" },
] as const;

function RoleBadge({ role }: { role: string }) {
  const styles: Record<string, string> = {
    owner: "bg-red-500/20 text-red-300 border-red-500/40",
    admin: "bg-blue-500/20 text-blue-300 border-blue-500/40",
    support: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    customer: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  };
  const label = ROLE_OPTIONS.find((r) => r.value === role)?.label ?? role || "—";
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${styles[role] ?? "bg-slate-700/50 text-slate-400 border-slate-600/50"}`}
    >
      {label}
    </span>
  );
}

type Props = { currentRole: AdminRole };

export default function AdminPageClient({ currentRole }: Props) {
  const [usersResult, setUsersResult] = useState<Awaited<ReturnType<typeof getAdminUsersList>> | null>(null);
  const [statsResult, setStatsResult] = useState<Awaited<ReturnType<typeof getAdminStats>> | null>(null);
  const [pendingResult, setPendingResult] = useState<Awaited<ReturnType<typeof getPendingInvitations>> | null>(null);
  const [brands, setBrands] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<AdminUserRow | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [editRole, setEditRole] = useState<string>("customer");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("customer");
  const [inviteSending, setInviteSending] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [roleUpdatingId, setRoleUpdatingId] = useState<string | null>(null);

  const canEditRoles = currentRole === "owner" || currentRole === "admin";
  const canAddMember = currentRole === "owner" || currentRole === "admin";

  const load = useCallback(() => {
    syncPendingInvitations().then(() => {
      getAdminUsersList().then(setUsersResult);
      getPendingInvitations().then(setPendingResult);
    });
    getAdminBrandsList().then(setBrands);
    getAdminStats().then(setStatsResult);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openEdit = (user: AdminUserRow) => {
    if (!canEditRoles) return;
    setEditingUser(user);
    setSelectedBrands([...user.allowedBrands]);
    setEditRole(user.isOwner ? "owner" : (user.role || "customer"));
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
    if (!editingUser || editingUser.isOwner) return;
    setSaving(true);
    setSaveError(null);
    const roleToSave = editRole === "owner" ? "admin" : editRole;
    const updateResult = await updateUserMetadata(editingUser.id, {
      role: roleToSave,
      allowedBrands: selectedBrands,
    });
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

  const handleRoleChange = async (userId: string, newRole: string) => {
    const user = usersResult?.ok ? usersResult.data.find((u) => u.id === userId) : null;
    if (!user || user.isOwner) return;
    if (user.role === "admin" && currentRole !== "owner") return;
    setRoleUpdatingId(userId);
    const res = await updateUserMetadata(userId, {
      role: newRole === "owner" ? "admin" : newRole,
      allowedBrands: user.allowedBrands,
    });
    setRoleUpdatingId(null);
    if (res.ok) load();
  };

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError(null);
    setInviteSending(true);
    const res = await createInvitation(inviteEmail.trim(), inviteRole);
    setInviteSending(false);
    if (res.ok) {
      setAddMemberOpen(false);
      setInviteEmail("");
      setInviteRole("customer");
      load();
    } else if ("forbidden" in res && res.forbidden) {
      setInviteError("Δεν έχετε δικαίωμα.");
    } else {
      setInviteError("error" in res ? res.error : "Σφάλμα.");
    }
  };

  if (usersResult === null || statsResult === null) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!usersResult.ok && "forbidden" in usersResult && usersResult.forbidden) {
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

  if (!usersResult.ok) {
    const message = "error" in usersResult ? usersResult.error : "Σφάλμα φόρτωσης.";
    return (
      <div className="rounded-xl border border-red-900/50 bg-red-950/20 p-4 text-red-300">
        {message}
      </div>
    );
  }

  const users = usersResult.data;
  const stats = statsResult.ok ? statsResult.data : null;
  const pending = pendingResult?.ok ? pendingResult.data : [];

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">Admin Panel</h1>
          <p className="mt-1 text-sm text-slate-400">
            Στατιστικά, ομάδα και ιστορικό αναζητήσεων
          </p>
        </div>
        <div className="flex items-center gap-2">
          {canAddMember && (
            <button
              type="button"
              onClick={() => setAddMemberOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-500"
            >
              <UserPlus className="h-4 w-4" />
              Προσθήκη Μέλους Ομάδας
            </button>
          )}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Πίσω στο Dashboard
          </Link>
        </div>
      </header>

      {/* Statistics cards */}
      {stats && (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Users className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Σύνολο χρηστών</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stats.totalUsers}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Αναζητήσεις σήμερα</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stats.searchesToday}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <Search className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Αναζητήσεις (μήνας)</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-white">{stats.searchesMonth}</p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
            <div className="flex items-center gap-2 text-slate-400">
              <TrendingUp className="h-5 w-5" />
              <span className="text-xs font-medium uppercase tracking-wider">Δημοφιλέστερη μάρκα</span>
            </div>
            <p className="mt-2 text-lg font-bold text-white truncate" title={stats.mostPopularBrand}>
              {stats.mostPopularBrand}
            </p>
          </div>
        </section>
      )}

      {/* Bar chart */}
      {stats && stats.searchesByDay.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Αναζητήσεις ανά ημέρα (τελευταίες 14)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.searchesByDay} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 10 }} tickFormatter={(v) => v.slice(5)} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    color: "#e2e8f0",
                  }}
                  labelFormatter={(v) => v}
                />
                <Bar dataKey="count" name="Αναζητήσεις" radius={[4, 4, 0, 0]}>
                  {stats.searchesByDay.map((_, i) => (
                    <Cell key={i} fill={CHART_COLOR} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      )}

      {/* Pending invitations */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Εκκρεμείς προσκλήσεις
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Email</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Ρόλος</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Ημερομηνία</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {pending.map((inv) => (
                    <tr key={inv.id} className="bg-slate-900/30 hover:bg-slate-800/40">
                      <td className="px-4 py-3 text-slate-200 sm:px-6 sm:py-4">{inv.email}</td>
                      <td className="px-4 py-3 sm:px-6 sm:py-4">
                        <RoleBadge role={inv.role} />
                      </td>
                      <td className="px-4 py-3 text-slate-400 sm:px-6 sm:py-4">
                        {new Date(inv.createdAt).toLocaleString("el-GR", { dateStyle: "short", timeStyle: "short" })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* User management */}
      <section>
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
          Διαχείριση χρηστών & ρόλοι
        </h2>
        <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
          {users.length === 0 ? (
            <div className="py-12 text-center text-slate-500">Δεν υπάρχουν εγγεγραμμένοι χρήστες.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Όνομα</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Email</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Role</th>
                    <th className="px-4 py-3 sm:px-6 sm:py-4">Allowed Brands</th>
                    {canEditRoles && (
                      <th className="px-4 py-3 sm:px-6 sm:py-4 w-24 text-right">Ενέργεια</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((user) => {
                    const canChangeRole =
                      canEditRoles &&
                      !user.isOwner &&
                      (user.role !== "admin" || currentRole === "owner");
                    return (
                      <tr key={user.id} className="bg-slate-900/30 transition-colors hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-200 sm:px-6 sm:py-4">{user.name}</td>
                        <td className="px-4 py-3 text-slate-300 sm:px-6 sm:py-4">{user.email}</td>
                        <td className="px-4 py-3 sm:px-6 sm:py-4">
                          {user.isOwner || !canChangeRole ? (
                            <RoleBadge role={user.role} />
                          ) : (
                            <select
                              value={user.role}
                              disabled={roleUpdatingId === user.id}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                              className="rounded-lg border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/40"
                            >
                              {ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => (
                                <option key={r.value} value={r.value}>
                                  {r.label}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 sm:px-6 sm:py-4">
                          {user.allowedBrands.length === 0 ? "—" : user.allowedBrands.join(", ")}
                        </td>
                        {canEditRoles && (
                          <td className="px-4 py-3 text-right sm:px-6 sm:py-4">
                            <button
                              type="button"
                              onClick={() => openEdit(user)}
                              disabled={user.isOwner}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-600 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-300 disabled:opacity-50 disabled:pointer-events-none"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                              Edit
                            </button>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Activity log - visible to all including Support */}
      {stats && (
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">
            Ιστορικό αναζητήσεων (τελευταίες 10)
          </h2>
          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            {stats.recentSearches.length === 0 ? (
              <div className="py-8 text-center text-slate-500">Δεν υπάρχουν καταγεγραμμένες αναζητήσεις.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-800/60 text-xs font-medium uppercase tracking-wider text-slate-400">
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Χρήστης (email)</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Αναζήτηση</th>
                      <th className="px-4 py-3 sm:px-6 sm:py-4">Ημερομηνία</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {stats.recentSearches.map((row, i) => (
                      <tr key={i} className="bg-slate-900/30 hover:bg-slate-800/40">
                        <td className="px-4 py-3 text-slate-300 sm:px-6 sm:py-4">{row.userEmail || "—"}</td>
                        <td className="px-4 py-3 text-slate-200 sm:px-6 sm:py-4">{row.query}</td>
                        <td className="px-4 py-3 text-slate-400 sm:px-6 sm:py-4">
                          {new Date(row.createdAt).toLocaleString("el-GR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Add member modal */}
      {addMemberOpen && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" aria-hidden onClick={() => setAddMemberOpen(false)} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Προσθήκη Μέλους Ομάδας</h2>
              <button
                type="button"
                onClick={() => setAddMemberOpen(false)}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">
              Εισάγετε email και ρόλο. Θα ενημερωθεί όταν ο χρήστης εγγραφεί.
            </p>
            <form onSubmit={handleInviteSubmit} className="space-y-4">
              <div>
                <label htmlFor="invite-email" className="mb-1 block text-xs font-medium text-slate-400">
                  Email
                </label>
                <input
                  id="invite-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="email@example.com"
                  required
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                />
              </div>
              <div>
                <label htmlFor="invite-role" className="mb-1 block text-xs font-medium text-slate-400">
                  Ρόλος
                </label>
                <select
                  id="invite-role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {INVITE_ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
              {inviteError && <p className="text-sm text-red-400">{inviteError}</p>}
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAddMemberOpen(false)}
                  className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-700"
                >
                  Ακύρωση
                </button>
                <button
                  type="submit"
                  disabled={inviteSending}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                >
                  {inviteSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Δημιουργία πρόσκλησης
                </button>
              </div>
            </form>
          </div>
        </>
      )}

      {/* Edit modal */}
      {editingUser && (
        <>
          <div className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-sm" aria-hidden onClick={closeEdit} />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Επεξεργασία · {editingUser.name}</h2>
              <button
                type="button"
                onClick={closeEdit}
                className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                aria-label="Κλείσιμο"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <p className="mb-4 text-sm text-slate-400">{editingUser.email}</p>

            {!editingUser.isOwner && (
              <div className="mb-4">
                <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                  Ρόλος
                </label>
                <select
                  value={editRole === "owner" ? "admin" : editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                >
                  {ROLE_OPTIONS.filter((r) => r.value !== "owner").map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-slate-500">Allowed Brands</p>
              <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-700 bg-slate-800/50 p-3">
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
            </div>

            {saveError && <p className="mb-4 text-sm text-red-400">{saveError}</p>}

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
                disabled={saving || editingUser.isOwner}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                Αποθήκευση
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
