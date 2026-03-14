"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSignIn } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function SSOCallbackPage() {
  const router = useRouter();
  const signIn = useSignIn();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signIn) return;

    signIn
      .handleRedirectCallback()
      .then(() => {
        router.replace("/dashboard");
      })
      .catch((err) => {
        console.error("SSO callback error:", err);
        setError("Η σύνδεση απέτυχε. Δοκίμασε ξανά.");
      });
  }, [signIn, router]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-slate-950 px-4">
        <p className="text-slate-300">{error}</p>
        <a
          href="/login"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500"
        >
          Επιστροφή στη σύνδεση
        </a>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950">
      <Loader2 className="h-8 w-8 animate-spin text-slate-500" />
    </div>
  );
}
