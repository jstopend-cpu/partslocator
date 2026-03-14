"use client";

import React, { useState } from "react";
import { Car } from "lucide-react";

type BrandLogoProps = {
  logoUrl: string | null | undefined;
  name: string;
  /** Size in pixels (default 24). Renders as square/round. */
  size?: number;
  /** Round (circle) vs square (default round). */
  rounded?: "full" | "lg" | "none";
  className?: string;
};

export function BrandLogo({
  logoUrl,
  name,
  size = 24,
  rounded = "full",
  className = "",
}: BrandLogoProps) {
  const [imgError, setImgError] = useState(false);
  const showImg = logoUrl && !imgError;

  if (showImg) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-white p-1 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={logoUrl}
          alt=""
          role="presentation"
          className="h-full w-full object-contain"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded-md border border-slate-600/80 bg-slate-700/80 text-slate-400 ${className}`}
      style={{ width: size, height: size }}
      title={name}
      aria-hidden
    >
      <Car className="h-[60%] w-[60%]" style={{ minWidth: 14, minHeight: 14 }} />
    </span>
  );
}
