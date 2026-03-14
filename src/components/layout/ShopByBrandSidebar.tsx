"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Search as SearchIcon } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { getPublicBrandsWithLogos, type BrandRow } from "@/app/actions/categories";

const SHOW_SEARCH_ABOVE = 8;
const LOGO_SIZE = 32;
const LIST_MAX_HEIGHT = 280;

export function ShopByBrandSidebar() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    getPublicBrandsWithLogos().then((list) => {
      setBrands(list);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, searchQuery]);

  const handleSelect = (brand: BrandRow) => {
    setOpen(false);
    setSearchQuery("");
    router.push(`/search?brand=${encodeURIComponent(brand.name)}`);
  };

  if (loading || brands.length === 0) {
    return null;
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      <p className="mb-2 mt-4 px-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        Shop by Brand
      </p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-left text-sm text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800 focus:outline-none focus:ring-1 focus:ring-slate-600"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="min-w-0 flex-1 truncate text-slate-300">Επίλεξε brand...</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="absolute left-0 right-0 top-full z-50 mt-1 flex flex-col overflow-hidden rounded-lg border border-slate-700 bg-slate-800 shadow-xl"
          role="listbox"
        >
          {brands.length > SHOW_SEARCH_ABOVE && (
            <div className="border-b border-slate-700 p-2">
              <div className="relative">
                <SearchIcon className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Αναζήτηση brand..."
                  className="w-full rounded border border-slate-600 bg-slate-900 py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 focus:border-slate-500 focus:outline-none"
                  autoFocus
                  aria-label="Αναζήτηση brand"
                />
              </div>
            </div>
          )}
          <ul
            className="overflow-y-auto py-1"
            style={{ maxHeight: LIST_MAX_HEIGHT }}
          >
            {filteredBrands.length === 0 ? (
              <li className="px-3 py-4 text-center text-sm text-slate-500">
                Δεν βρέθηκαν brands
              </li>
            ) : (
              filteredBrands.map((brand) => (
                <li key={brand.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(brand)}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-200 transition-colors hover:bg-slate-700/80"
                    role="option"
                  >
                    <BrandLogo
                      logoUrl={brand.logoUrl}
                      name={brand.name}
                      size={LOGO_SIZE}
                    />
                    <span className="min-w-0 flex-1 truncate">{brand.name}</span>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
