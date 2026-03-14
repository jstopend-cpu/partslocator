import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

const VIES_REST = "https://ec.europa.eu/taxation_customs/vies/rest-api/ms";

/** Normalize VAT: accept "EL123456789" or "123456789" (assume EL). Return [countryCode, vatNumber]. */
function normalizeVat(input: string): { countryCode: string; vatNumber: string } | null {
  const raw = input.replace(/\s/g, "").toUpperCase();
  if (raw.length < 9) return null;
  if (raw.startsWith("EL")) {
    const num = raw.slice(2).replace(/\D/g, "");
    if (num.length !== 9) return null;
    return { countryCode: "EL", vatNumber: num };
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length !== 9) return null;
  return { countryCode: "EL", vatNumber: digits };
}

export type VerifyViesResponse =
  | { ok: true; companyName: string; address: string }
  | { ok: false; error: string };

export async function POST(request: NextRequest): Promise<NextResponse<VerifyViesResponse>> {
  try {
    const body = await request.json();
    const vatInput = typeof body?.vat === "string" ? body.vat.trim() : "";

    const parsed = normalizeVat(vatInput);
    if (!parsed) {
      return NextResponse.json(
        { ok: false, error: "Άκυρο VAT. Χρησιμοποιήστε EL + 9 ψηφία (π.χ. EL123456789)." },
        { status: 400 }
      );
    }

    const { countryCode, vatNumber } = parsed;
    const url = `${VIES_REST}/${countryCode}/vat/${vatNumber}`;
    const res = await fetch(url, { next: { revalidate: 0 } });
    const data = (await res.json()) as {
      isValid?: boolean;
      name?: string;
      address?: string;
      userError?: string;
    };

    if (!data.isValid) {
      const msg =
        data.userError === "INVALID"
          ? "Το VAT number δεν είναι έγκυρο στο VIES."
          : data.userError === "SERVICE_UNAVAILABLE"
            ? "Η υπηρεσία VIES δεν είναι διαθέσιμη. Δοκιμάστε ξανά αργότερα."
            : "Το VAT δεν επαληθεύτηκε.";
      return NextResponse.json({ ok: false, error: msg }, { status: 400 });
    }

    const companyName =
      typeof data.name === "string" && data.name && data.name !== "---"
        ? data.name
        : "Εταιρεία";
    const address =
      typeof data.address === "string" && data.address && data.address !== "---"
        ? data.address
        : "—";

    return NextResponse.json({
      ok: true,
      companyName,
      address,
    });
  } catch (e) {
    console.error("verify-vies:", e);
    return NextResponse.json(
      { ok: false, error: "Σφάλμα επαλήθευσης VAT." },
      { status: 500 }
    );
  }
}
