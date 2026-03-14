import { SignUp } from "@clerk/nextjs";

const appearance = {
  baseTheme: undefined,
  variables: {
    colorPrimary: "#3b82f6",
    colorText: "#ffffff",
    colorBackground: "#1e293b",
    colorInputBackground: "#0f172a",
    colorInputText: "#ffffff",
    colorTextSecondary: "#94a3b8",
  },
  elements: {
    card: "bg-slate-800 border border-slate-700 shadow-2xl rounded-2xl",
    headerTitle: "text-white text-2xl font-bold",
    headerSubtitle: "text-slate-400",
    socialButtonsBlockButton: "bg-slate-700 border-slate-600 hover:bg-slate-600 transition-colors",
    socialButtonsBlockButtonText: "text-white font-semibold",
    socialButtonsBlockButtonArrow: "text-white",
    formFieldLabel: "text-slate-300",
    formInput: "bg-slate-950 border-slate-700 text-white focus:border-blue-500",
    footerActionLink: "text-blue-400 hover:text-blue-300",
    identityPreviewText: "text-white",
    formButtonPrimary: "bg-blue-600 hover:bg-blue-700 transition-all",
    dividerLine: "bg-slate-700",
    dividerText: "text-slate-500",
  },
};

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 pb-24 pt-8 sm:px-6 sm:pb-28">
      <div className="w-full max-w-[420px]">
        <SignUp
          appearance={appearance}
          routing="path"
          path="/sign-up"
          signInUrl="/sign-in"
        />
      </div>
    </div>
  );
}
