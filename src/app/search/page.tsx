"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

/**
 * Redirects /search?brand=X to homepage with pre-filled search: /?q=X
 */
function SearchRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const brand = searchParams.get("brand");

  useEffect(() => {
    const q = brand?.trim() ? decodeURIComponent(brand) : "";
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    router.replace(params.toString() ? `/?${params.toString()}` : "/");
  }, [router, brand]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center bg-slate-950">
      <p className="text-sm text-slate-500">Ανα redirect...</p>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[40vh] items-center justify-center bg-slate-950">
        <p className="text-sm text-slate-500">Φόρτωση...</p>
      </div>
    }>
      <SearchRedirect />
    </Suspense>
  );
}
