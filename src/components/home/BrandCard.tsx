"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";

const LOGO_SIZE = 80;

type BrandRow = { id: string; name: string; logoUrl: string | null };

export function BrandCard({
  brand,
  priority = false,
}: {
  brand: BrandRow;
  priority?: boolean;
}) {
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
          <Image
            src={brand.logoUrl}
            alt=""
            width={LOGO_SIZE}
            height={LOGO_SIZE}
            className="h-full w-full object-contain p-1"
            style={{ maxHeight: LOGO_SIZE, maxWidth: LOGO_SIZE }}
            priority={priority}
            unoptimized
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
