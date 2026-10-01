import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { FILE_META_SELECT, mayOpen, presentDocument } from "@/lib/documents";
import { ApiError, getSessionUser, handle } from "@/lib/api";
import type { UserRole } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/docs/[id] — one document, redacted for the viewer. Visitors may
// read public documents; signed-in access (and blocked attempts) is written
// to the audit trail.
export const GET = handle(
  "GET /api/docs/[id]",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const user = await getSessionUser();

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { file: { select: FILE_META_SELECT } },
    });

    // Another community's document is reported as missing, not forbidden,
    // so its existence isn't revealed.
    if (!doc) throw new ApiError(404, "Not found");
    if (user && user.role !== "superadmin" && doc.hoaId !== user.hoaId) {
      throw new ApiError(404, "Not found");
    }

    if (!mayOpen(doc, user)) {
      if (!user) throw new ApiError(401, "Sign in to view this document.");
      await writeAudit({
        hoaId: doc.hoaId,
        userId: user.id,
        action: "UNAUTHORIZED_ACCESS_ATTEMPT",
        documentId: doc.id,
        documentTitle: doc.title,
        req,
      });
      throw new ApiError(403, "Access Denied");
    }

    if (user) {
      await writeAudit({
        hoaId: doc.hoaId,
        userId: user.id,
        action: "VIEW",
        documentId: doc.id,
        documentTitle: doc.title,
        req,
      });
    }

    const role = (user?.role ?? "public") as UserRole;
    return NextResponse.json(presentDocument(doc, role));
  }
);
