import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(req: Request) {
  // 1. Verify Authentication Server-Side
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Extract data safely
  const { action, documentId, documentTitle, metadata } = await req.json();

  // 3. Get metadata from request headers (tamper-resistant)
  const ipAddress = req.headers.get("x-forwarded-for") || "unknown";
  const userAgent = req.headers.get("user-agent") || "unknown";

  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: session.user?.id,
    userEmail: session.user?.email,
    action,
    documentId,
    documentTitle,
    ipAddress,
    userAgent,
    metadata,
  };

  // 4. Perform database insertion here
  // await db.auditLogs.create({ data: logEntry });
  console.log("[AUDIT LOG]:", logEntry);

  return NextResponse.json({ success: true });
}
