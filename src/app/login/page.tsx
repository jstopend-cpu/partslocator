 "use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, KeyRound, CheckSquare, LogIn } from "lucide-react";

type CustomerSession = {
  name: string;
  email: string;
  code: string;
  remember: boolean;
};

const STORAGE_KEY = "pl_customer_session";

export default function CustomerLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [customerCode, setCustomerCode] = useState("");
  const [remember, setRemember] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      if (typeof window === "undefined") return;

      const rawSession =
        window.sessionStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(STORAGE_KEY);

      if (rawSession) {
        const parsed = JSON.parse(rawSession) as CustomerSession | null;
        if (parsed?.email && parsed?.code) {
          router.replace("/dashboard");
        }
      }
    } catch {
      // ignore malformed data
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !customerCode.trim()) {
      setError("Συμπλήρωσε το email και τον κωδικό πελάτη.");
      return;
    }

    setIsSubmitting(true);

    try {
      const normalizedCode = customerCode.trim().toUpperCase();
      const customerName =
        normalizedCode.length >= 3 ? `Customer ${normalizedCode}` : "B2B Customer";

      const session: CustomerSession = {
        name: customerName,
        email: email.trim(),
        code: normalizedCode,
        remember,
      };

      if (typeof window !== "undefined") {
        const payload = JSON.stringify(session);
        if (remember) {
          window.localStorage.setItem(STORAGE_KEY, payload);
          window.sessionStorage.removeItem(STORAGE_KEY);
        } else {
          window.sessionStorage.setItem(STORAGE_KEY, payload);
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }

      router.push("/dashboard");
    } catch {
      setError("Κάτι πήγε στραβά. Δοκίμασε ξανά.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center rounded-xl border border-slate-800 bg-slate-900 px-4 py-2 shadow-sm">
            <LogIn className="h-5 w-5 text-emerald-400 mr-2" aria-hidden />
            <span className="text-sm font-medium text-slate-200">
              Parts Locator B2B Portal
            </span>
          </div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-white">
            Είσοδος Πελάτη
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Συνδέσου για να δεις διαθεσιμότητα, τιμές και να στείλεις αιτήματα.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-6 shadow-xl backdrop-blur">
          {error && (
            <div className="mb-4 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="flex items-center justify-between text-xs font-medium text-slate-300"
              >
                <span>Email</span>
              </label>
              <div className="relative">
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="service@garage-example.gr"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="customer-code"
                className="flex items-center justify-between text-xs font-medium text-slate-300"
              >
                <span>Κωδικός Πελάτη</span>
                <span className="text-[11px] uppercase tracking-wide text-slate-500">
                  B2B ID
                </span>
              </label>
              <div className="relative">
                <KeyRound
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
                  aria-hidden
                />
                <input
                  id="customer-code"
                  type="text"
                  autoComplete="off"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/60 py-2.5 pl-10 pr-3 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                  placeholder="π.χ. GARAGE123"
                  value={customerCode}
                  onChange={(e) => setCustomerCode(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded border border-slate-600 bg-slate-950 text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                <span className="inline-flex items-center gap-1.5">
                  <CheckSquare className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                  Απομνημόνευση σύνδεσης
                </span>
              </label>
              <span className="text-[11px] text-slate-500">
                Mock login – δεν απαιτούνται πραγματικά στοιχεία.
              </span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              <LogIn className="h-4 w-4" aria-hidden />
              {isSubmitting ? "Γίνεται είσοδος..." : "Είσοδος στο Dashboard"}
            </button>
          </form>
        </div>

        <p className="mt-4 text-center text-xs text-slate-500">
          B2B πρόσβαση για επαγγελματίες μηχανικούς, συνεργεία και διανομείς ανταλλακτικών.
        </p>
      </div>
    </div>
  );
}

