"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { isSignedIn, isLoaded } = useAuth();
  const signIn = useSignIn() as unknown as { authenticateWithRedirect: (opts: { strategy: string; redirectUrl: string; redirectUrlComplete: string }) => Promise<void> } | null;

  useEffect(() => {
    if (!isLoaded) return;
    if (isSignedIn) {
      router.replace("/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  const handleGoogleSignIn = () => {
    if (!signIn) return;
    signIn.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sign-in/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  const handleAppleSignIn = () => {
    if (!signIn) return;
    signIn.authenticateWithRedirect({
      strategy: "oauth_apple",
      redirectUrl: "/sign-in/sso-callback",
      redirectUrlComplete: "/dashboard",
    });
  };

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
      </div>
    );
  }

  if (isSignedIn) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-white">
            Σύνδεση
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Συνδέσου για πρόσβαση στο Dashboard και στα B2B εργαλεία.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-6 py-6 shadow-xl backdrop-blur">
          <div className="space-y-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-600 bg-slate-800/80 py-3 text-sm font-medium text-slate-100 transition-colors hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <GoogleIcon className="h-5 w-5" />
              Σύνδεση μέσω Google
            </button>
            <button
              type="button"
              onClick={handleAppleSignIn}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-700 bg-slate-950 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              <AppleIcon className="h-5 w-5 text-white" />
              Σύνδεση μέσω Apple
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-slate-700" />
            <span className="text-xs text-slate-500">ή</span>
            <div className="h-px flex-1 bg-slate-700" />
          </div>

          <div className="mt-5 space-y-3">
            <Link
              href="/sign-in"
              className="inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-800/50 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800"
            >
              Σύνδεση με email
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Είσοδος στο Dashboard
            </Link>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-4 text-center">
          <p className="text-sm text-slate-400">
            Δεν έχετε λογαριασμό;{" "}
            <Link
              href="/register"
              className="font-semibold text-indigo-400 transition-colors hover:text-indigo-300"
            >
              Εγγραφή τώρα
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
