import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

/** Greek AFM: 9 digits. Optional leading zero. */
const AFM_REGEX = /^\d{9}$/;

/**
 * Check if activity/KAD is related to automotive / spare parts.
 * In production, use official KAD codes (e.g. 45.32, 45.20, 50.20).
 */
function isAutomotiveActivity(activity: string | undefined): boolean {
  if (!activity || !activity.trim()) return false;
  const lower = activity.toLowerCase();
  const keywords = [
    "αυτοκίνητο",
    "αυτοκινητο",
    "ανταλλακτικό",
    "ανταλλακτικο",
    "όχημα",
    "οχημα",
    "επισκευή οχημάτων",
    "επισκευη οχηματων",
    "εμπόριο οχημάτων",
    "εμποριο οχηματων",
    "automotive",
    "spare parts",
    "car",
    "vehicle",
    "45.32",
    "45.20",
    "50.20",
  ];
  return keywords.some((k) => lower.includes(k));
}

export type VerifyAFMResponse =
  | { ok: true; companyName: string; activity: string; address: string; kad?: string; isAutomotive: boolean }
  | { ok: false; error: string };

export async function POST(request: NextRequest): Promise<NextResponse<VerifyAFMResponse>> {
  try {
    const body = await request.json();
    const afm = typeof body?.afm === "string" ? body.afm.replace(/\s/g, "") : "";

    if (!AFM_REGEX.test(afm)) {
      return NextResponse.json(
        { ok: false, error: "Άκυρο ΑΦΜ. Πρέπει να είναι 9 ψηφία." },
        { status: 400 }
      );
    }

    // Production: replace with AADE / myDATA or Open Data API call.
    // Example: fetch from https://www.aade.gr/... or use a certified provider.
    const mockByAfm: Record<string, { companyName: string; activity: string; address: string; kad?: string }> = {
      "123456789": {
        companyName: "ΕΠΕ Δοκιμαστικό Αυτοκινητιστικό",
        activity: "Εμπόριο ανταλλακτικών οχημάτων (45.32)",
        address: "Λεωφ. Πατριών 123, 104 45 Αθήνα",
        kad: "45.32",
      },
      "987654321": {
        companyName: "Άλλο ΕΠΕ Δοκιμή",
        activity: "Λιανικό εμπόριο τροφίμων (47.11)",
        address: "Οδός Πάρου 5, 105 58 Αθήνα",
        kad: "47.11",
      },
    };

    let companyName: string;
    let activity: string;
    let address: string;
    let kad: string | undefined;

    if (mockByAfm[afm]) {
      const data = mockByAfm[afm];
      companyName = data.companyName;
      activity = data.activity;
      address = data.address;
      kad = data.kad;
    } else {
      // Simulate external lookup: return generic data so UI can be tested.
      // In production, call AADE/OpenData here and return real data or 404.
      companyName = `Εταιρεία ΑΦΜ ${afm}`;
      activity = "Δραστηριότητα (ενσωμάτωση με AADE για πραγματικά δεδομένα)";
      address = "Διεύθυνση (ενσωμάτωση με AADE)";
    }

    const isAutomotive = isAutomotiveActivity(activity);

    return NextResponse.json({
      ok: true,
      companyName,
      activity,
      address,
      kad,
      isAutomotive,
    });
  } catch (e) {
    console.error("verify-afm:", e);
    return NextResponse.json(
      { ok: false, error: "Σφάλμα επαλήθευσης ΑΦΜ." },
      { status: 500 }
    );
  }
}
