import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { mayOpen, presentDocument } from "@/lib/documents";
import { contentDisposition, isInlineMime } from "@/lib/files";
import { ApiError, getSessionUser, handle } from "@/lib/api";
import type { UserRole } from "@/types";

type Ctx = { params: Promise<{ id: string }> };

// GET /api/docs/[id]/download — the document as a file.
//   • With an uploaded file: that file, exactly as uploaded.
//   • Without one: a text file of the document, redacted for the viewer.
// Add ?inline=1 to open a PDF or image in the browser instead of saving it.
export const GET = handle(
  "GET /api/docs/[id]/download",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const user = await getSessionUser();
    const wantsInline = new URL(req.url).searchParams.get("inline") === "1";

    const doc = await prisma.document.findUnique({
      where: { id },
      include: { file: true },
    });

    if (!doc) throw new ApiError(404, "Not found");
    if (user && user.role !== "superadmin" && doc.hoaId !== user.hoaId) {
      throw new ApiError(404, "Not found");
    }

    if (!mayOpen(doc, user)) {
      if (!user) throw new ApiError(401, "Sign in to download this document.");
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
        action: wantsInline ? "VIEW" : "DOWNLOAD",
        documentId: doc.id,
        documentTitle: doc.title,
        req,
      });
    }

    // Never cache: access depends on who is asking.
    const baseHeaders = {
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    };

    if (doc.file) {
      const inline = wantsInline && isInlineMime(doc.file.mimeType);
      return new NextResponse(doc.file.data as unknown as BodyInit, {
        status: 200,
        headers: {
          ...baseHeaders,
          "Content-Type": doc.file.mimeType,
          "Content-Length": String(doc.file.size),
          "Content-Disposition": contentDisposition(doc.file.fileName, inline),
        },
      });
    }

    const role = (user?.role ?? "public") as UserRole;
    const shown = presentDocument({ ...doc, file: null }, role);
    const text = [
      shown.title,
      `Category: ${shown.category}`,
      `Last modified: ${shown.lastModified}`,
      shown.wasRedacted
        ? "Note: sensitive details were redacted for your access level."
        : null,
      "",
      shown.content,
      "",
    ]
      .filter((line) => line !== null)
      .join("\r\n");

    return new NextResponse(text, {
      status: 200,
      headers: {
        ...baseHeaders,
        "Content-Type": "text/plain; charset=utf-8",
        "Content-Disposition": contentDisposition(`${doc.title}.txt`, false),
      },
    });
  }
);
