import React from "react";
import { getPublicBrandsWithLogos } from "@/app/actions/categories";
import { BrandCard } from "./BrandCard";

const PRIORITY_COUNT = 6;

export async function BrandGrid() {
  const brands = await getPublicBrandsWithLogos();

  if (brands.length === 0) {
    return null;
  }

  return (
    <section className="mb-8 min-h-[200px]" aria-label="Shop by Brand">
      <h2 className="mb-4 text-lg font-semibold text-slate-200">Shop by Brand</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {brands.map((brand, index) => (
          <BrandCard
            key={brand.id}
            brand={brand}
            priority={index < PRIORITY_COUNT}
          />
        ))}
      </div>
    </section>
  );
}
