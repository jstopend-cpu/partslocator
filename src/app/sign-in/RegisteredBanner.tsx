"use client";

import { useSearchParams } from "next/navigation";

export function RegisteredBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("registered") !== "1") return null;
  return (
    <div className="mb-4 w-full max-w-[420px] rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm text-emerald-800">
      Η εγγραφή ολοκληρώθηκε! Ελέγξτε το email σας.
    </div>
  );
}
