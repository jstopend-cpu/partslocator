"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Package,
  Truck,
  Settings,
  Search,
  Plus,
  Hash,
  Building2,
  ClipboardList,
} from "lucide-react";

type Product = {
  id: number;
  name: string;
  ean: string;
  supplier: string;
  price: string | number;
  stock: number;
};

const BrandBadge = ({ brand }: { brand: string }) => {
  const colors: Record<string, string> = {
    Toyota: "bg-red-600/20 text-red-400 border-red-500/30",
    Audi: "bg-slate-700/50 text-slate-300 border-slate-500/30",
    BMW: "bg-blue-600/20 text-blue-400 border-blue-500/30",
    Directed: "bg-violet-600/20 text-violet-300 border-violet-500/30",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${
        colors[brand] ?? "bg-slate-700/50 text-slate-400 border-slate-600/50"
      }`}
    >
      {brand}
    </span>
  );
};

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, active: true },
  { label: "Inventory", icon: Package, active: false },
  { label: "Suppliers", icon: Truck, active: false, brands: ["Toyota", "Audi", "BMW"] },
  { label: "Settings", icon: Settings, active: false },
];

export default function PartsLocatorDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // <--- ΤΟ ΚΛΕΙΔΙ 1
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    ean: "",
    supplier: "",
    price: "",
    stock: "",
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      await fetch("/api/init", { method: "POST" });
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error(`Αποτυχία (${res.status})`);
      const data: Product[] = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError("Δεν ήταν δυνατή η φόρτωση.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ΛΟΓΙΚΗ ΦΙΛΤΡΑΡΙΣΜΑΤΟΣ (ΤΟ ΚΛΕΙΔΙ 2)
  const filteredProducts = products.filter((product) => {
    const search = searchTerm.toLowerCase();
    return (
      product.name?.toLowerCase().includes(search) ||
      product.ean?.toLowerCase().includes(search) ||
      product.supplier?.toLowerCase().includes(search)
    );
  });

  const stats = [
    { label: "Συνολικά Ανταλλακτικά", value: loading ? "—" : products.length.toString(), icon: Hash },
    { label: "Συνδεδεμένοι Προμηθευτές", value: loading ? "—" : new Set(products.map(p => p.supplier)).size.toString(), icon: Building2 },
    { label: "Εκκρεμείς Παραγγελίες", value: "7", icon: ClipboardList },
  ];

  const formatPrice = (price: string | number) => {
    const numeric = typeof price === "number" ? price : parseFloat(price);
    if (isNaN(numeric)) return price;
    return new Intl.NumberFormat("el-GR", { style: "currency", currency: "EUR" }).format(numeric);
  };

  return (
    <div className="flex h-screen w-full bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/95 flex flex-col">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-semibold">Parts Locator</h1>
          <p className="text-xs text-slate-500">B2B Dashboard</p>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto flex-1">
          {NAV_ITEMS.map((item) => (
            <div key={item.label}>
              <a href="#" className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${item.active ? "bg-blue-500/15 text-blue-400 border border-blue-500/30" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}>
                <item.icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center gap-4 px-6 py-4 border-b border-slate-800 bg-slate-950/98 shrink-0">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
            <input
              type="text"
              placeholder="Αναζήτηση ανταλλακτικών, SKU..."
              value={searchTerm} // <--- ΣΥΝΔΕΣΗ ΜΕ STATE
              onChange={(e) => setSearchTerm(e.target.value)} // <--- ΕΝΗΜΕΡΩΣΗ STATE
              className="w-full bg-slate-900 border border-slate-700 rounded-lg pl-10 pr-4 py-2.5 text-slate-100 focus:border-blue-500 outline-none transition-all"
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2"
          >
            <Plus className="h-5 w-5" /> + Προσθήκη
          </button>
          
          <label htmlFor="xml-upload" className="cursor-pointer bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-2">
             <Plus className="h-5 w-5" /> Εισαγωγή XML
          </label>
          <input 
            type="file" id="xml-upload" className="hidden" accept=".xml" 
            onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const formData = new FormData();
                formData.append('file', file);
                const res = await fetch('/api/import-xml', { method: 'POST', body: formData });
                const data = await res.json();
                if (data.success) { alert(`Εισήχθησαν ${data.count} προϊόντα`); fetchProducts(); }
                else alert('Σφάλμα: ' + data.error);
            }}
          />
        </header>

        <main className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-slate-900/90 border border-slate-800 p-6 rounded-xl hover:border-blue-500/40 transition-all">
                <p className="text-sm text-slate-500 mb-2">{stat.label}</p>
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 bg-blue-500/15 border border-blue-500/25 rounded-lg flex items-center justify-center text-blue-400">
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <span className="text-2xl font-semibold text-white">{stat.value}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-800">
              <h2 className="text-lg font-semibold text-slate-100">Ανταλλακτικά</h2>
            </div>
            <div className="overflow-x-auto">
              {loading ? (
                <p className="p-6 text-slate-400">Φόρτωση...</p>
              ) : error ? (
                <p className="p-6 text-red-400">{error}</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800 text-left text-slate-400">
                      <th className="px-6 py-3">Όνομα</th>
                      <th className="px-6 py-3">EAN / SKU</th>
                      <th className="px-6 py-3">Προμηθευτής</th>
                      <th className="px-6 py-3">Τιμή</th>
                      <th className="px-6 py-3">Απόθεμα</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(filteredProducts) &&
                      filteredProducts.map((product) => (
                        <tr key={product.id} className="border-b border-slate-800/80 hover:bg-slate-800/50">
                          <td className="px-6 py-3 text-slate-200">{product.name}</td>
                          <td className="px-6 py-3 font-mono text-slate-400">{product.ean}</td>
                          <td className="px-6 py-3">
                            <BrandBadge brand={product.supplier} />
                          </td>
                          <td className="px-6 py-3 text-slate-200">{formatPrice(product.price)}</td>
                          <td className="px-6 py-3 text-slate-200">{product.stock}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}