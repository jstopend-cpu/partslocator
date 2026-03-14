"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { getPublicBrandsWithLogos, type BrandRow } from "@/app/actions/categories";

const LOGO_SIZE = 80;

function BrandCard({ brand }: { brand: BrandRow }) {
  const [imgError, setImgError] = useState(false);
  const href = `/search?brand=${encodeURIComponent(brand.name)}`;

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-3 rounded-xl border border-slate-700/80 bg-slate-800/60 p-4 shadow-sm transition-transform duration-200 hover:scale-105 hover:shadow-md hover:border-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-900"
    >
      <div
        className="flex h-[80px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white shadow-inner"
        style={{ minHeight: LOGO_SIZE, minWidth: LOGO_SIZE }}
      >
        {brand.logoUrl && !imgError ? (
          <img
            src={brand.logoUrl}
            alt=""
            role="presentation"
            className="h-full w-full object-contain p-1"
            style={{ maxHeight: LOGO_SIZE, maxWidth: LOGO_SIZE }}
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="text-2xl font-bold text-slate-300" aria-hidden>
            {brand.name.charAt(0)}
          </span>
        )}
      </div>
      <span className="text-center text-sm font-medium text-slate-200 line-clamp-2">
        {brand.name}
      </span>
    </Link>
  );
}

export function BrandGrid() {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicBrandsWithLogos().then((list) => {
      setBrands(list);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <section className="mb-8" aria-label="Shop by Brand">
        <h2 className="mb-4 text-lg font-semibold text-slate-200">Shop by Brand</h2>
        <div className="flex justify-center py-8">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-600 border-t-blue-500" aria-hidden />
        </div>
      </section>
    );
  }

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="mb-8" aria-label="Shop by Brand">
      <h2 className="mb-4 text-lg font-semibold text-slate-200">Shop by Brand</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </section>
  );
}
