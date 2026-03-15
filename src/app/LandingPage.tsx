"use client";

import React from "react";
import Link from "next/link";
import { Inter } from "next/font/google";
import { motion } from "framer-motion";
import { BookOpen, Package, GitBranch, HelpCircle } from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";

const inter = Inter({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600", "700"] });

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-slate-950 ${inter.className}`}>
      {/* Background: uniform dark navy/black, minimal gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(30, 58, 138, 0.08), transparent 60%),
            linear-gradient(rgba(255,255,255,.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.02) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 56px 56px, 56px 56px",
        }}
      />
      <div className="absolute inset-0 bg-slate-950" />

      {/* Top nav: Brand + Login + Sign Up */}
      <nav className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950">
          <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
            PartsLocator
          </span>
        </Link>
        <div className="flex gap-3">
          <Link
            href="/sign-in"
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/80 hover:text-white"
          >
            Είσοδος
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Εγγραφή
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        {/* Hero */}
        <section className="text-center">
          <motion.h1
            className="mx-auto max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl"
            style={{ lineHeight: 1.2 }}
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={fadeInUp.transition}
          >
            Η πρώτη B2B πλατφόρμα εύρεσης ανταλλακτικών, αποκλειστικά για επαγγελματίες.
          </motion.h1>
          <motion.p
            className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl"
            style={{ lineHeight: 1.6 }}
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
          >
            Αποκτήστε πρόσβαση σε πραγματικό χρόνο στα αποθέματα των μεγαλύτερων προμηθευτών. Όλη η αγορά σε μία οθόνη.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
          >
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(99,102,241,0.55)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Δωρεάν Εγγραφή
            </Link>
            <Link
              href="/dashboard/help"
              className="inline-flex items-center justify-center rounded-xl border-2 border-white/40 bg-transparent px-8 py-4 text-base font-semibold text-white transition-colors hover:border-white/60 hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Επικοινωνία με τις πωλήσεις
            </Link>
          </motion.div>
        </section>

        {/* Features */}
        <section className="mt-24 grid gap-8 sm:grid-cols-2 lg:mt-32 lg:grid-cols-3">
          {[
            {
              icon: BookOpen,
              title: "Master Catalog",
              description: "1.000.000+ κωδικοί με πλήρη τεχνικά χαρακτηριστικά.",
            },
            {
              icon: Package,
              title: "Live Inventory",
              description: "Πραγματικά αποθέματα και τιμές χονδρικής χωρίς αναμονές.",
            },
            {
              icon: GitBranch,
              title: "Smart Mapping",
              description: "Αυτόματη αντιστοίχιση κωδικών και cross-referencing.",
            },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm"
              initial={fadeInUp.initial}
              animate={fadeInUp.animate}
              transition={{ ...fadeInUp.transition, delay: 0.3 + i * 0.1 }}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.description}</p>
            </motion.div>
          ))}
        </section>

        <Pricing />

        {/* Footer */}
        <footer className="relative z-10 mt-24 border-t border-slate-800 py-8 sm:mt-32 sm:py-10">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:gap-6">
            <span className="text-sm font-semibold text-slate-400">
              PartsLocator © 2026
            </span>
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard/help"
                className="inline-flex items-center gap-2 text-sm text-slate-400 transition-colors hover:text-slate-200"
              >
                <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
                Κέντρο Βοήθειας
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
