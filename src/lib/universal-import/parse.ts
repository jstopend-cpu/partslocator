/**
 * Universal Importer: parse CSV, XML, XLSX and extract headers + rows by mapping.
 */

import { Parser } from "xml2js";
import * as XLSX from "xlsx";

const xmlParser = new Parser({ explicitArray: true, trim: true });

export type FileType = "csv" | "xml" | "xlsx";

export type FieldMapping = {
  partNumber?: string;
  name?: string;
  brand?: string;
  price?: string;
  quantity?: string;
};

export type ParsedRow = Record<string, string | number>;

// ---- CSV ----
function parseCsvText(text: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { headers: [], rows: [] };
  const headerLine = lines[0];
  const headers = parseCsvLine(headerLine);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, j) => {
      row[h] = values[j] ?? "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      current += c;
    } else if (c === "," || c === ";") {
      result.push(current.trim());
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current.trim());
  return result;
}

// ---- XML: find repeated item nodes and flatten each to { tag: value } ----
function flattenOneXmlItem(node: unknown): Record<string, string> {
  const row: Record<string, string> = {};
  if (node == null) return row;
  if (typeof node === "string") return { value: String(node).trim() };
  if (Array.isArray(node)) {
    const first = node[0];
    if (typeof first === "string") row.value = String(first).trim();
    else if (first && typeof first === "object") return flattenOneXmlItem(first);
    return row;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    for (const [k, v] of Object.entries(obj)) {
      if (k.startsWith("$") || k === "_") continue;
      if (typeof v === "string") row[k] = v.trim();
      else if (Array.isArray(v) && v.length > 0) {
        const first = v[0];
        row[k] = typeof first === "string" ? String(first).trim() : String(first ?? "").trim();
      } else if (v && typeof v === "object") {
        const nested = flattenOneXmlItem(v);
        Object.assign(row, nested);
      }
    }
  }
  return row;
}

function findXmlItemArrays(node: unknown): Record<string, string>[] {
  if (node == null) return [];
  if (typeof node === "object" && !Array.isArray(node)) {
    const obj = node as Record<string, unknown>;
    for (const value of Object.values(obj)) {
      if (Array.isArray(value) && value.length > 0) {
        const first = value[0];
        if (first && typeof first === "object" && !Array.isArray(first)) {
          const items = value
            .filter((x): x is Record<string, unknown> => x != null && typeof x === "object")
            .map((x) => flattenOneXmlItem(x));
          if (items.length > 0 && Object.keys(items[0]).length > 0) return items;
        }
      }
    }
    for (const value of Object.values(obj)) {
      const found = findXmlItemArrays(value);
      if (found.length > 0) return found;
    }
  }
  return [];
}

function xmlItemsToHeadersAndRows(items: Record<string, string>[]): {
  headers: string[];
  rows: Record<string, string>[];
} {
  const headerSet = new Set<string>();
  items.forEach((row) => Object.keys(row).forEach((k) => headerSet.add(k)));
  const headers = Array.from(headerSet).sort();
  return { headers, rows: items };
}

async function parseXmlText(text: string): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const parsed = await xmlParser.parseStringPromise(text);
  const rows = findXmlItemArrays(parsed);
  if (rows.length === 0) return { headers: [], rows: [] };
  return xmlItemsToHeadersAndRows(rows);
}

// ---- XLSX ----
function parseXlsxBuffer(buffer: ArrayBuffer): { headers: string[]; rows: Record<string, string>[] } {
  const workbook = XLSX.read(buffer, { type: "array", sheetRows: 10000 });
  const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!firstSheet) return { headers: [], rows: [] };
  const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, {
    header: 1,
    defval: "",
  }) as unknown[][];
  if (data.length === 0) return { headers: [], rows: [] };
  const headerRow = data[0];
  const headers = headerRow.map((c) => String(c ?? "").trim()).filter(Boolean);
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < data.length; i++) {
    const row: Record<string, string> = {};
    const values = data[i] as unknown[];
    headers.forEach((h, j) => {
      const v = values[j];
      row[h] = v != null ? String(v).trim() : "";
    });
    rows.push(row);
  }
  return { headers, rows };
}

// ---- Public API ----

export function detectFileType(filename: string): FileType | null {
  const lower = filename.toLowerCase();
  if (lower.endsWith(".csv")) return "csv";
  if (lower.endsWith(".xml")) return "xml";
  if (lower.endsWith(".xlsx")) return "xlsx";
  return null;
}

export async function getHeadersFromFile(
  file: File
): Promise<{ headers: string[]; fileType: FileType; sampleRows?: Record<string, string>[] }> {
  const fileType = detectFileType(file.name);
  if (!fileType) throw new Error("Unsupported file type. Use CSV, XML, or XLSX.");

  if (fileType === "csv") {
    const text = await file.text();
    const { headers, rows } = parseCsvText(text);
    return { headers, fileType, sampleRows: rows.slice(0, 3) };
  }
  if (fileType === "xml") {
    const text = await file.text();
    const { headers, rows } = await parseXmlText(text);
    return { headers, fileType, sampleRows: rows.slice(0, 3) };
  }
  const buffer = await file.arrayBuffer();
  const { headers, rows } = parseXlsxBuffer(buffer);
  return { headers, fileType, sampleRows: rows.slice(0, 3) };
}

/** Parse full file into headers and all rows. Used by server action for import. */
export async function getRowsFromFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[]; fileType: FileType }> {
  const fileType = detectFileType(file.name);
  if (!fileType) throw new Error("Unsupported file type. Use CSV, XML, or XLSX.");

  if (fileType === "csv") {
    const text = await file.text();
    const { headers, rows } = parseCsvText(text);
    return { headers, rows, fileType };
  }
  if (fileType === "xml") {
    const text = await file.text();
    const { headers, rows } = await parseXmlText(text);
    return { headers, rows, fileType };
  }
  const buffer = await file.arrayBuffer();
  const { headers, rows } = parseXlsxBuffer(buffer);
  return { headers, rows, fileType };
}

function getValue(row: Record<string, string>, key: string | undefined): string {
  if (!key) return "";
  const v = row[key];
  return v != null ? String(v).trim() : "";
}

function toNum(v: string, multiplier: number): number {
  const n = Number(String(v).replace(",", "."));
  const val = Number.isFinite(n) ? n : 0;
  return Math.round(val * multiplier * 1e6) / 1e6;
}

export type MasterRecord = {
  partNumber: string;
  name: string;
  brand: string;
  officialMsrp: number;
};

export type SupplierRecord = {
  partNumber: string;
  supplierPrice: number;
  quantity: number;
};

export async function parseFileWithMapping(
  file: File,
  mapping: FieldMapping,
  fileType: FileType,
  priceMultiplier: number
): Promise<{ master: MasterRecord[]; supplier: SupplierRecord[] }> {
  let headers: string[];
  let rows: Record<string, string>[];

  if (fileType === "csv") {
    const text = await file.text();
    const parsed = parseCsvText(text);
    headers = parsed.headers;
    rows = parsed.rows;
  } else if (fileType === "xml") {
    const text = await file.text();
    const parsed = await parseXmlText(text);
    headers = parsed.headers;
    rows = parsed.rows;
  } else {
    const buffer = await file.arrayBuffer();
    const parsed = parseXlsxBuffer(buffer);
    headers = parsed.headers;
    rows = parsed.rows;
  }

  const master: MasterRecord[] = [];
  const supplier: SupplierRecord[] = [];

  for (const row of rows) {
    const partNumber = getValue(row, mapping.partNumber);
    if (!partNumber) continue;

    const name = getValue(row, mapping.name) || partNumber;
    const brand = getValue(row, mapping.brand) || "";
    const priceRaw = getValue(row, mapping.price);
    const price = toNum(priceRaw, priceMultiplier);
    const qty = toNum(getValue(row, mapping.quantity ?? ""), 1);

    master.push({
      partNumber,
      name,
      brand: brand || "Unknown",
      officialMsrp: price,
    });
    supplier.push({
      partNumber,
      supplierPrice: price,
      quantity: Math.max(0, Math.round(qty)),
    });
  }

  return { master, supplier };
}

export function getMappingFromRow(
  mapping: FieldMapping,
  target: "MASTER" | "SUPPLIER"
): { partNumber: string; name?: string; brand?: string; price?: string; quantity?: string } {
  const out: Record<string, string> = { partNumber: mapping.partNumber ?? "" };
  if (mapping.name) out.name = mapping.name;
  if (mapping.brand) out.brand = mapping.brand;
  if (mapping.price) out.price = mapping.price;
  if (target === "SUPPLIER" && mapping.quantity) out.quantity = mapping.quantity;
  return out as { partNumber: string; name?: string; brand?: string; price?: string; quantity?: string };
}
