import { NextRequest, NextResponse } from "next/server";
// @ts-ignore
import nodemailer from "nodemailer";

type CartItemPayload = {
  productId: string;
  name: string;
  ean: string;
  supplier: string;
  quantity: number;
};

type CustomerPayload = {
  name: string;
  email: string;
  code: string;
};

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { customer?: CustomerPayload; items?: CartItemPayload[] }
      | null;

    if (!body?.customer || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Missing customer or items payload." },
        { status: 400 },
      );
    }

    const { customer, items } = body;

    const host = process.env.EMAIL_HOST;
    const port = Number(process.env.EMAIL_PORT || 587);
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const to =
      process.env.REQUEST_TARGET_EMAIL || process.env.EMAIL_TO || process.env.EMAIL_USER;

    if (!host || !user || !pass || !to) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email transport is not configured. Please set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS and REQUEST_TARGET_EMAIL (or EMAIL_TO).",
        },
        { status: 500 },
      );
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });

    const subject = `Νέο αίτημα ανταλλακτικών από ${customer.name} (${customer.code})`;

    const lines = items.map(
      (item, index) =>
        `${index + 1}. ${item.name} | EAN: ${item.ean} | Supplier: ${item.supplier} | Qty: ${
          item.quantity
        }`,
    );

    const text = [
      `Νέο αίτημα ανταλλακτικών από πελάτη B2B:`,
      "",
      `Πελάτης: ${customer.name}`,
      `Email: ${customer.email}`,
      `Κωδικός πελάτη: ${customer.code}`,
      "",
      "Ανταλλακτικά στο καλάθι:",
      ...lines,
      "",
      "— Parts Locator B2B Portal",
    ].join("\n");

    await transporter.sendMail({
      from: `"Parts Locator" <${user}>`,
      to,
      subject,
      text,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Request email error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to send request email." },
      { status: 500 },
    );
  }
}

