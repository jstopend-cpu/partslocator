"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Upload, Loader2, Package, Building2, History, Plus } from "lucide-react";
import { getInventoryStats } from "@/app/actions/orders";
import { getLatestUpdateLog, type LatestUpdateLog } from "@/app/actions/update-log";
import {
  getCategories,
  getBrandsByCategory,
  addBrand,
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
  const [addingBrand, setAddingBrand] = useState(false);

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
      const result = await addBrand(newBrandName.trim(), newBrandCategoryId);
      if (!result.ok) {
        alert(result.error);
        return;
      }
      setNewBrandName("");
      if (newBrandCategoryId === selectedCategoryId) {
        getBrandsByCategory(selectedCategoryId).then(setBrands);
      }
    } finally {
      setAddingBrand(false);
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
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/98 px-6 py-4">
        <h1 className="text-xl font-semibold">Απόθεμα (Inventory)</h1>
      </header>

      <main className="mx-auto max-w-4xl space-y-8 p-6">
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
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Διαχείριση Brands
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Επίλεξε κατηγορία και πληκτρολόγησε το όνομα του brand για να το προσθέσεις.
          </p>
          <div className="flex max-w-md flex-wrap items-end gap-3">
            <div className="min-w-[140px] flex-1">
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
            <div className="min-w-[140px] flex-1">
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
            <button
              type="button"
              onClick={handleAddBrand}
              disabled={addingBrand || !newBrandCategoryId.trim() || !newBrandName.trim()}
              className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-slate-600 disabled:opacity-50"
            >
              {addingBrand ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Προσθήκη
            </button>
          </div>
        </section>

        {/* Master Catalog Update */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">
            Master Catalog Update
          </h2>
          <p className="mb-4 text-sm text-slate-500">
            Επίλεξε κατηγορία και brand, μετά φόρτωσε XML (ean, name, price). Ενημερώνει τον κεντρικό τιμοκατάλογο.
          </p>

          {/* 1st: Category */}
          <div className="mb-4 max-w-md">
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
          <div className="mb-4 max-w-md">
            <label htmlFor="master-brand" className="mb-1.5 block text-xs font-medium text-slate-500">
              Brand <span className="text-amber-500/80">*</span>
            </label>
            <select
              id="master-brand"
              value={selectedBrandId}
              onChange={(e) => setSelectedBrandId(e.target.value)}
              disabled={!selectedCategoryId}
              className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-60"
            >
              <option value="">Επίλεξε brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
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
            className={`flex max-w-md items-center gap-3 rounded-lg border px-4 py-3 text-sm transition-colors ${
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
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
            className="mb-4 max-w-md rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 outline-none focus:border-emerald-500"
          />
          <label className="flex max-w-md cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-300 transition-colors hover:border-emerald-500/50 hover:bg-slate-800 disabled:pointer-events-none disabled:opacity-50">
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
