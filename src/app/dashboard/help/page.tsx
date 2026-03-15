"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, HelpCircle, ChevronDown, Mail, MessageCircle, Send } from "lucide-react";

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
] as const;

const SUPPORT_EMAIL = "support@partslocator.gr";
const WHATSAPP_PLACEHOLDER = "https://wa.me/302101234567";

export default function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");

  const toggleAccordion = (index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSubmitting(true);
    setSubmitStatus("idle");
    try {
      // Placeholder: replace with your API or email action
      await new Promise((r) => setTimeout(r, 600));
      setSubmitStatus("success");
      setName("");
      setMessage("");
    } catch {
      setSubmitStatus("error");
    } finally {
      setSubmitting(false);
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

      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        {/* FAQ Section */}
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
                    <ChevronDown
                      className={`h-5 w-5 shrink-0 text-slate-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      aria-hidden
                    />
                  </button>
                  <div
                    className={`grid transition-[grid-template-rows] duration-200 ease-out ${isOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                  >
                    <div className="overflow-hidden">
                      <div className="border-t border-slate-800 bg-slate-900/30 px-4 pb-4 pt-2 sm:px-5 sm:pt-3">
                        <p className="text-sm leading-relaxed text-slate-400">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Contact Support Card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 sm:p-8">
          <h2 className="mb-6 text-base font-semibold uppercase tracking-wider text-slate-400 sm:text-sm">
            Επικοινωνία με την υποστήριξη
          </h2>

          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:gap-6">
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              <Mail className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm font-medium">{SUPPORT_EMAIL}</span>
            </a>
            <a
              href={WHATSAPP_PLACEHOLDER}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-slate-200 transition-colors hover:border-slate-600 hover:bg-slate-800"
            >
              <MessageCircle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              <span className="text-sm font-medium">WhatsApp / Τηλέφωνο</span>
            </a>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="help-name" className="mb-1.5 block text-xs font-medium text-slate-500">
                Όνομα
              </label>
              <input
                id="help-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Το όνομά σας"
                required
                className="w-full rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
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
                rows={4}
                className="w-full resize-y rounded-lg border border-slate-700 bg-slate-800/80 px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            {submitStatus === "success" && (
              <p className="text-sm text-emerald-400">Το μήνυμα στάλθηκε με επιτυχία.</p>
            )}
            {submitStatus === "error" && (
              <p className="text-sm text-red-400">Αποτυχία αποστολής. Δοκιμάστε ξανά ή στείλτε email.</p>
            )}
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
        </section>
      </main>
    </div>
  );
}
