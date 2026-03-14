"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Upload, Loader2, Package, Building2, History, Plus, Trash2, Pencil, Check, X, FileInput } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { BrandSelect } from "@/components/admin/BrandSelect";
import { getInventoryStats } from "@/app/actions/orders";
import { getLatestUpdateLog, type LatestUpdateLog } from "@/app/actions/update-log";
import {
  getCategories,
  getBrandsByCategory,
  addBrand,
  updateBrandName,
  updateCategoryName,
  deleteBrand,
  deleteCategory,
  type CategoryRow,
  type BrandRow,
} from "@/app/actions/categories";

export default function AdminInventoryPage() {
  const [stats, setStats] = useState<{ totalParts: number; totalSuppliers: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploadingMaster, setUploadingMaster] = useState(false);
  const [uploadingSupplier, setUploadingSupplier] = useState(false);
  const [supplierName, setSupplierName] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [latestUpdate, setLatestUpdate] = useState<LatestUpdateLog>(null);
  const [newBrandCategoryId, setNewBrandCategoryId] = useState<string>("");
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandLogoUrl, setNewBrandLogoUrl] = useState("");
  const [addingBrand, setAddingBrand] = useState(false);
  const [manageBrandsList, setManageBrandsList] = useState<BrandRow[]>([]);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [editingBrandId, setEditingBrandId] = useState<string | null>(null);
  const [editingBrandName, setEditingBrandName] = useState("");
  const [editingBrandLogoUrl, setEditingBrandLogoUrl] = useState("");
  const [savingBrandId, setSavingBrandId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingCategoryName, setEditingCategoryName] = useState("");
  const [savingCategoryId, setSavingCategoryId] = useState<string | null>(null);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId);
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);
  const canUploadMaster = !!selectedCategoryId && !!selectedBrandId;

  useEffect(() => {
    getInventoryStats().then((data) => {
      setStats(data ?? null);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    if (!selectedCategoryId.trim()) {
      setBrands([]);
      setSelectedBrandId("");
      return;
    }
    getBrandsByCategory(selectedCategoryId).then((list) => {
      setBrands(list);
      setSelectedBrandId("");
    });
  }, [selectedCategoryId]);

  useEffect(() => {
    if (!newBrandCategoryId.trim()) {
      setManageBrandsList([]);
      return;
    }
    getBrandsByCategory(newBrandCategoryId).then(setManageBrandsList);
  }, [newBrandCategoryId]);

  const fetchLatestUpdate = useCallback(async (brandId: string) => {
    if (!brandId.trim()) {
      setLatestUpdate(null);
      return;
    }
    const result = await getLatestUpdateLog(brandId);
    setLatestUpdate(result);
  }, []);

  useEffect(() => {
    fetchLatestUpdate(selectedBrandId);
  }, [selectedBrandId, fetchLatestUpdate]);

  const refreshStats = () => {
    getInventoryStats().then((data) => {
      if (data) setStats(data);
    });
  };

  const handleAddBrand = async () => {
    if (!newBrandCategoryId.trim() || !newBrandName.trim()) {
      alert("Επίλεξε κατηγορία και πληκτρολόγησε όνομα brand.");
      return;
    }
    setAddingBrand(true);
    try {
      const result = await addBrand(newBrandName.trim(), newBrandCategoryId, newBrandLogoUrl.trim() || null);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setNewBrandName("");
      setNewBrandLogoUrl("");
      getBrandsByCategory(newBrandCategoryId).then(setManageBrandsList);
      if (newBrandCategoryId === selectedCategoryId) {
        getBrandsByCategory(selectedCategoryId).then(setBrands);
      }
    } finally {
      setAddingBrand(false);
    }
  };

  const handleEditBrand = (b: BrandRow) => {
    setEditingBrandId(b.id);
    setEditingBrandName(b.name);
    setEditingBrandLogoUrl(b.logoUrl ?? "");
  };

  const handleCancelEditBrand = () => {
    setEditingBrandId(null);
    setEditingBrandName("");
    setEditingBrandLogoUrl("");
  };

  const handleSaveBrandName = async () => {
    if (!editingBrandId || !editingBrandName.trim()) return;
    setSavingBrandId(editingBrandId);
    try {
      const result = await updateBrandName(editingBrandId, editingBrandName.trim(), editingBrandLogoUrl.trim() || null);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setEditingBrandId(null);
      setEditingBrandName("");
      setEditingBrandLogoUrl("");
      if (newBrandCategoryId) getBrandsByCategory(newBrandCategoryId).then(setManageBrandsList);
      if (selectedCategoryId) getBrandsByCategory(selectedCategoryId).then(setBrands);
    } finally {
      setSavingBrandId(null);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!window.confirm("Διαγραφή αυτού του brand; Τα σχετικά UpdateLog θα χάσουν την αναφορά στο brand.")) return;
    setDeletingBrandId(brandId);
    try {
      const result = await deleteBrand(brandId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      if (newBrandCategoryId) getBrandsByCategory(newBrandCategoryId).then(setManageBrandsList);
      if (selectedCategoryId) getBrandsByCategory(selectedCategoryId).then(setBrands);
      if (selectedBrandId === brandId) setSelectedBrandId("");
    } finally {
      setDeletingBrandId(null);
    }
  };

  const handleEditCategory = (c: CategoryRow) => {
    setEditingCategoryId(c.id);
    setEditingCategoryName(c.name);
  };

  const handleCancelEditCategory = () => {
    setEditingCategoryId(null);
    setEditingCategoryName("");
  };

  const handleSaveCategoryName = async () => {
    if (!editingCategoryId || !editingCategoryName.trim()) return;
    setSavingCategoryId(editingCategoryId);
    try {
      const result = await updateCategoryName(editingCategoryId, editingCategoryName.trim());
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setEditingCategoryId(null);
      setEditingCategoryName("");
      getCategories().then(setCategories);
    } finally {
      setSavingCategoryId(null);
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!window.confirm("Διαγραφή κατηγορίας; Θα διαγραφούν και όλα τα brands της. Οι εγγραφές UpdateLog θα παραμείνουν με κατηγορία/brand null.")) return;
    setDeletingCategoryId(categoryId);
    try {
      const result = await deleteCategory(categoryId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      getCategories().then(setCategories);
      if (selectedCategoryId === categoryId) {
        setSelectedCategoryId("");
        setBrands([]);
        setSelectedBrandId("");
      }
      if (newBrandCategoryId === categoryId) {
        setNewBrandCategoryId("");
        setManageBrandsList([]);
      }
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const handleUploadMaster = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file || !canUploadMaster || !selectedCategory || !selectedBrand) return;
    try {
      setUploadingMaster(true);
      const formData = new FormData();
      formData.append("file", file);
      formData.append("categoryId", selectedCategoryId);
      formData.append("categoryName", selectedCategory.name);
      formData.append("brandId", selectedBrandId);
      formData.append("brandName", selectedBrand.name);
      const res = await fetch("/api/import-master", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Αποτυχία ενημέρωσης τιμοκαταλόγου.");
      }
      alert(`Ενημερώθηκαν ${data.count} κωδικοί από τον τιμοκατάλογο.`);
      refreshStats();
      await fetchLatestUpdate(selectedBrandId);
    } catch (err) {
      console.error(err);
      alert("Αποτυχία ενημέρωσης τιμοκαταλόγου.");
    } finally {
      setUploadingMaster(false);
      e.target.value = "";
    }
  };

  const handleUploadSupplier = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!supplierName.trim()) {
      alert("Συμπλήρωσε όνομα προμηθευτή πριν την εισαγωγή.");
      e.target.value = "";
      return;
    }
    try {
      setUploadingSupplier(true);
      const formData = new FormData();
      formData.append("supplierName", supplierName.trim());
      formData.append("file", file);
      const res = await fetch("/api/import-supplier", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Αποτυχία ενημέρωσης αποθέματος.");
      }
      alert(
        `Ενημερώθηκαν ${data.count} εγγραφές αποθέματος για τον προμηθευτή ${data.supplierName}.`,
      );
      refreshStats();
    } catch (err) {
      console.error(err);
      alert("Αποτυχία ενημέρωσης αποθέματος προμηθευτή.");
    } finally {
      setUploadingSupplier(false);
      e.target.value = "";
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-semibold sm:text-xl">Απόθεμα (Inventory)</h1>
        <Link
          href="/admin/inventory/universal-import"
          className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-700 hover:text-slate-200"
        >
          <FileInput className="h-4 w-4" />
          Universal Import
        </Link>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4 sm:space-y-8 sm:p-6">
        {/* Top: Catalog Stats */}
        <section>
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-slate-500">
            Κατάσταση καταλόγου
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-violet-500/40 bg-violet-500/20 text-violet-400">
                  <Package className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Σύνολο κωδικών (Parts)
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {loading ? "—" : stats != null ? stats.totalParts.toLocaleString() : "—"}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 transition-colors hover:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-rose-500/40 bg-rose-500/20 text-rose-400">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    Σύνολο προμηθευτών
                  </p>
                  <p className="text-2xl font-semibold text-white">
                    {loading ? "—" : stats?.totalSuppliers ?? "—"}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Manage Brands */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Διαχείριση Brands
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Επίλεξε κατηγορία και πληκτρολόγησε το όνομα του brand για να το προσθέσεις.
          </p>
          <div className="flex max-w-md flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <div className="w-full sm:min-w-[140px] sm:flex-1">
              <label htmlFor="new-brand-category" className="mb-1.5 block text-xs font-medium text-slate-500">
                Κατηγορία
              </label>
              <select
                id="new-brand-category"
                value={newBrandCategoryId}
                onChange={(e) => setNewBrandCategoryId(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="">Επίλεξε...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="w-full sm:min-w-[140px] sm:flex-1">
              <label htmlFor="new-brand-name" className="mb-1.5 block text-xs font-medium text-slate-500">
                Όνομα brand
              </label>
              <input
                id="new-brand-name"
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                placeholder="π.χ. VW, AUDI"
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="w-full sm:min-w-[200px] sm:flex-1">
              <label htmlFor="new-brand-logo" className="mb-1.5 block text-xs font-medium text-slate-500">
                Logo URL (προαιρετικό)
              </label>
              <input
                id="new-brand-logo"
                type="url"
                value={newBrandLogoUrl}
                onChange={(e) => setNewBrandLogoUrl(e.target.value)}
                placeholder="https://..."
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddBrand}
              disabled={addingBrand || !newBrandCategoryId.trim() || !newBrandName.trim()}
              className="flex w-full min-h-[44px] items-center justify-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50 sm:w-auto"
            >
              {addingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Προσθήκη
            </button>
          </div>
          {newBrandCategoryId && (
            <div className="mt-4 w-full max-w-2xl overflow-x-auto">
              <p className="mb-2 text-xs font-medium text-slate-500">Brands στην κατηγορία</p>
              {manageBrandsList.length === 0 ? (
                <p className="text-sm text-slate-500">Δεν υπάρχουν ακόμα brands.</p>
              ) : (
                <table className="w-full min-w-[400px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-700 text-xs font-medium uppercase text-slate-500">
                      <th className="py-2 pr-3">Logo</th>
                      <th className="py-2 pr-3">Όνομα</th>
                      <th className="py-2 pr-3">Logo URL</th>
                      <th className="w-24 py-2 text-right">Ενέργειες</th>
                    </tr>
                  </thead>
                  <tbody>
                    {manageBrandsList.map((b) => (
                      <tr
                        key={b.id}
                        className="border-b border-slate-700/60 last:border-0"
                      >
                        <td className="py-2 pr-3">
                          <BrandLogo logoUrl={b.logoUrl} name={b.name} size={24} />
                        </td>
                        <td className="py-2 pr-3">
                          {editingBrandId === b.id ? (
                            <input
                              type="text"
                              value={editingBrandName}
                              onChange={(e) => setEditingBrandName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveBrandName();
                                if (e.key === "Escape") handleCancelEditBrand();
                              }}
                              className="w-full min-w-0 max-w-[140px] rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100 outline-none focus:border-blue-500"
                              autoFocus
                              aria-label="Νέο όνομα brand"
                            />
                          ) : (
                            <span className="font-medium text-slate-200">{b.name}</span>
                          )}
                        </td>
                        <td className="py-2 pr-3">
                          {editingBrandId === b.id ? (
                            <input
                              type="url"
                              value={editingBrandLogoUrl}
                              onChange={(e) => setEditingBrandLogoUrl(e.target.value)}
                              placeholder="https://..."
                              className="w-full min-w-0 max-w-[200px] rounded border border-slate-600 bg-slate-800 px-2 py-1 text-xs text-slate-100 placeholder-slate-500 outline-none focus:border-blue-500"
                              aria-label="Logo URL"
                            />
                          ) : (
                            <span className="truncate text-xs text-slate-500 max-w-[180px] block">
                              {b.logoUrl ? "Ορισμένο" : "—"}
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-right">
                          {editingBrandId === b.id ? (
                            <div className="flex justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={handleSaveBrandName}
                                disabled={savingBrandId === b.id || !editingBrandName.trim()}
                                title="Αποθήκευση"
                                className="rounded p-1 text-emerald-400/90 hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-50"
                                aria-label="Αποθήκευση"
                              >
                                {savingBrandId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelEditBrand}
                                disabled={savingBrandId === b.id}
                                title="Ακύρωση"
                                className="rounded p-1 text-slate-400 hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50"
                                aria-label="Ακύρωση"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex justify-end gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleEditBrand(b)}
                                disabled={!!editingBrandId || deletingBrandId === b.id}
                                title="Επεξεργασία"
                                className="rounded p-1 text-slate-400 hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50"
                                aria-label={`Επεξεργασία ${b.name}`}
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteBrand(b.id)}
                                disabled={deletingBrandId === b.id || !!editingBrandId}
                                title="Διαγραφή brand"
                                className="rounded p-1 text-red-400/90 hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                                aria-label={`Διαγραφή ${b.name}`}
                              >
                                {deletingBrandId === b.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </section>

        {/* Manage Categories */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Διαχείριση Κατηγοριών
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Οι κύριες κατηγορίες (AUTO, TRUCKS, MOTO, MARINE) μπορούν να διαγραφούν. Η διαγραφή κατηγορίας διαγράφει και όλα τα brands της.
          </p>
          <div className="w-full max-w-md">
            <ul className="space-y-1.5 rounded-lg border border-slate-700/80 bg-slate-800/40 p-2">
              {categories.map((c) => (
                <li
                  key={c.id}
                  className="flex items-center justify-between gap-2 rounded px-2 py-1.5 text-sm text-slate-200 transition-colors hover:bg-slate-700/50"
                >
                  {editingCategoryId === c.id ? (
                    <>
                      <input
                        type="text"
                        value={editingCategoryName}
                        onChange={(e) => setEditingCategoryName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveCategoryName();
                          if (e.key === "Escape") handleCancelEditCategory();
                        }}
                        className="min-w-0 flex-1 rounded border border-slate-600 bg-slate-800 px-2 py-1 text-slate-100 outline-none transition-colors focus:border-blue-500"
                        autoFocus
                        aria-label="Νέο όνομα κατηγορίας"
                      />
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={handleSaveCategoryName}
                          disabled={savingCategoryId === c.id || !editingCategoryName.trim()}
                          title="Αποθήκευση"
                          className="rounded p-1 text-emerald-400/90 transition-colors hover:bg-emerald-500/20 hover:text-emerald-300 disabled:opacity-50"
                          aria-label="Αποθήκευση"
                        >
                          {savingCategoryId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Check className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditCategory}
                          disabled={savingCategoryId === c.id}
                          title="Ακύρωση"
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50"
                          aria-label="Ακύρωση"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="min-w-0 flex-1 truncate">{c.name}</span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => handleEditCategory(c)}
                          disabled={!!editingCategoryId || deletingCategoryId === c.id}
                          title="Επεξεργασία"
                          className="rounded p-1 text-slate-400 transition-colors hover:bg-slate-600 hover:text-slate-200 disabled:opacity-50"
                          aria-label={`Επεξεργασία ${c.name}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(c.id)}
                          disabled={deletingCategoryId === c.id || !!editingCategoryId}
                          title="Διαγραφή κατηγορίας"
                          className="rounded p-1 text-red-400/90 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50"
                          aria-label={`Διαγραφή ${c.name}`}
                        >
                          {deletingCategoryId === c.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Master Catalog Update */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Master Catalog Update
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Επίλεξε κατηγορία και brand, μετά φόρτωσε XML (ean, name, price). Ενημερώνει τον κεντρικό τιμοκατάλογο.
          </p>

          {/* 1st: Category */}
          <div className="mb-4 w-full max-w-md">
            <label htmlFor="master-category" className="mb-1.5 block text-xs font-medium text-slate-500">
              Κατηγορία <span className="text-amber-500/80">*</span>
            </label>
            <select
              id="master-category"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
            >
              <option value="">Επίλεξε κατηγορία...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* 2nd: Brand (filtered by category) */}
          <div className="mb-4 w-full max-w-md">
            <BrandSelect
              id="master-brand"
              brands={brands}
              selectedBrandId={selectedBrandId}
              onSelect={setSelectedBrandId}
              disabled={!selectedCategoryId}
              placeholder="Επίλεξε brand..."
              label={
                <>
                  Brand <span className="text-amber-500/80">*</span>
                </>
              }
              listMaxHeight={240}
            />
          </div>

          {/* Latest Update (for selected brand) */}
          {selectedBrandId && selectedBrand && (
            <div className="mb-4">
              {latestUpdate ? (
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/80 bg-slate-800/50 px-3 py-2 text-xs text-slate-500 shadow-sm">
                  <History className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>
                    Τελευταία ενημέρωση {latestUpdate.categoryName ?? selectedCategory?.name} / {latestUpdate.brandName ?? selectedBrand.name}:{" "}
                    <span className="text-slate-400">
                      {new Date(latestUpdate.createdAt).toLocaleString("el-GR", {
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    {" · "}από {latestUpdate.userName}
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 rounded-lg border border-slate-700/60 bg-slate-800/40 px-3 py-2 text-xs text-slate-500">
                  <History className="h-4 w-4 shrink-0 text-slate-500" />
                  <span>Δεν υπάρχει ακόμα ενημέρωση για {selectedBrand.name}.</span>
                </div>
              )}
            </div>
          )}

          <label
            className={`flex w-full max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
              canUploadMaster && !uploadingMaster
                ? "cursor-pointer border-slate-700 bg-slate-800/50 text-slate-300 hover:border-blue-500/50 hover:bg-slate-800"
                : "cursor-not-allowed border-slate-700/80 bg-slate-800/40 text-slate-500 opacity-70"
            }`}
          >
            {uploadingMaster ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-blue-400" />
            ) : (
              <Upload className="h-5 w-5 shrink-0 text-blue-400" />
            )}
            <span>
              {uploadingMaster
                ? "Φόρτωση..."
                : !canUploadMaster
                  ? "Επίλεξε κατηγορία και brand για να ανεβάσεις XML"
                  : "Επιλογή XML Master Catalog"}
            </span>
            <input
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleUploadMaster}
              disabled={uploadingMaster || !canUploadMaster}
            />
          </label>
        </section>

        {/* Bottom: Supplier Stock Update */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Supplier Stock Update
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Φόρτωσε XML αποθέματος προμηθευτή (ean, price, quantity). Όνομα
            προμηθευτή υποχρεωτικό.
          </p>
          <input
            type="text"
            placeholder="Όνομα προμηθευτή (π.χ. Volvo Dealer)"
            value={supplierName}
            onChange={(e) => setSupplierName(e.target.value)}
            className="mb-4 w-full max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
          />
          <label className="flex w-full max-w-md cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-emerald-500/50 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50">
            {uploadingSupplier ? (
              <Loader2 className="h-5 w-5 shrink-0 animate-spin text-emerald-400" />
            ) : (
              <Upload className="h-5 w-5 shrink-0 text-emerald-400" />
            )}
            <span>
              {uploadingSupplier
                ? "Φόρτωση..."
                : "Επιλογή XML Αποθέματος"}
            </span>
            <input
              type="file"
              accept=".xml"
              className="hidden"
              onChange={handleUploadSupplier}
              disabled={uploadingSupplier}
            />
          </label>
        </section>
      </main>
    </>
  );
}
