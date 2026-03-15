"use client";

import Link from "next/link";
import { UserX } from "lucide-react";

export default function AccountSuspendedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="max-w-md rounded-xl border border-red-900/50 bg-slate-900/80 p-8 text-center">
        <UserX className="mx-auto h-12 w-12 text-red-400" aria-hidden />
        <h1 className="mt-4 text-xl font-semibold text-white">Ο λογαριασμός σας έχει ανασταλεί</h1>
        <p className="mt-2 text-sm text-slate-400">
          Η πρόσβασή σας έχει απενεργοποιηθεί. Επικοινωνήστε με το διαχειριστή για περισσότερες πληροφορίες.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center rounded-lg border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
        >
          Επιστροφή στην αρχική
        </Link>
      </div>
    </div>
  );
}
