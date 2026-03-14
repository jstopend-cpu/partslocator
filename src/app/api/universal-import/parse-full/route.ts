import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getRowsFromFile, detectFileType } from "@/lib/universal-import/parse";

const ADMIN_USER_ID = "user_3AuVyZoT8xur0En8TTwTVr1cCY2";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (userId !== ADMIN_USER_ID) {
      return Response.json({ error: "Unauthorized." }, { status: 403 });
    }
    const formData = await request.formData();
    const file = formData.get("file");
    if (!file || !(file instanceof File)) {
      return Response.json({ error: "Missing file." }, { status: 400 });
    }
    const fileType = detectFileType(file.name);
    if (!fileType) {
      return Response.json(
        { error: "Unsupported file type. Use CSV, XML, or XLSX." },
        { status: 400 }
      );
    }
    const { rows } = await getRowsFromFile(file);
    return Response.json({ rows });
  } catch (err) {
    console.error("[universal-import/parse-full]", err);
    const message = err instanceof Error ? err.message : "Parse failed";
    return Response.json({ error: message }, { status: 500 });
  }
}
