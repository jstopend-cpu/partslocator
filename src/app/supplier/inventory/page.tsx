"use client";

import React, { useState } from "react";
import { Upload, Loader2, FileText, CheckCircle } from "lucide-react";

const CHUNK_SIZE = 300;

export default function SupplierInventoryPage() {
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<{ partNumber: string; price: string; quantity: string }>({
    partNumber: "",
    price: "",
    quantity: "",
  });
  const [priceMultiplier, setPriceMultiplier] = useState("1");
  const [loading, setLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [totalCreated, setTotalCreated] = useState(0);
  const [totalUpdated, setTotalUpdated] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setError(null);
    setSuccess(null);
    setHeaders([]);
    setFile(f);
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", f);
      const res = await fetch("/api/universal-import/parse-full", {
        method: "POST",
        body: form,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Parse failed");
      setHeaders(data.headers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to parse file");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  const handleRunImport = async () => {
    if (!file || !mapping.partNumber || !mapping.price) {
      setError("Map Part Number and Price at least.");
      return;
    }
    setError(null);
    setSuccess(null);
    setIsImporting(true);
    setProgress(0);
    setTotalCreated(0);
    setTotalUpdated(0);
    setTotalErrors(0);

    try {
      const parseForm = new FormData();
      parseForm.append("file", file);
      const parseRes = await fetch("/api/universal-import/parse-full", {
        method: "POST",
        body: parseForm,
      });
      const parseData = await parseRes.json();
      if (!parseRes.ok) throw new Error(parseData.error || "Parse failed");
      const rows: Record<string, string>[] = parseData.rows ?? [];
      if (rows.length === 0) {
        setError("No rows in file.");
        setIsImporting(false);
        return;
      }

      const chunks: Record<string, string>[][] = [];
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        chunks.push(rows.slice(i, i + CHUNK_SIZE));
      }
      const totalChunks = chunks.length;
      const multiplier = Number(priceMultiplier) || 1;
      let created = 0;
      let updated = 0;
      let errors = 0;

      for (let i = 0; i < chunks.length; i++) {
        setStatusMessage(`Processing chunk ${i + 1} of ${totalChunks}…`);
        setProgress(Math.round(((i + 0.5) / totalChunks) * 100));

        const res = await fetch("/api/supplier/import-chunk", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chunk: chunks[i],
            mapping: { partNumber: mapping.partNumber, price: mapping.price, quantity: mapping.quantity || undefined },
            priceMultiplier: multiplier,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(`Chunk ${i + 1} failed: ${data.error ?? "Unknown"}. Previous chunks were imported.`);
          setTotalCreated(created);
          setTotalUpdated(updated);
          setTotalErrors(errors);
          setIsImporting(false);
          return;
        }
        created += data.created ?? 0;
        updated += data.updated ?? 0;
        errors += data.errors ?? 0;
      }

      setProgress(100);
      setStatusMessage("Done.");
      setTotalCreated(created);
      setTotalUpdated(updated);
      setTotalErrors(errors);
      setSuccess(`Success: ${updated} updated, ${created} created, ${errors} errors.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed");
    } finally {
      setIsImporting(false);
    }
  };

  const hasHeaders = headers.length > 0;

  return (
    <>
      <h1 className="mb-2 text-xl font-semibold text-slate-200">Inventory Sync</h1>
      <p className="mb-6 text-sm text-slate-500">
        Ανεβάστε CSV ή XML για να ενημερώσετε τιμές και ποσότητες μόνο του αποθέματός σας.
      </p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
          <CheckCircle className="h-5 w-5 shrink-0" />
          {success}
        </div>
      )}

      {isImporting && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4">
          <p className="mb-2 text-sm font-medium text-slate-300">{statusMessage}</p>
          <div className="h-3 overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-blue-500 transition-all duration-300"
              style={{ width: `${Math.min(100, progress)}%` }}
            />
          </div>
        </div>
      )}

      <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
        <h2 className="mb-2 text-lg font-semibold text-slate-200">1. Upload file</h2>
        <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-700 bg-slate-800/50 px-6 py-8 text-slate-400 transition-colors hover:border-blue-500/50 hover:bg-slate-800">
          {loading ? (
            <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
          ) : (
            <FileText className="h-10 w-10" />
          )}
          <span className="text-sm">{loading ? "Reading…" : "Click or drop CSV/XML"}</span>
          <input
            type="file"
            accept=".csv,.xml"
            className="hidden"
            onChange={handleFileChange}
            disabled={loading}
          />
        </label>
        {file && <p className="mt-2 text-sm text-slate-500">File: {file.name}</p>}
      </section>

      {hasHeaders && (
        <>
          <section className="mb-6 rounded-xl border border-slate-800 bg-slate-900/50 p-4 sm:p-6">
            <h2 className="mb-4 text-lg font-semibold text-slate-200">2. Map columns</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">
                  Part Number *
                </label>
                <select
                  value={mapping.partNumber}
                  onChange={(e) => setMapping((m) => ({ ...m, partNumber: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Select —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Price *</label>
                <select
                  value={mapping.price}
                  onChange={(e) => setMapping((m) => ({ ...m, price: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Select —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-slate-500">Quantity</label>
                <select
                  value={mapping.quantity}
                  onChange={(e) => setMapping((m) => ({ ...m, quantity: e.target.value }))}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-slate-200 focus:border-blue-500 focus:outline-none"
                >
                  <option value="">— Optional —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>{h}</option>
                  ))}
                </select>
              </div>
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
                />
              </div>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleRunImport}
              disabled={isImporting}
              className="flex items-center gap-2 rounded-lg border border-emerald-500/50 bg-emerald-500/20 px-4 py-2.5 text-sm font-medium text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
            >
              {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Run import
            </button>
          </div>
        </>
      )}
    </>
  );
}
