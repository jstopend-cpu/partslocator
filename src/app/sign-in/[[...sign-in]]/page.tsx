import { Suspense } from "react";
import { SignIn } from "@clerk/nextjs";
import { RegisteredBanner } from "../RegisteredBanner";

const appearance = {
  variables: {
    colorPrimary: "#4f46e5",
    colorText: "#1f2937",
    colorBackground: "#ffffff",
    colorInputBackground: "#ffffff",
    colorInputText: "#1f2937",
    colorTextSecondary: "#6b7280",
  },
  elements: {
    card: "shadow-xl border border-gray-200 rounded-xl",
    headerTitle: "text-gray-900 text-2xl font-bold",
    headerSubtitle: "text-gray-500",
    socialButtonsBlockButton: "bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm",
    socialButtonsBlockButtonText: "text-gray-600 font-semibold",
    formButtonPrimary: "bg-indigo-600 hover:bg-indigo-700 text-white shadow-md normal-case text-sm",
    formFieldLabel: "text-gray-700 font-medium",
    formInput: "border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
    footerActionLink: "text-indigo-600 hover:text-indigo-700 font-semibold",
    dividerLine: "bg-gray-200",
    dividerText: "text-gray-400",
  },
};

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f9fafb] px-4 pb-24 pt-8 sm:px-6 sm:pb-28">
      <Suspense fallback={null}>
        <RegisteredBanner />
      </Suspense>
      <div className="w-full max-w-[420px]">
        <SignIn
          appearance={appearance}
          routing="path"
          path="/sign-in"
          signUpUrl="/register"
        />
      </div>
    </div>
  );
}
