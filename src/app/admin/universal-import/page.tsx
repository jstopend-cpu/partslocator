"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Upload,
  Loader2,
  ArrowRight,
  ArrowLeft,
  Save,
  FileSpreadsheet,
  Map,
  Settings,
  CheckCircle,
  Trash2,
} from "lucide-react";
import type { FieldMapping } from "@/lib/universal-import/parse";

const DB_FIELDS_MASTER: { key: keyof FieldMapping; label: string; required: boolean }[] = [
  { key: "partNumber", label: "Part Number", required: true },
  { key: "name", label: "Name", required: true },
  { key: "brand", label: "Brand", required: true },
  { key: "price", label: "Price (MSRP)", required: true },
];

const DB_FIELDS_SUPPLIER: { key: keyof FieldMapping; label: string; required: boolean }[] = [
  { key: "partNumber", label: "Part Number", required: true },
  { key: "price", label: "Supplier Price", required: true },
  { key: "quantity", label: "Quantity", required: false },
  { key: "name", label: "Name (optional)", required: false },
  { key: "brand", label: "Brand (optional)", required: false },
];

const CHUNK_SIZE = 300;

type ImportProfileRow = {
  id: string;
  name: string;
  targetTable: string;
  mapping: Record<string, string>;
  defaultPriceMultiplier: number;
  updateExisting: boolean;
  supplierName: string | null;
};

export default function UniversalImportPage() {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [fileType, setFileType] = useState<string>("");
  const [targetTable, setTargetTable] = useState<"MASTER" | "SUPPLIER">("MASTER");
  const [mapping, setMapping] = useState<FieldMapping>({});
  const [priceMultiplier, setPriceMultiplier] = useState<string>("1");
  const [updateExisting, setUpdateExisting] = useState(true);
  const [supplierName, setSupplierName] = useState("");
  const [profileName, setProfileName] = useState("");
  const [profiles, setProfiles] = useState<ImportProfileRow[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [importSummary, setImportSummary] = useState<{
    created: number;
    updated: number;
    errors: number;
    totalRows: number;
  } | null>(null);
  const [processedRows, setProcessedRows] = useState(0);
  const [totalRowsForImport, setTotalRowsForImport] = useState(0);
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0);
  const [totalChunksForImport, setTotalChunksForImport] = useState(0);

  const fetchProfiles = useCallback(async () => {
    try {
      const res = await fetch("/api/import-profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch {
      setProfiles([]);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/universal-import/preview", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Preview failed");
      setFile(f);
      setHeaders(data.headers ?? []);
      setFileType(data.fileType ?? "");
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to read file");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const loadProfile = useCallback(async (id: string) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/import-profiles/${id}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setMapping((data.mapping ?? {}) as FieldMapping);
      setTargetTable(data.targetTable === "SUPPLIER" ? "SUPPLIER" : "MASTER");
      setPriceMultiplier(String(data.defaultPriceMultiplier ?? 1));
      setUpdateExisting(Boolean(data.updateExisting));
      setSupplierName(data.supplierName ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProfileId) loadProfile(selectedProfileId);
  }, [selectedProfileId, loadProfile]);

  const handleSaveProfile = async () => {
    if (!profileName.trim()) {
      setError("Enter a profile name to save.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/import-profiles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: profileName.trim(),
          targetTable,
          mapping,
          defaultPriceMultiplier: Number(priceMultiplier) || 1,
          updateExisting,
          supplierName: targetTable === "SUPPLIER" ? supplierName.trim() || null : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save profile");
      setProfileName("");
      await fetchProfiles();
      setSuccess("Profile saved.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setLoading(false);
    }
  };

  const handleRunImport = async () => {
    if (!file) return;
    const partNumberMapped = mapping.partNumber;
    if (!partNumberMapped) {
      setError("Map Part Number to a file column.");
      return;
    }
    if (targetTable === "MASTER" && (!mapping.name || !mapping.brand || !mapping.price)) {
      setError("For Master catalog, map Name, Brand, and Price.");
      return;
    }
    if (targetTable === "SUPPLIER") {
      if (!mapping.price) {
        setError("For Supplier stock, map Price.");
        return;
      }
      if (!supplierName.trim()) {
        setError("Enter supplier name.");
        return;
      }
    }
    setError(null);
    setSuccess(null);
    setImportSummary(null);
    setIsImporting(true);
    setProgress(0);
    setStatusMessage("Parsing file…");

    try {
      const parseForm = new FormData();
      parseForm.append("file", file);
      const parseRes = await fetch("/api/universal-import/parse-full", {
        method: "POST",
        body: parseForm,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Failed to parse file");
      const rows: Record<string, string>[] = parseData.rows ?? [];
      if (rows.length === 0) {
        setError("No rows found in file.");
        setIsImporting(false);
        return;
      }

      const chunks: Record<string, string>[][] = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }
      const totalChunks = chunks.length;
      const totalRows = rows.length;
      setTotalRowsForImport(totalRows);
      setTotalChunksForImport(totalChunks);
      setProcessedRows(0);

      let totalCreated = 0;
      let totalUpdated = 0;
      let totalErrors = 0;

      const payload: {
        profileId?: string;
        chunk: Record<string, string>[];
        mapping?: Record<string, string>;
        config?: Record<string, unknown>;
        targetTable?: string;
        supplierName?: string;
      } = { chunk: [] };

      if (selectedProfileId) {
        payload.profileId = selectedProfileId;
      } else {
        payload.mapping = mapping as Record<string, string>;
        payload.targetTable = targetTable;
        payload.config = {
          priceMultiplier: Number(priceMultiplier) || 1,
          defaultBrand: "",
          supplierName: targetTable === "SUPPLIER" ? supplierName.trim() : undefined,
        };
        if (targetTable === "SUPPLIER") payload.supplierName = supplierName.trim();
      }

      for (let i = 0; i < chunks.length; i++) {
        setCurrentChunkIndex(i + 1);
        setProcessedRows(i * CHUNK_SIZE);
        setStatusMessage(`Processing chunk ${i + 1} of ${totalChunks}…`);
        setProgress(Math.round(((i + 0.5) / totalChunks) * 100));

        payload.chunk = chunks[i];
        const chunkRes = await fetch("/api/universal-import/chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const chunkData = await chunkRes.json();

        if (!chunkRes.ok) {
          setError(
            `Chunk ${i + 1} of ${totalChunks} failed: ${chunkData.error ?? "Unknown error"}. Data from previous chunks was imported.`
          );
          setImportSummary({
            created: totalCreated,
            updated: totalUpdated,
            errors: totalErrors,
            totalRows: (i + 1) * CHUNK_SIZE <= totalRows ? (i + 1) * CHUNK_SIZE : totalRows,
          });
          setIsImporting(false);
          setProgress(100);
          return;
        }

        totalCreated += chunkData.created ?? 0;
        totalUpdated += chunkData.updated ?? 0;
        totalErrors += chunkData.errors ?? 0;
        setProcessedRows((i + 1) * CHUNK_SIZE <= totalRows ? (i + 1) * CHUNK_SIZE : totalRows);
      }

      setProgress(100);
      setProcessedRows(totalRows);
      setStatusMessage("Done.");
      setImportSummary({
        created: totalCreated,
        updated: totalUpdated,
        errors: totalErrors,
        totalRows,
      });
      setSuccess(
        `Success: ${totalUpdated} updated, ${totalCreated} created, ${totalErrors} errors (${totalRows} rows total).`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteProfile = async (id: string) => {
    if (!window.confirm("Delete this profile?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/import-profiles/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      if (selectedProfileId === id) setSelectedProfileId("");
      await fetchProfiles();
    } catch {
      setError("Failed to delete profile");
    } finally {
      setDeletingId(null);
    }
  };

  const dbFields = targetTable === "SUPPLIER" ? DB_FIELDS_SUPPLIER : DB_FIELDS_MASTER;
  const unmappedRequired = dbFields.some((f) => {
    const mapped = mapping[f.key];
    return f.required && !(typeof mapped === "string" && headers.includes(mapped));
  });

  return (
    <>
      <header className="sticky top-0 z-10 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <h1 className="text-lg font-semibold sm:text-xl">Universal Importer</h1>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 p-4 sm:p-6">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-500">
          <span className={step >= 1 ? "text-blue-400" : ""}>1. Upload</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step >= 2 ? "text-blue-400" : ""}>2. Map</span>
          <ArrowRight className="h-4 w-4" />
          <span className={step >= 3 ? "text-blue-400" : ""}>3. Options</span>
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            <p>{error}</p>
            {importSummary && importSummary.created + importSummary.updated > 0 && (
              <p className="mt-2 text-xs text-red-400/90">
                Data already imported before failure: {importSummary.updated} updated, {importSummary.created} created, {importSummary.errors} errors.
              </p>
            )}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle className="h-5 w-5 shrink-0" />
            <div>
              <p>{success}</p>
              {importSummary && (
                <p className="mt-1 text-xs text-emerald-400/90">
                  {importSummary.updated} updated, {importSummary.created} created, {importSummary.errors} errors · {importSummary.totalRows} rows total
                </p>
              )}
            </div>
          </div>
        )}

        {isImporting && (
          <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <p className="mb-2 text-sm font-medium text-slate-300">{statusMessage}</p>
            <p className="mb-3 text-xs text-slate-500">
              Processed {Math.min(processedRows, totalRowsForImport)} / {totalRowsForImport} rows
              {totalChunksForImport > 0 && (
                <> · Chunk {currentChunkIndex} of {totalChunksForImport}</>
              )}
            </p>
            <div className="h-3 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-blue-500 transition-all duration-300 ease-out"
                style={{ width: `${Math.min(100, progress)}%` }}
              />
            </div>
          </div>
        )}

        {/* Step 1: Upload */}
        {step === 1 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-200">
              <Upload className="h-5 w-5" />
              Step 1: Upload File
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              Choose a CSV, XML, or XLSX file. Headers or tags will be detected for mapping.
            </p>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-10 text-slate-400 transition-colors hover:border-blue-500/50 hover:bg-slate-800 hover:text-slate-300">
              {loading ? (
                <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
              ) : (
                <FileSpreadsheet className="h-10 w-10" />
              )}
              <span className="text-sm font-medium">
                {loading ? "Reading file…" : "Click or drop file here"}
              </span>
              <span className="text-xs">CSV, XML, or XLSX</span>
              <input
                type="file"
                accept=".csv,.xml,.xlsx"
                className="hidden"
                onChange={handleFileChange}
                disabled={loading}
              />
            </label>
          </section>
        )}

        {/* Step 2: Mapper */}
        {step === 2 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-200">
              <Map className="h-5 w-5" />
              Step 2: Map Fields
            </h2>
            {file && (
              <p className="mb-4 text-sm text-slate-500">
                File: <span className="font-mono text-slate-400">{file.name}</span> —{" "}
                {headers.length} column(s) detected.
              </p>
            )}

            {/* Target table */}
            <div className="mb-4">
              <label className="mb-1.5 block text-xs font-medium text-slate-500">
                Import into
              </label>
              <select
                value={targetTable}
                onChange={(e) => setTargetTable(e.target.value as "MASTER" | "SUPPLIER")}
                className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
              >
                <option value="MASTER">Master Catalog (products)</option>
                <option value="SUPPLIER">Supplier Stock</option>
              </select>
            </div>

            {/* Load profile */}
            {profiles.length > 0 && (
              <div className="mb-4 space-y-2">
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Load saved profile
                </label>
                <select
                  value={selectedProfileId}
                  onChange={(e) => setSelectedProfileId(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— None —</option>
                  {profiles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.targetTable})
                    </option>
                  ))}
                </select>
                <div className="flex flex-wrap gap-2">
                  {profiles.map((p) => (
                    <span
                      key={p.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/50 px-2.5 py-1.5 text-xs text-slate-400"
                    >
                      {p.name}
                      <button
                        type="button"
                        onClick={() => handleDeleteProfile(p.id)}
                        disabled={deletingId === p.id}
                        className="rounded p-0.5 text-slate-500 hover:bg-red-500/20 hover:text-red-400 disabled:opacity-50"
                        aria-label={`Delete ${p.name}`}
                      >
                        {deletingId === p.id ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-3">
              {dbFields.map(({ key, label, required }) => (
                <div key={key}>
                  <label className="mb-1 block text-xs font-medium text-slate-500">
                    {label} {required && <span className="text-amber-500">*</span>}
                  </label>
                  <select
                    value={mapping[key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [key]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    <option value="">— Skip / Not in file —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={unmappedRequired}
                className="flex items-center gap-2 rounded-lg border border-blue-500/50 bg-blue-500/20 px-4 py-2.5 text-sm font-medium text-blue-300 hover:bg-blue-500/30 disabled:opacity-50"
              >
                Next: Options
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </section>
        )}

        {/* Step 3: Options */}
        {step === 3 && (
          <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-slate-200">
              <Settings className="h-5 w-5" />
              Step 3: Options & Run
            </h2>

            <div className="space-y-4">
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
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                  placeholder="1"
                />
                <p className="mt-1 text-xs text-slate-500">
                  e.g. 1.2 = 20% markup, 0.9 = 10% discount
                </p>
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={updateExisting}
                  onChange={(e) => setUpdateExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-600 text-blue-500 focus:ring-blue-500"
                />
                Update existing products/rows (uncheck for &quot;Add new only&quot;)
              </label>

              {targetTable === "SUPPLIER" && (
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-slate-500">
                    Supplier name <span className="text-amber-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={supplierName}
                    onChange={(e) => setSupplierName(e.target.value)}
                    placeholder="e.g. Volvo Dealer"
                    className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Save as profile */}
            <div className="mt-6 border-t border-slate-800 pt-4">
              <p className="mb-2 text-xs font-medium text-slate-500">Save mapping as profile</p>
              <div className="flex flex-wrap gap-2">
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Profile name"
                  className="min-w-[160px] flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-sm text-slate-200 hover:bg-slate-600 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Save profile
                </button>
              </div>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="flex items-center gap-2 rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-700"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>
              <button
                type="button"
                onClick={handleRunImport}
                disabled={loading || isImporting || (targetTable === "SUPPLIER" && !supplierName.trim())}
                className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
              >
                {loading || isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                Run import
              </button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
