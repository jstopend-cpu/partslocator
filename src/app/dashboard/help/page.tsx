"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, HelpCircle, ChevronDown, Mail, MessageCircle, Send } from "lucide-react";
import { submitSupportTicket, type SupportPriority } from "@/app/actions/support";

const FAQ_ITEMS = [
  {
    question: "Πώς μπορώ να αναζητήσω ανταλλακτικά;",
    answer:
      "Χρησιμοποιήστε τη γραμμή αναζήτησης στο πάνω μέρος ή επιλέξτε μάρκα από το πλάι.",
  },
  {
    question: "Τι κάνω αν δεν βρίσκω έναν κωδικό;",
    answer:
      "Επικοινωνήστε με την υποστήριξη μέσω της παρακάτω φόρμας ή καλέστε μας στο [Τηλέφωνο].",
  },
  {
    question: "Πώς προσθέτω μέλη στην ομάδα μου;",
    answer: "Αυτό είναι διαθέσιμο μόνο για λογαριασμούς Admin.",
  },
  {
    question: "Πόσο διαρκεί η παράδοση παραγγελιών;",
    answer: "Συνήθως 2-5 εργάσιμες ημέρες ανάλογα την περιοχή. Για ακρίβεια επικοινωνήστε με την υποστήριξη.",
  },
  {
    question: "Πώς αλλάζω τα στοιχεία του λογαριασμού μου;",
    answer: "Από το εικονίδιο προφίλ πάνω δεξιά μπορείτε να ανοίξετε τις ρυθμίσεις και να ενημερώσετε τα στοιχεία σας.",
  },
] as const;

const SUPPORT_EMAIL = "support@partslocator.gr";
const WHATSAPP_PLACEHOLDER = "https://wa.me/302101234567";

const PRIORITY_OPTIONS: { value: SupportPriority; label: string }[] = [
  { value: "LOW", label: "Χαμηλή" },
  { value: "MEDIUM", label: "Μέτρια" },
  { value: "HIGH", label: "Υψηλή" },
];

const SUCCESS_MESSAGE =
  "Το μήνυμά σας εστάλη! Θα επικοινωνήσουμε μαζί σας σύντομα.";

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<SupportPriority>("MEDIUM");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) return;
    setSubmitting(true);
    setSubmitStatus("idle");
    setErrorMessage("");
    const result = await submitSupportTicket(subject.trim(), message.trim(), priority);
    setSubmitting(false);
    if (result.ok) {
      setSubmitStatus("success");
      setSubject("");
      setMessage("");
      setPriority("MEDIUM");
    } else {
      setSubmitStatus("error");
      setErrorMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-800 bg-slate-950/98 px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-blue-500/50 hover:bg-slate-800 hover:text-blue-300"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Πίσω στο Dashboard</span>
            <span className="sm:hidden">Πίσω</span>
          </Link>
          <h1 className="flex items-center gap-2 text-lg font-semibold text-white sm:text-xl">
            <HelpCircle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
            Κέντρο Βοήθειας
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
        {/* FAQ Section - 5 items with Framer Motion accordion */}
        <section className="mb-12">
          <h2 className="mb-6 text-base font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">
            Συχνές ερωτήσεις
          </h2>
          <ul className="space-y-2">
            {FAQ_ITEMS.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <li
                  key={index}
                  className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50 transition-colors hover:border-slate-700"
                >
                  <button
                    type="button"
                    onClick={() => toggleAccordion(index)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left text-sm font-medium text-slate-200 transition-colors hover:bg-slate-800/50 sm:px-5 sm:py-4"
                    aria-expanded={isOpen}
                  >
                    <span className="flex-1">{item.question}</span>
                    <motion.span
                      animate={{ rotate: isOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="shrink-0"
                    >
                      <ChevronDown className="h-5 w-5 text-slate-500" aria-hidden />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="border-t border-slate-800 bg-slate-900/30 px-4 pb-4 pt-2 sm:px-5 sm:pt-3">
                          <p className="text-sm leading-relaxed text-slate-400">{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contact: Form (left) + Support Card (right) */}
        <section className="grid gap-8 lg:grid-cols-[1fr,320px]">
          {/* Form - left */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
            <h2 className="mb-6 text-base font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">
              Στείλτε μήνυμα
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="help-subject" className="mb-1.5 block text-xs font-medium text-slate-500">
                  Θέμα
                </label>
                <input
                  id="help-subject"
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="π.χ. Ερώτηση για παραγγελία"
                  required
                  maxLength={500}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label htmlFor="help-priority" className="mb-1.5 block text-xs font-medium text-slate-500">
                  Προτεραιότητα
                </label>
                <select
                  id="help-priority"
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as SupportPriority)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                >
                  {PRIORITY_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="help-message" className="mb-1.5 block text-xs font-medium text-slate-500">
                  Μήνυμα
                </label>
                <textarea
                  id="help-message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Γράψτε το μήνυμά σας..."
                  required
                  rows={5}
                  maxLength={5000}
                  className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <AnimatePresence mode="wait">
                {submitStatus === "success" && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-emerald-800/50 bg-emerald-950/30 px-4 py-3 text-sm text-emerald-400"
                  >
                    {SUCCESS_MESSAGE}
                  </motion.p>
                )}
                {submitStatus === "error" && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-400"
                  >
                    {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
              >
                {submitting ? (
                  <span className="animate-pulse">Αποστολή...</span>
                ) : (
                  <>
                    <Send className="h-4 w-4 shrink-0" aria-hidden />
                    Αποστολή
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Support Card - right */}
          <div className="rounded-2xl border border-slate-800 bg-slate-800/50 p-6 sm:p-8 lg:sticky lg:top-24 lg:self-start">
            <h2 className="mb-4 text-base font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">
              Επικοινωνία
            </h2>
            <p className="mb-6 text-sm text-slate-400">
              Μπορείτε επίσης να μας στείλετε email ή να μας καλέσετε απευθείας.
            </p>
            <div className="space-y-4">
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
              >
                <Mail className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                <span className="text-sm font-medium">{SUPPORT_EMAIL}</span>
              </a>
              <a
                href={WHATSAPP_PLACEHOLDER}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/80 px-4 py-3 text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
              >
                <MessageCircle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
                <span className="text-sm font-medium">WhatsApp / Τηλέφωνο</span>
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
