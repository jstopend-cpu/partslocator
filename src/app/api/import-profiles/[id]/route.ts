import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import prisma from "@/database/client";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const { id } = await params;
    const profile = await prisma.importProfile.findUnique({
      where: { id },
    });
    if (!profile) {
      return Response.json({ error: "Profile not found." }, { status: 404 });
    }
    return Response.json(profile);
  } catch (err) {
    console.error("[import-profiles GET id]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to get profile" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const { id } = await params;
    await prisma.importProfile.delete({
      where: { id },
    });
    return Response.json({ success: true });
  } catch (err) {
    console.error("[import-profiles DELETE]", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Failed to delete profile" },
      { status: 500 }
    );
  }
}
