import nodemailer from "nodemailer";

/**
 * Send notification to a supplier: "You have a new order from PartsLocator for [Product Name(s)]"
 */
export async function sendSupplierOrderNotification(
  supplierEmail: string,
  supplierName: string,
  productNames: string[],
): Promise<{ ok: true } | { ok: false; error: string }> {
  const host = process.env.EMAIL_HOST;
  const port = Number(process.env.EMAIL_PORT || 587);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    console.warn("[email] Supplier notification skipped: EMAIL_HOST/USER/PASS not set.");
    return { ok: false, error: "Email not configured." };
  }

  const productList =
    productNames.length > 0
      ? productNames.join(", ")
      : "—";

  const subject = `Νέα παραγγελία από PartsLocator – ${supplierName}`;
  const text = [
    `Γεια σας ${supplierName},`,
    "",
    "You have a new order from PartsLocator for:",
    productList,
    "",
    "— PartsLocator",
  ].join("\n");

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });

    await transporter.sendMail({
      from: `"PartsLocator" <${user}>`,
      to: supplierEmail,
      subject,
      text,
    });
    return { ok: true };
  } catch (e) {
    console.error("[email] sendSupplierOrderNotification:", e);
    return { ok: false, error: e instanceof Error ? e.message : "Failed to send email." };
  }
}
