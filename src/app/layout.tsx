import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Parts Locator | B2B Dashboard",
  description: "Επαγγελματικό B2B Dashboard για διαχείριση ανταλλακτικών",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="el" className="dark">
      <body
        className={`${dmSans.variable} min-h-screen bg-slate-950 text-slate-100 font-sans antialiased`}
        style={{ margin: 0 }}
      >
        {children}
      </body>
    </html>
  );
}
