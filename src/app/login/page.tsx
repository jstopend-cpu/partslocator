"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SignIn, useAuth } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { isLoaded, userId } = useAuth();

  useEffect(() => {
    if (!isLoaded) return;
    if (userId) {
      router.replace("/dashboard");
    }
  }, [isLoaded, userId, router]);

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  if (userId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <Loader2 className="h-8 w-8 animate-spin text-slate-500" aria-hidden />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-12">
      <div className="w-full max-w-[420px]">
        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/register"
          forceRedirectUrl="/dashboard"
        />
      </div>
    </div>
  );
}
