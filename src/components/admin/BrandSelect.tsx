"use client";

import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";

export type BrandOption = { id: string; name: string; logoUrl: string | null };

type BrandSelectProps = {
  brands: BrandOption[];
  selectedBrandId: string;
  onSelect: (brandId: string) => void;
  disabled?: boolean;
  placeholder?: string;
  id?: string;
  label?: React.ReactNode;
  className?: string;
  /** Max height of the dropdown list in pixels (default 240). */
  listMaxHeight?: number;
};

export function BrandSelect({
  brands,
  selectedBrandId,
  onSelect,
  disabled = false,
  placeholder = "Επίλεξε brand...",
  id = "brand-select",
  label,
  className = "",
  listMaxHeight = 240,
}: BrandSelectProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const selectedBrand = brands.find((b) => b.id === selectedBrandId);

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

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label != null && (
        <label id={`${id}-label`} className="mb-1.5 block text-xs font-medium text-slate-500">
          {label}
        </label>
      )}
      <button
        type="button"
        id={id}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-labelledby={label != null ? `${id}-label` : undefined}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/80 px-3 py-2.5 text-left text-sm text-slate-200 focus:border-blue-500 focus:outline-none disabled:opacity-60"
      >
        {selectedBrandId && selectedBrand ? (
          <>
            <BrandLogo logoUrl={selectedBrand.logoUrl} name={selectedBrand.name} size={24} />
            <span className="min-w-0 flex-1 truncate">{selectedBrand.name}</span>
          </>
        ) : (
          <span className="flex-1 text-slate-500">{placeholder}</span>
        )}
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <ul
          role="listbox"
          aria-labelledby={label != null ? `${id}-label` : undefined}
          className="absolute z-10 mt-1 w-full min-w-[200px] overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 shadow-lg"
          style={{ maxHeight: listMaxHeight }}
        >
          {brands.map((b) => (
            <li
              key={b.id}
              role="option"
              aria-selected={selectedBrandId === b.id}
              onClick={() => {
                onSelect(b.id);
                setOpen(false);
              }}
              className="flex cursor-pointer items-center gap-2 px-3 py-2 text-slate-200 transition-colors hover:bg-slate-700/80 data-[selected]:bg-slate-700/60"
              data-selected={selectedBrandId === b.id}
            >
              <BrandLogo logoUrl={b.logoUrl} name={b.name} size={24} />
              <span className="min-w-0 flex-1 truncate">{b.name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
