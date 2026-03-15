import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const ADMIN_EMAIL = "jstopend@gmail.com";

/**
 * Send a critical alert email to the admin (e.g. new team invitation, system error).
 * Fails silently if RESEND_API_KEY is not set.
 */
export async function sendAdminCriticalEmail(subject: string, body: string): Promise<boolean> {
  if (!resend) {
    console.warn("sendAdminCriticalEmail: RESEND_API_KEY not set, skipping.");
    return false;
  }
  try {
    const { error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: ADMIN_EMAIL,
      subject: `[PartsLocator] ${subject}`,
      html: `
        <div style="font-family:sans-serif;max-width:560px;margin:0 auto;">
          <h2 style="color:#1e293b;">${subject}</h2>
          <pre style="background:#f1f5f9;padding:16px;border-radius:8px;white-space:pre-wrap;word-break:break-word;">${body.replace(/</g, "&lt;")}</pre>
        </div>
      `,
    });
    if (error) {
      console.error("sendAdminCriticalEmail:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("sendAdminCriticalEmail:", e);
    return false;
  }
}
