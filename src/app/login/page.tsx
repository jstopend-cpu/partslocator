import { SignIn } from "@clerk/nextjs";

export default function LoginPage() {
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
