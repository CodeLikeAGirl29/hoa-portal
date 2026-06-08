import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { MOCK_DOCUMENTS } from "@/lib/data";
import { canAccess, redactDocument } from "@/lib/redaction";
import type { UserRole } from "@/types";

// Helper to write to your database/audit log
async function logAuditEvent(action: string, docId: string, role: string) {
  // In production, call your DB or external logging service here
  console.log(
    `[AUDIT] Action: ${action}, Document: ${docId}, Actor Role: ${role}, Time: ${new Date().toISOString()}`
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const role = await getServerSessionRole(); // Your existing role logic

    const doc = MOCK_DOCUMENTS.find((d) => d.id === id);

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 1. Enforce Access Matrix
    if (!canAccess(doc, role)) {
      await logAuditEvent("UNAUTHORIZED_ACCESS_ATTEMPT", id, role);
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // 2. Log the successful view event
    await logAuditEvent("VIEW", id, role);

    // 3. Process and return redacted document
    const processedDoc = redactDocument(doc, role);

    return NextResponse.json(processedDoc, {
      status: 200,
      headers: { "Cache-Control": "private, no-store, must-revalidate" },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
