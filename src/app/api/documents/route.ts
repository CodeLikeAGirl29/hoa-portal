import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { UserRole, DocumentCategory } from "@/types";
import { redactDocument } from "@/lib/redaction";

// ─── Access rules mirroring ACCESS_MATRIX ─────────────────────────────────
const RESIDENT_CATEGORIES = new Set([
  "governing",
  "financial",
  "meetings",
  "contracts",
  "architectural",
  "insurance",
  "violations",
]);

function canAccessCategory(category: string, role: UserRole): boolean {
  if (role === "admin" || role === "superadmin") return true;
  if (role === "resident") return RESIDENT_CATEGORIES.has(category);
  return false; // public — filtered by isPublic flag instead
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;
  const role = (sessionUser?.role ?? "public") as UserRole;
  const hoaId = sessionUser?.hoaId as string | null;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search")?.toLowerCase() ?? "";
  const category = searchParams.get("category") ?? "all";

  // Public users must supply an hoaId query param (for public HOA pages).
  // Authenticated users use their session hoaId.
  const targetHoaId = hoaId ?? searchParams.get("hoaId");

  if (!targetHoaId) {
    return NextResponse.json({ error: "No HOA context." }, { status: 400 });
  }

  // Build where clause
  const where: Record<string, unknown> = { hoaId: targetHoaId };

  // Access filtering
  if (role === "public") {
    where.isPublic = true;
  } else if (role === "resident") {
    where.isAccessibleToResidents = true;
  }
  // admin/superadmin: no filter, see everything

  // Category filter
  if (category !== "all") {
    where.category = category;
  }

  const docs = await prisma.document.findMany({
    where,
    orderBy: [{ category: "asc" }, { uploadDate: "desc" }],
  });

  // Text search (done in JS after fetch — small enough datasets for HOA)
  const filtered = search
    ? docs.filter(
        (d) =>
          d.title.toLowerCase().includes(search) ||
          d.category.toLowerCase().includes(search)
      )
    : docs;

  // Map Prisma Document → HOADocument shape, then redact
  const results = filtered.map((doc) => {
    const hoaDoc = {
      id: doc.id,
      hoaId: doc.hoaId,
      title: doc.title,
      category: doc.category as DocumentCategory,
      content: doc.content,
      isPublic: doc.isPublic,
      isAccessibleToResidents: doc.isAccessibleToResidents,
      requiresLogin: doc.requiresLogin,
      uploadDate: doc.uploadDate.toISOString().split("T")[0],
      lastModified: doc.lastModified.toISOString().split("T")[0],
      fileSize: doc.fileSize,
      pages: doc.pages,
      uploadedBy: doc.uploadedBy,
      isMandatoryRecord: doc.isMandatoryRecord,
    };
    return redactDocument(hoaDoc, role);
  });

  return NextResponse.json(results);
}
