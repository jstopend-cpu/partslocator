"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSignUp } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";
import { completeRegistration } from "@/app/actions/registration";

const AFM_REGEX = /^\d{9}$/;

type VerifyResult =
  | { ok: true; companyName: string; address: string }
  | { ok: false; error: string };

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();

  const [step, setStep] = useState<1 | 2>(1);
  const [afm, setAfm] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  async function handleVerify() {
    const raw = afm.replace(/\s/g, "");
    if (!AFM_REGEX.test(raw)) {
      setVerifyError("Άκυρο ΑΦΜ. Πρέπει να είναι 9 ψηφία.");
      return;
    }
    setVerifyError(null);
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/verify-afm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afm: raw }),
      });
      const data: VerifyResult = await res.json();
      if (!res.ok || !data.ok) {
        setVerifyError("ok" in data && !data.ok ? data.error : "Σφάλμα επαλήθευσης ΑΦΜ.");
        return;
      }
      setCompanyName(data.companyName);
      setAddress(data.address);
      setAfm(raw);
      setStep(2);
    } catch {
      setVerifyError("Σφάλμα δικτύου.");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded || !signUp) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await signUp.create({
        emailAddress: email,
        password,
      });
      const sess = signUp.createdSessionId;
      if (sess) {
        await setActive!({ session: sess });
      } else {
        // e.g. email verification required
        await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
        setSubmitError("Στείλαμε κωδικό επιβεβαίωσης στο email σας. Εισάγετε τον κωδικό για να συνεχίσετε.");
        setSubmitLoading(false);
        return;
      }

      const user = signUp.createdUserId;
      if (!user) {
        setSubmitError("Δεν βρέθηκε αναγνωριστικό χρήστη.");
        setSubmitLoading(false);
        return;
      }

      const result = await completeRegistration(user, {
        email,
        companyName,
        afm,
      });
      if (!result.ok) {
        setSubmitError(result.error);
        setSubmitLoading(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
        : err instanceof Error ? err.message : "Σφάλμα εγγραφής.";
      setSubmitError(String(msg));
    } finally {
      setSubmitLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(30, 58, 138, 0.08), transparent 60%),
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 56px 56px, 56px 56px",
        }}
      />
      <div className="absolute inset-0 bg-slate-950" />

      <nav className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="rounded-lg text-xl font-semibold tracking-tight text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2 focus:ring-offset-slate-950"
        >
          PartsLocator
        </Link>
        <Link
          href="/sign-in"
          className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
        >
          Είσοδος
        </Link>
      </nav>

      <div className="relative z-10 mx-auto max-w-md px-4 py-12 sm:py-16">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm sm:p-8">
          <h1 className="text-2xl font-bold text-white sm:text-3xl">Εγγραφή</h1>
          <p className="mt-2 text-slate-400">Δημιουργήστε λογαριασμό B2B.</p>

          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                className="mt-8"
              >
                <label className="block text-sm font-medium text-slate-300">ΑΦΜ (9 ψηφία)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={afm}
                  onChange={(e) => setAfm(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="123456789"
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                {verifyError && (
                  <p className="mt-2 text-sm text-red-400">{verifyError}</p>
                )}
                <button
                  type="button"
                  onClick={handleVerify}
                  disabled={verifyLoading}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                >
                  {verifyLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Επαλήθευση"
                  )}
                </button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.form
                key="step2"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 12 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
              >
                <div className="rounded-xl border border-slate-700 bg-slate-800/40 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Εταιρεία</p>
                  <p className="mt-1 font-semibold text-white">{companyName}</p>
                  <p className="mt-1 text-sm text-slate-400">{address}</p>
                  <p className="mt-1 text-xs text-slate-500">ΑΦΜ: {afm}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="you@company.gr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300">Κωδικός</label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    placeholder="••••••••"
                  />
                </div>
                {submitError && (
                  <p className="text-sm text-red-400">{submitError}</p>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="rounded-xl border border-slate-600 px-4 py-3 font-medium text-slate-300 transition-colors hover:bg-slate-800"
                  >
                    Πίσω
                  </button>
                  <button
                    type="submit"
                    disabled={submitLoading}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-indigo-500 disabled:opacity-60"
                  >
                    {submitLoading ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Ολοκλήρωση εγγραφής
                      </>
                    )}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">
          Ήδη μέλος;{" "}
          <Link href="/sign-in" className="font-medium text-indigo-400 hover:text-indigo-300">
            Είσοδος
          </Link>
        </p>
      </div>
    </div>
  );
}
