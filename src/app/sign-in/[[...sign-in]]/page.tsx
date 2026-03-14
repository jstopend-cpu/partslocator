import { SignIn } from "@clerk/nextjs";

const appearance = {
  options: {
    socialButtonsVariant: "blockButton" as const,
  },
  variables: {
    colorPrimary: "#3b82f6",
    colorText: "#ffffff",
    colorForeground: "#ffffff",
    colorBackground: "#1e293b",
    colorInput: "#0f172a",
    colorInputBackground: "#0f172a",
    colorInputForeground: "#ffffff",
    colorInputText: "#ffffff",
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
    card: "bg-slate-800 border border-slate-700 shadow-2xl",
    headerTitle: "text-white",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton: "bg-slate-700 border-slate-600 hover:bg-slate-600 text-white",
    socialButtonsBlockButtonText: "text-white font-medium",
    formFieldLabel: "text-slate-300",
    formFieldInput: "bg-slate-950 border-slate-600 text-white",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    dividerLine: "bg-slate-700",
    dividerText: "text-slate-400",
    footer: "mt-6",
    footerPagesLink: "text-slate-400",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 pb-24 pt-8 sm:px-6 sm:pb-28">
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
