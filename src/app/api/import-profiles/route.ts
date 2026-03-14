import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET() {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const profiles = await prisma.importProfile.findMany({
      orderBy: { lastUsed: "desc" },
    });
    return Response.json(profiles);
  } catch (err) {
    console.error("[import-profiles GET]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to list profiles" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const body = await request.json();
    const {
      name,
      targetTable,
      fileType,
      mapping,
      config = {},
    } = body as {
      name?: string;
      targetTable?: string;
      fileType?: string;
      mapping?: Record<string, string>;
      config?: Record<string, unknown>;
    };
    if (!name || typeof name !== "string" || !name.trim()) {
      return Response.json({ error: "Profile name is required." }, { status: 400 });
    }
    const allowedTargets = ["MASTER_CATALOG", "SUPPLIER_STOCK"];
    if (!targetTable || !allowedTargets.includes(targetTable)) {
      return Response.json(
        { error: "targetTable must be MASTER_CATALOG or SUPPLIER_STOCK." },
        { status: 400 }
      );
    }
    const allowedFileTypes = ["CSV", "XML", "XLSX"];
    if (!fileType || !allowedFileTypes.includes(fileType)) {
      return Response.json(
        { error: "fileType must be CSV, XML, or XLSX." },
        { status: 400 }
      );
    }
    if (!mapping || typeof mapping !== "object") {
      return Response.json({ error: "mapping object is required." }, { status: 400 });
    }
    const now = new Date();
    const profile = await prisma.importProfile.upsert({
      where: { name: name.trim() },
      create: {
        name: name.trim(),
        targetTable,
        fileType,
        mapping: mapping as object,
        config: (config && typeof config === "object" ? config : {}) as object,
        lastUsed: now,
      },
      update: {
        targetTable,
        fileType,
        mapping: mapping as object,
        config: (config && typeof config === "object" ? config : {}) as object,
        lastUsed: now,
      },
    });
    return Response.json(profile);
  } catch (err) {
    console.error("[import-profiles POST]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to save profile" },
      { status: 500 }
    );
  }
}
