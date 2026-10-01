import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { FILE_META_SELECT } from "@/lib/documents";
import { ApiError, handle, readJson, requireAdmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Confirms the caller is an admin and the document is theirs to change.
// Admins are limited to their own HOA; superadmins are unrestricted.
async function authorizeDocAccess(id: string) {
  const user = await requireAdmin();

  const doc = await prisma.document.findUnique({
    where: { id },
    include: { file: { select: FILE_META_SELECT } },
  });
  if (!doc) throw new ApiError(404, "Not found");

  if (user.role !== "superadmin" && doc.hoaId !== user.hoaId) {
    throw new ApiError(403, "Forbidden");
  }

  return { user, doc };
}

// PATCH /api/documents/[id] — update an existing document
export const PATCH = handle(
  "PATCH /api/documents/[id]",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const { user, doc } = await authorizeDocAccess(id);

    const {
      title,
      category,
      content,
      isPublic,
      isAccessibleToResidents,
      requiresLogin,
      isMandatoryRecord,
      fileSize,
      pages,
      hasFile = false,
    } = await readJson(req);

    if (title !== undefined && !String(title).trim()) {
      throw new ApiError(400, "Title cannot be empty.");
    }
    // Text may be cleared only when a file carries the document instead.
    if (
      content !== undefined &&
      !String(content).trim() &&
      !doc.file &&
      !hasFile
    ) {
      throw new ApiError(400, "Attach a file or enter the document text.");
    }

    let pageCount: number | null | undefined;
    if (pages !== undefined) {
      pageCount = pages ? Number.parseInt(String(pages), 10) : null;
      if (pageCount !== null && (Number.isNaN(pageCount) || pageCount < 0)) {
        throw new ApiError(400, "Pages must be a whole number.");
      }
    }

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(category !== undefined && { category }),
        ...(content !== undefined && { content: String(content).trim() }),
        ...(isPublic !== undefined && { isPublic }),
        ...(isAccessibleToResidents !== undefined && {
          isAccessibleToResidents,
        }),
        ...(requiresLogin !== undefined && { requiresLogin }),
        ...(isMandatoryRecord !== undefined && { isMandatoryRecord }),
        ...(fileSize !== undefined && { fileSize: fileSize || null }),
        ...(pageCount !== undefined && { pages: pageCount }),
      },
    });

    await writeAudit({
      hoaId: doc.hoaId,
      userId: user.id,
      action: "UPDATE",
      documentId: updated.id,
      documentTitle: updated.title,
      req,
    });

    return NextResponse.json(updated);
  }
);

// DELETE /api/documents/[id] — remove a document (and its file, by cascade)
export const DELETE = handle(
  "DELETE /api/documents/[id]",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const { user, doc } = await authorizeDocAccess(id);

    await prisma.document.delete({ where: { id } });

    await writeAudit({
      hoaId: doc.hoaId,
      userId: user.id,
      action: "DELETE",
      documentId: doc.id,
      documentTitle: doc.title,
      req,
    });

    return NextResponse.json({ success: true });
  }
);
