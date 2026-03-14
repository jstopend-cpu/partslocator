"use client";

import React, { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Upload,
  Loader2,
  ArrowLeft,
  FileText,
  Save,
  CheckCircle,
} from "lucide-react";
import { BrandSelect } from "@/components/admin/BrandSelect";
import { getAllBrands, type BrandRow } from "@/app/actions/categories";

const SYSTEM_FIELDS = [
  { key: "partNumber", label: "Part Number" },
  { key: "name", label: "Name" },
  { key: "brand", label: "Brand" },
  { key: "category", label: "Category" },
  { key: "purchasePrice", label: "Purchase Price" },
  { key: "retailPrice", label: "Retail Price" },
] as const;

type MappingState = Partial<Record<(typeof SYSTEM_FIELDS)[number]["key"], string>>;

export default function InventoryUniversalImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileType, setFileType] = useState<"csv" | "xml" | "">("");
  const [mapping, setMapping] = useState<MappingState>({});
  const [priceMultiplier, setPriceMultiplier] = useState("1");
  const [defaultBrandId, setDefaultBrandId] = useState("");
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [profileName, setProfileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    getAllBrands().then(setBrands);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f && (f.name.toLowerCase().endsWith(".csv") || f.name.toLowerCase().endsWith(".xml"))) {
        setFile(f);
        setError(null);
        setSuccess(null);
        setHeaders([]);
        setFileType("");
      } else {
        setError("Please upload a CSV or XML file.");
      }
    },
    []
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f && (f.name.toLowerCase().endsWith(".csv") || f.name.toLowerCase().endsWith(".xml"))) {
      setFile(f);
      setError(null);
      setSuccess(null);
      setHeaders([]);
      setFileType("");
    } else if (f) {
      setError("Please choose a CSV or XML file.");
    }
    e.target.value = "";
  }, []);

  const detectHeaders = useCallback(async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/universal-import/preview", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to read file");
      const type = (data.fileType ?? "").toLowerCase();
      if (type !== "csv" && type !== "xml") {
        throw new Error("Only CSV and XML are supported on this page.");
      }
      setHeaders(data.headers ?? []);
      setFileType(type as "csv" | "xml");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not detect headers");
    } finally {
      setLoading(false);
    }
  }, [file]);

  const handleSaveProfile = useCallback(async () => {
    const name = profileName.trim();
    if (!name) {
      setError("Enter a profile name (e.g. Intercars-Mapping).");
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch("/api/import-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          targetTable: "MASTER_CATALOG",
          fileType: fileType.toUpperCase(),
          mapping: mapping as Record<string, string>,
          config: {
            priceMultiplier: Number(priceMultiplier) || 1,
            defaultBrand: (brands.find((b) => b.id === defaultBrandId)?.name?.trim()) || undefined,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      setSuccess(`Profile "${name}" saved.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }, [profileName, fileType, mapping, priceMultiplier, defaultBrandId, brands]);

  const hasHeaders = headers.length > 0;

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" />
            Απόθεμα
          </Link>
          <h1 className="text-lg font-semibold sm:text-xl">Universal Import</h1>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 p-4 sm:p-6">
        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            {success}
          </div>
        )}

        {/* File Upload */}
        <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
          <h2 className="mb-2 text-lg font-semibold text-slate-200">File Upload</h2>
          <p className="mb-4 text-sm text-slate-500">
            Upload a CSV or XML file. After upload, click &quot;Detect headers&quot; to parse the first rows and extract column names or tags.
          </p>
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-10 transition-colors hover:border-slate-600 hover:bg-slate-800/70"
          >
            <FileText className="h-12 w-12 text-slate-500" />
            <div className="text-center text-sm text-slate-400">
              {file ? (
                <span className="font-mono text-slate-300">{file.name}</span>
              ) : (
                "Drag and drop a CSV or XML file here, or click to choose"
              )}
            </div>
            <label className="cursor-pointer rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600">
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Choose file
              </span>
              <input
                type="file"
                accept=".csv,.xml"
                className="hidden"
                onChange={handleFileSelect}
              />
            </label>
            {file && !hasHeaders && (
              <button
                type="button"
                onClick={detectHeaders}
                disabled={loading}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/20 px-4 py-2 text-sm font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Detect headers"
                )}
              </button>
            )}
          </div>
        </section>

        {/* Mapping Table */}
        {hasHeaders && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Mapping</h2>
            <p className="mb-4 text-sm text-slate-500">
              Map each system field to a column (or tag) from your file.
            </p>
            <div className="overflow-hidden rounded-lg border border-slate-700">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/70 text-left text-xs font-medium uppercase tracking-wider text-slate-400">
                    <th className="px-4 py-3">System field</th>
                    <th className="px-4 py-3">File column / tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {SYSTEM_FIELDS.map(({ key, label }) => (
                    <tr key={key} className="bg-slate-900/30">
                      <td className="px-4 py-3 font-medium text-slate-200">{label}</td>
                      <td className="px-4 py-3">
                        <select
                          value={mapping[key] ?? ""}
                          onChange={(e) =>
                            setMapping((m) => ({ ...m, [key]: e.target.value }))
                          }
                          className="w-full max-w-xs rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200 focus:border-blue-500 focus:outline-none"
                        >
                          <option value="">— Not mapped —</option>
                          {headers.map((h) => (
                            <option key={h} value={h}>
                              {h}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Settings */}
        {hasHeaders && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Settings</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Price multiplier
                </label>
                <input
                  type="number"
                  min="0.01"
                  max="100"
                  step="0.01"
                  value={priceMultiplier}
                  onChange={(e) => setPriceMultiplier(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="1.25"
                />
                <p className="mt-1 text-xs text-slate-500">
                  e.g. 1.25 = +25% on prices
                </p>
              </div>
              <div>
                <BrandSelect
                  id="default-brand"
                  brands={brands}
                  selectedBrandId={defaultBrandId}
                  onSelect={setDefaultBrandId}
                  placeholder="Optional default brand (when not in file)"
                  label="Fixed value (default brand)"
                  listMaxHeight={240}
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used when brand is not in the file
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Save Profile */}
        {hasHeaders && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">Save profile</h2>
            <p className="mb-4 text-sm text-slate-500">
              Save this mapping and settings as a named profile to reuse later (e.g. &quot;Intercars-Mapping&quot;).
            </p>
            <div className="flex flex-wrap items-end gap-3">
              <div className="min-w-[200px] flex-1">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Profile name
                </label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Intercars-Mapping"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveProfile}
                disabled={saving}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2.5 text-sm font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save profile
              </button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
