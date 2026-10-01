import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { CLIENT_AUDIT_ACTIONS, writeAudit } from "@/lib/audit";
import type { AuditActionName } from "@/lib/audit";
import {
  ApiError,
  handle,
  intParam,
  readJson,
  requireAdmin,
  requireUser,
  resolveHoaId,
} from "@/lib/api";

// GET /api/audit — audit log for the current HOA, or every community for a
// superadmin who hasn't picked one.
export const GET = handle("GET /api/audit", async (req: Request) => {
  const user = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const limit = intParam(searchParams.get("limit"), 50, 1, 200);
  const offset = intParam(searchParams.get("offset"), 0, 0, 1_000_000);

  const hoaId = resolveHoaId(user, searchParams.get("hoaId"));
  if (!hoaId && user.role !== "superadmin") {
    throw new ApiError(400, "No HOA context.");
  }

  const where = hoaId ? { hoaId } : {};

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      documentId: e.documentId,
      documentTitle: e.documentTitle,
      userEmail: e.user.email,
      userName: e.user.name,
      ipAddress: e.ipAddress,
      timestamp: e.timestamp,
    })),
    total,
    limit,
    offset,
  });
});

// POST /api/audit — record a view/download reported by the browser.
export const POST = handle("POST /api/audit", async (req: Request) => {
  const user = await requireUser();
  const { action, documentId, documentTitle } = await readJson(req);

  if (!action) throw new ApiError(400, "Action is required.");
  // Browsers may only report their own reads. CREATE / UPDATE / DELETE and
  // blocked attempts are written by the server, so they can't be forged.
  if (!CLIENT_AUDIT_ACTIONS.includes(action)) {
    throw new ApiError(400, "Unsupported audit action.");
  }

  // File the entry under the document's own community when there is one —
  // a superadmin has no HOA of their own to log against.
  let hoaId = user.hoaId;
  if (documentId) {
    const doc = await prisma.document.findUnique({
      where: { id: String(documentId) },
      select: { hoaId: true },
    });
    if (doc && (user.role === "superadmin" || doc.hoaId === user.hoaId)) {
      hoaId = doc.hoaId;
    }
  }

  if (!hoaId) return NextResponse.json({ success: false, logged: false });

  const logged = await writeAudit({
    hoaId,
    userId: user.id,
    action: action as AuditActionName,
    documentId: documentId ? String(documentId) : null,
    documentTitle: documentTitle ? String(documentTitle) : null,
    req,
  });

  return NextResponse.json({ success: logged, logged });
});
