import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmailToEach, newDocumentEmailHtml } from "@/lib/email";
import { FILE_META_SELECT, presentDocument } from "@/lib/documents";
import { writeAudit } from "@/lib/audit";
import {
  ApiError,
  getSessionUser,
  handle,
  readJson,
  requireAdmin,
  resolveHoaId,
} from "@/lib/api";
import type { UserRole } from "@/types";

const CATEGORIES: readonly string[] = [
  "governing",
  "financial",
  "meetings",
  "contracts",
  "architectural",
  "insurance",
  "violations",
  "legal",
];

function toPages(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  if (Number.isNaN(n) || n < 0) {
    throw new ApiError(400, "Pages must be a whole number.");
  }
  return n;
}

// GET /api/documents — documents the viewer may see.
//   visitor     → public documents of ?hoaId=
//   resident    → resident-accessible documents of their HOA
//   admin       → everything in their HOA
//   superadmin  → ?hoaId=, or every community when none is given
export const GET = handle("GET /api/documents", async (req: Request) => {
  const user = await getSessionUser();
  const role = (user?.role ?? "public") as UserRole;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.trim().toLowerCase() ?? "";
  const category = searchParams.get("category") ?? "all";
  const requestedHoaId = searchParams.get("hoaId");

  const targetHoaId = user
    ? resolveHoaId(user, requestedHoaId)
    : requestedHoaId;

  if (!targetHoaId && role !== "superadmin") {
    throw new ApiError(400, "No HOA context provided.");
  }

  const where: Record<string, unknown> = {};
  if (targetHoaId) where.hoaId = targetHoaId;
  if (role === "public") where.isPublic = true;
  else if (role === "resident") where.isAccessibleToResidents = true;
  if (category !== "all") where.category = category;

  const docs = await prisma.document.findMany({
    where,
    orderBy: [{ category: "asc" }, { uploadDate: "desc" }],
    include: { file: { select: FILE_META_SELECT } },
  });

  const filtered = search
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.category.toLowerCase().includes(search)
      )
    : docs;

  return NextResponse.json(filtered.map((doc) => presentDocument(doc, role)));
});

// POST /api/documents — add a document (admin only).
// The file itself, if any, is uploaded afterwards to /api/documents/[id]/file.
export const POST = handle("POST /api/documents", async (req: Request) => {
  const user = await requireAdmin();
  const body = await readJson(req);
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
    notifyResidents = true,
  } = body;

  const hoaId = resolveHoaId(user, body.hoaId);
  if (!hoaId) {
    throw new ApiError(
      400,
      "Your account isn't assigned to a community, so there is nowhere to file this document."
    );
  }

  if (typeof title !== "string" || !title.trim() || !category) {
    throw new ApiError(400, "Title and category are required.");
  }
  // A document needs something to read: an uploaded file, typed text, or both.
  const text = typeof content === "string" ? content.trim() : "";
  if (!text && !hasFile) {
    throw new ApiError(400, "Attach a file or enter the document text.");
  }
  if (!CATEGORIES.includes(category)) {
    throw new ApiError(400, "Unknown document category.");
  }

  const residentAccess = isAccessibleToResidents ?? true;
  const publicAccess = isPublic ?? false;

  const doc = await prisma.document.create({
    data: {
      hoaId,
      title: title.trim(),
      category,
      content: text,
      isPublic: publicAccess,
      isAccessibleToResidents: residentAccess,
      requiresLogin: requiresLogin ?? true,
      isMandatoryRecord: isMandatoryRecord ?? false,
      fileSize: fileSize || null,
      pages: toPages(pages),
      uploadedBy: user.id,
    },
  });

  await writeAudit({
    hoaId,
    userId: user.id,
    action: "CREATE",
    documentId: doc.id,
    documentTitle: doc.title,
    req,
  });

  // Tell residents, when the document is one they can actually open.
  if (notifyResidents && (residentAccess || publicAccess)) {
    try {
      const [hoa, residents] = await Promise.all([
        prisma.hOA.findUnique({ where: { id: hoaId } }),
        prisma.user.findMany({
          where: { hoaId, role: "resident", active: true },
          select: { email: true },
        }),
      ]);

      if (hoa && residents.length > 0) {
        const loginUrl = `${
          process.env.NEXTAUTH_URL ?? "https://myflhoa.org"
        }/login`;

        // Sent as separate emails: a shared "to" line would show every
        // resident's address to every other resident.
        await sendEmailToEach(
          residents.map((r) => r.email),
          `New Document: ${doc.title} — ${hoa.name}`,
          newDocumentEmailHtml({
            hoaName: hoa.name,
            accentColor: hoa.accentColor,
            documentTitle: doc.title,
            category: doc.category,
            uploadedBy: user.name ?? user.email ?? "Your HOA Admin",
            loginUrl,
          })
        );
      }
    } catch (emailErr) {
      // Don't fail the request if email fails
      console.error("Email notification error:", emailErr);
    }
  }

  return NextResponse.json(doc, { status: 201 });
});
