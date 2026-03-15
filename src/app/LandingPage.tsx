"use client";

import React from "react";
import Link from "next/link";
import { Syne } from "next/font/google";
import { motion } from "framer-motion";
import { BookOpen, Package, GitBranch, HelpCircle } from "lucide-react";
import { Pricing } from "@/components/landing/Pricing";

const syne = Syne({ subsets: ["latin", "latin-ext"], weight: ["600", "700", "800"] });

const fadeInUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 },
};

export default function LandingPage() {
  return (
    <div className={`relative min-h-screen overflow-hidden bg-slate-950 ${syne.className}`}>
      {/* Background: mesh gradient + grid */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(to bottom right, rgba(30, 58, 138, 0.15), transparent 50%),
            linear-gradient(to top left, rgba(15, 23, 42, 0.9), transparent 50%),
            linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px)
          `,
          backgroundSize: "100% 100%, 100% 100%, 48px 48px, 48px 48px",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-slate-950/80 to-slate-950" />

      {/* Top nav: Brand + Login + Sign Up */}
      <nav className="relative z-10 flex items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 focus:ring-offset-slate-950 rounded-lg">
          <span
            className="text-xl font-bold tracking-tight text-white sm:text-2xl"
            style={{
              textShadow: "0 0 40px rgba(59, 130, 246, 0.5), 0 0 80px rgba(59, 130, 246, 0.25)",
            }}
          >
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
            href="/sign-up"
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-500"
          >
            Εγγραφή
          </Link>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:py-32">
        {/* Hero */}
        <section className="text-center">
          <motion.div
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={fadeInUp.transition}
            className="mb-8"
          >
            <h1
              className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-white sm:text-6xl lg:text-7xl"
              style={{
                textShadow: "0 0 60px rgba(59, 130, 246, 0.4), 0 0 120px rgba(59, 130, 246, 0.2)",
              }}
            >
              PartsLocator
            </h1>
          </motion.div>
          <motion.p
            className="mx-auto max-w-2xl text-lg font-medium leading-relaxed text-slate-300 sm:text-xl"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.05 }}
          >
            Η έξυπνη αναζήτηση ανταλλακτικών για επαγγελματίες.
          </motion.p>
          <motion.p
            className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400 sm:text-lg"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.1 }}
          >
            Αποκτήστε πρόσβαση σε πραγματικό χρόνο στα αποθέματα των μεγαλύτερων προμηθευτών. Όλη η αγορά σε μία οθόνη.
          </motion.p>
          <motion.div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:flex-wrap"
            initial={fadeInUp.initial}
            animate={fadeInUp.animate}
            transition={{ ...fadeInUp.transition, delay: 0.2 }}
          >
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(99,102,241,0.55)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Get Started
            </Link>
            <Link
              href="/sign-up"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-500 bg-transparent px-8 py-4 text-base font-semibold text-slate-200 transition-colors hover:border-slate-400 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="inline-flex items-center justify-center rounded-xl border-2 border-slate-600 bg-transparent px-8 py-4 text-base font-semibold text-slate-200 transition-colors hover:border-slate-500 hover:bg-slate-800/50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
            >
              Είσοδος
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
