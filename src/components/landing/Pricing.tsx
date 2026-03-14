"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4 },
};

const STARTER_FEATURES = [
  "Αναζήτηση κωδικών",
  "Τιμές καταλόγου (MSRP)",
  "Βασικές πληροφορίες",
];

const PRO_FEATURES = [
  "Ακριβείς τιμές χονδρικής",
  "Real-time αποθέματα προμηθευτών",
  "Ονόματα & στοιχεία προμηθευτών",
  "Εκτιμήσεις χρόνου παράδοσης",
  "Προτεραιότητα στην υποστήριξη",
];

export function Pricing() {
  return (
    <section className="relative mt-24 lg:mt-32" id="pricing">
      <motion.div
        className="text-center"
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={fadeInUp.transition}
      >
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Επιλέξτε το πλάνο που σας ταιριάζει
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-slate-400">
          Ξεκινήστε δωρεάν ή ξεκλειδώστε την πλήρη ισχύ του PartsLocator PRO.
        </p>
      </motion.div>

      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-2 lg:gap-6">
        {/* Starter */}
        <motion.div
          className="flex flex-col rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-sm lg:p-8"
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.1 }}
        >
          <h3 className="text-xl font-semibold text-white">Starter</h3>
          <p className="mt-1 text-sm text-slate-400">Για περιστασιακή χρήση</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">0€</span>
          </div>
          <ul className="mt-6 space-y-3">
            {STARTER_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-300">
                <Check className="h-5 w-5 shrink-0 text-emerald-400" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 inline-flex w-full justify-center rounded-xl border-2 border-slate-600 bg-slate-800/50 px-4 py-3 text-center font-semibold text-white transition-colors hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Ξεκινήστε δωρεάν
          </Link>
        </motion.div>

        {/* PRO */}
        <motion.div
          className="relative flex flex-col rounded-2xl border-2 border-indigo-500/60 bg-gradient-to-b from-indigo-950/30 to-slate-900/80 p-6 shadow-[0_0_40px_rgba(99,102,241,0.12)] backdrop-blur-sm lg:p-8"
          initial={fadeInUp.initial}
          animate={fadeInUp.animate}
          transition={{ ...fadeInUp.transition, delay: 0.15 }}
        >
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border border-amber-400/50 bg-amber-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-200">
            Best Value
          </div>
          <h3 className="text-xl font-semibold text-white">PRO</h3>
          <p className="mt-1 text-sm text-slate-300">Για τον επαγγελματία που θέλει αποτελέσματα</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold text-white">29€</span>
            <span className="text-slate-400">/μήνα</span>
          </div>
          <ul className="mt-6 space-y-3">
            {PRO_FEATURES.map((feature) => (
              <li key={feature} className="flex items-center gap-3 text-sm text-slate-200">
                <Check className="h-5 w-5 shrink-0 text-indigo-400" />
                {feature}
              </li>
            ))}
          </ul>
          <Link
            href="/register"
            className="mt-8 inline-flex w-full justify-center rounded-xl bg-indigo-600 px-4 py-3 text-center font-semibold text-white shadow-[0_0_25px_rgba(99,102,241,0.4)] transition-all hover:bg-indigo-500 hover:shadow-[0_0_35px_rgba(99,102,241,0.55)] focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Αναβάθμιση σε PRO
          </Link>
        </motion.div>
      </div>

      <motion.p
        className="mx-auto mt-10 max-w-2xl text-center text-xs text-slate-500"
        initial={fadeInUp.initial}
        animate={fadeInUp.animate}
        transition={{ ...fadeInUp.transition, delay: 0.2 }}
      >
        Οι τιμές δεν περιλαμβάνουν ΦΠΑ. Διαθέσιμο μόνο για επαγγελματίες με έγκυρο ΑΦΜ.
      </motion.p>
    </section>
  );
}
