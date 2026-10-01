import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAudit } from "@/lib/audit";
import { ApiError, handle, requireAdmin } from "@/lib/api";
import {
  fileProblem,
  fileTypeFor,
  formatBytes,
  safeFileName,
} from "@/lib/files";

type Ctx = { params: Promise<{ id: string }> };

async function authorize(id: string) {
  const user = await requireAdmin();

  const doc = await prisma.document.findUnique({
    where: { id },
    select: { id: true, hoaId: true, title: true, content: true },
  });
  if (!doc) throw new ApiError(404, "Not found");
  if (user.role !== "superadmin" && doc.hoaId !== user.hoaId) {
    throw new ApiError(403, "Forbidden");
  }
  return { user, doc };
}

// PUT /api/documents/[id]/file — attach a file, replacing any existing one.
// Send as multipart/form-data with the file in a field named "file".
export const PUT = handle(
  "PUT /api/documents/[id]/file",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const { user, doc } = await authorize(id);

    let form: FormData;
    try {
      form = await req.formData();
    } catch {
      throw new ApiError(400, "Send the file as multipart form data.");
    }

    const file = form.get("file");
    if (!file || typeof file === "string") {
      throw new ApiError(400, "No file was attached.");
    }

    const bytes = new Uint8Array(await file.arrayBuffer());
    const fileName = safeFileName(file.name || "file");

    const problem = fileProblem(fileName, bytes.length, bytes.subarray(0, 8));
    if (problem) throw new ApiError(400, problem);

    // The type comes from our own table, never from what the browser claims.
    const mimeType = fileTypeFor(fileName)!.mime;
    const data = { fileName, mimeType, size: bytes.length, data: bytes };

    await prisma.$transaction([
      prisma.documentFile.upsert({
        where: { documentId: id },
        create: { documentId: id, ...data },
        update: { ...data, uploadedAt: new Date() },
      }),
      prisma.document.update({
        where: { id },
        data: { fileSize: formatBytes(bytes.length) },
      }),
    ]);

    await writeAudit({
      hoaId: doc.hoaId,
      userId: user.id,
      action: "UPDATE",
      documentId: doc.id,
      documentTitle: doc.title,
      req,
    });

    return NextResponse.json({ fileName, mimeType, size: bytes.length });
  }
);

// DELETE /api/documents/[id]/file — remove the attached file, keep the text.
export const DELETE = handle(
  "DELETE /api/documents/[id]/file",
  async (req: Request, { params }: Ctx) => {
    const { id } = await params;
    const { user, doc } = await authorize(id);

    if (!doc.content.trim()) {
      throw new ApiError(
        400,
        "This document has no text, so removing the file would leave it empty. Add text first, or delete the document."
      );
    }

    await prisma.$transaction([
      prisma.documentFile.deleteMany({ where: { documentId: id } }),
      prisma.document.update({ where: { id }, data: { fileSize: null } }),
    ]);

    await writeAudit({
      hoaId: doc.hoaId,
      userId: user.id,
      action: "UPDATE",
      documentId: doc.id,
      documentTitle: doc.title,
      req,
    });

    return NextResponse.json({ success: true });
  }
);
