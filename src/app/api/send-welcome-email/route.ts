import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/database/client";

export const dynamic = "force-dynamic";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const FROM_NAME = "PartsLocator";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      email?: string;
      businessName?: string;
      afm?: string;
    };
    const email = typeof body?.email === "string" ? body.email.trim() : "";
    const businessName = typeof body?.businessName === "string" ? body.businessName.trim() : "Επώνυμο Εταιρείας";
    const afm = typeof body?.afm === "string" ? body.afm.trim() : "";

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Missing email." },
        { status: 400 }
      );
    }

    if (!resend) {
      return NextResponse.json(
        { success: false, error: "Email service is not configured (RESEND_API_KEY missing)." },
        { status: 503 }
      );
    }

    const subject = "Καλώς ήρθατε στο PartsLocator!";
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f1f5f9;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.07);">
    <div style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:32px 24px;text-align:center;">
      <h1 style="margin:0;color:#fff;font-size:1.5rem;font-weight:700;">PartsLocator</h1>
      <p style="margin:8px 0 0;color:rgba(255,255,255,0.9);font-size:0.95rem;">Καλώς ήρθατε!</p>
    </div>
    <div style="padding:28px 24px;color:#334155;line-height:1.6;">
      <p style="margin:0 0 16px;">Γεια σας <strong>${escapeHtml(businessName)}</strong>,</p>
      <p style="margin:0 0 16px;">Η εγγραφή σας ολοκληρώθηκε με επιτυχία. Τώρα έχετε πρόσβαση στον Master Catalog.</p>
      <p style="margin:0 0 0;">Για να ξεκλειδώσετε τις PRO δυνατότητες (τιμές χονδρικής, διαθεσιμότητες), μπορείτε να αναβαθμίσετε το πλάνο σας από το Dashboard.</p>
    </div>
    <div style="padding:20px 24px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
      <p style="margin:0;font-size:0.8rem;color:#64748b;">— PartsLocator B2B</p>
    </div>
  </div>
</body>
</html>
`.trim();

    const { error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [email],
      subject,
      html,
    });

    if (error) {
      console.error("send-welcome-email:", error);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const now = new Date();
    await prisma.b2BRegistration.upsert({
      where: { email },
      create: {
        email,
        companyName: businessName,
        afm: afm || "—",
        registeredAt: now,
        welcomeEmailSentAt: now,
      },
      update: {
        companyName: businessName,
        afm: afm || "—",
        welcomeEmailSentAt: now,
      },
    });

    return NextResponse.json({ success: true });
  } catch (e) {
    console.error("send-welcome-email:", e);
    return NextResponse.json(
      { success: false, error: "Failed to send welcome email." },
      { status: 500 }
    );
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
