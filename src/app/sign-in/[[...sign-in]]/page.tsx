import { SignIn } from "@clerk/nextjs";

const appearance = {
  variables: {
    colorPrimary: "#3b82f6",
    colorBackground: "#1e293b",
    colorInput: "#0f172a",
    colorInputForeground: "#f1f5f9",
    colorForeground: "#f1f5f9",
    colorMutedForeground: "#94a3b8",
    colorMuted: "#334155",
    colorBorder: "#334155",
    colorDanger: "#ef4444",
    colorSuccess: "#22c55e",
    colorRing: "#3b82f6",
    colorShadow: "rgba(0,0,0,0.3)",
    colorModalBackdrop: "rgba(15,23,42,0.8)",
    borderRadius: "0.5rem",
  },
  elements: {
    card: "shadow-xl border border-slate-700",
    headerTitle: "text-slate-100",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton: "border-slate-600 bg-slate-800/80 text-slate-200 hover:bg-slate-700",
    formFieldLabel: "text-slate-300",
    formFieldInput: "bg-slate-900 border-slate-600 text-slate-100",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-500 text-white",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    dividerLine: "bg-slate-700",
    dividerText: "text-slate-400",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 py-8 sm:px-6">
      <div className="w-full max-w-[420px]">
        <SignIn
          appearance={appearance}
          routing="path"
          path="/sign-in"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  );
}
