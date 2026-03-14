"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSignUp } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { Check, Loader2, ArrowRight } from "lucide-react";

type VerifiedBusiness = {
  companyName: string;
  activity: string;
  address: string;
  isAutomotive: boolean;
};

export default function RegisterPage() {
  const router = useRouter();
  const { signUp, setActive, isLoaded } = useSignUp();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [afm, setAfm] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [business, setBusiness] = useState<VerifiedBusiness | null>(null);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [verifyCodeLoading, setVerifyCodeLoading] = useState(false);

  const handleVerifyAfm = async () => {
    const trimmed = afm.replace(/\s/g, "");
    if (!trimmed) return;
    setVerifyError(null);
    setVerifyLoading(true);
    try {
      const res = await fetch("/api/verify-afm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ afm: trimmed }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setVerifyError(data?.error ?? "Σφάλμα επαλήθευσης ΑΦΜ.");
        return;
      }
      setBusiness({
        companyName: data.companyName,
        activity: data.activity,
        address: data.address,
        isAutomotive: data.isAutomotive,
      });
      setStep(2);
    } catch (e) {
      setVerifyError("Σφάλμα δικτύου.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!business || !email.trim() || !password) return;
    setSubmitError(null);
    setSubmitLoading(true);
    try {
      await signUp!.create({
        emailAddress: email.trim(),
        password,
        unsafeMetadata: {
          afm: afm.replace(/\s/g, ""),
          companyName: business.companyName,
          activity: business.activity,
          address: business.address,
          phone: phone.trim() || undefined,
        },
      });
      await signUp!.prepareEmailAddressVerification({ strategy: "email_code" });
      setStep(4);
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
        : "Σφάλμα εγγραφής.";
      setSubmitError(typeof msg === "string" ? msg : "Σφάλμα εγγραφής.");
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verificationCode.trim()) return;
    setVerifyCodeLoading(true);
    try {
      const result = await signUp!.attemptEmailAddressVerification({
        code: verificationCode.trim(),
      });
      if (result.status === "complete") {
        await setActive!({ session: result.createdSessionId });
        router.push("/");
      }
    } catch (err: unknown) {
      const msg = err && typeof err === "object" && "errors" in err
        ? (err as { errors: { message?: string }[] }).errors?.[0]?.message
        : "Λάθος κωδικός.";
      setSubmitError(typeof msg === "string" ? msg : "Λάθος κωδικός.");
    } finally {
      setVerifyCodeLoading(false);
    }
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
        >
          ← Πίσω στην αρχική
        </Link>

        <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
          Εγγραφή επαγγελματία
        </h1>
        <p className="mt-2 text-slate-400">
          {step === 1 && "Επαληθεύστε το ΑΦΜ της επιχείρησής σας."}
          {step === 2 && "Ελέγξτε τα στοιχεία και συνεχίστε."}
          {step === 3 && "Συμπληρώστε email, κινητό και κωδικό."}
          {step === 4 && "Εισάγετε τον κωδικό που σας στείλαμε στο email."}
        </p>

        {/* Step 1: Verify Business */}
        {step === 1 && (
          <div className="mt-8 space-y-4">
            <div>
              <label htmlFor="afm" className="mb-2 block text-sm font-medium text-slate-300">
                ΑΦΜ <span className="text-red-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  id="afm"
                  type="text"
                  inputMode="numeric"
                  maxLength={9}
                  value={afm}
                  onChange={(e) => setAfm(e.target.value.replace(/\D/g, ""))}
                  placeholder="9 ψηφία"
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleVerifyAfm}
                  disabled={verifyLoading || afm.replace(/\s/g, "").length !== 9}
                  className="flex shrink-0 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
                >
                  {verifyLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-5 w-5" />
                      Επαλήθευση
                    </>
                  )}
                </button>
              </div>
            </div>
            {verifyError && (
              <p className="text-sm text-red-400">{verifyError}</p>
            )}
          </div>
        )}

        {/* Step 2: Business details (read-only) */}
        {step === 2 && business && (
          <div className="mt-8 space-y-6">
            {!business.isAutomotive && (
              <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
                Η εγγραφή επιτρέπεται μόνο σε επαγγελματίες του κλάδου αυτοκινήτου.
              </div>
            )}
            <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Επωνυμία</span>
                <p className="mt-1 text-slate-100">{business.companyName}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Δραστηριότητα</span>
                <p className="mt-1 text-slate-200">{business.activity}</p>
              </div>
              <div>
                <span className="text-xs font-medium uppercase text-slate-500">Διεύθυνση</span>
                <p className="mt-1 text-slate-200">{business.address}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500"
            >
              Συνέχεια
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Step 3: Email, Phone, Password */}
        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-300">
                Email <span className="text-red-400">*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="epiheirisi@example.gr"
              />
            </div>
            <div>
              <label htmlFor="phone" className="mb-2 block text-sm font-medium text-slate-300">
                Κινητό τηλέφωνο
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="6912345678"
              />
            </div>
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-300">
                Κωδικός <span className="text-red-400">*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="••••••••"
              />
            </div>
            {submitError && (
              <p className="text-sm text-red-400">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={submitLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {submitLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Ολοκλήρωση εγγραφής"
              )}
            </button>
          </form>
        )}

        {/* Step 4: Email verification code */}
        {step === 4 && (
          <form onSubmit={handleVerifyCode} className="mt-8 space-y-4">
            <p className="text-sm text-slate-400">
              Σας στείλαμε κωδικό στο <strong className="text-slate-200">{email}</strong>. Εισάγετε τον παρακάτω.
            </p>
            <div>
              <label htmlFor="code" className="mb-2 block text-sm font-medium text-slate-300">
                Κωδικός επαλήθευσης
              </label>
              <input
                id="code"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-3 font-mono text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
                placeholder="123456"
              />
            </div>
            {submitError && (
              <p className="text-sm text-red-400">{submitError}</p>
            )}
            <button
              type="submit"
              disabled={verifyCodeLoading}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 py-3 font-medium text-white transition-colors hover:bg-indigo-500 disabled:opacity-50"
            >
              {verifyCodeLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                "Επαλήθευση"
              )}
            </button>
          </form>
        )}

        <p className="mt-8 text-center text-sm text-slate-500">
          Έχετε ήδη λογαριασμό;{" "}
          <Link href="/sign-in" className="font-medium text-indigo-400 hover:text-indigo-300">
            Σύνδεση
          </Link>
        </p>
      </div>
    </div>
  );
}
