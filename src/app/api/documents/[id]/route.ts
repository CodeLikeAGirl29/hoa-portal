import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/documents/[id] — (kept from your original; note: creation normally
// goes through /api/documents, this mirrors that shape)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.hoaId) {
    return NextResponse.json({ error: "No HOA assigned." }, { status: 400 });
  }

  const body = await req.json();
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
  } = body;

  if (!title || !category || !content) {
    return NextResponse.json(
      { error: "Title, category, and content are required." },
      { status: 400 }
    );
  }

  const doc = await prisma.document.create({
    data: {
      hoaId: user.hoaId,
      title: title.trim(),
      category,
      content: content.trim(),
      isPublic: isPublic ?? false,
      isAccessibleToResidents: isAccessibleToResidents ?? true,
      requiresLogin: requiresLogin ?? true,
      isMandatoryRecord: isMandatoryRecord ?? false,
      fileSize: fileSize || null,
      pages: pages || null,
      uploadedBy: user.id,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

// Helper: authorize + confirm the doc belongs to this admin's HOA
async function authorizeDocAccess(id: string) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return { error: "Forbidden", status: 403 as const, user: null, doc: null };
  }

  const doc = await prisma.document.findUnique({ where: { id } });
  if (!doc) {
    return { error: "Not found", status: 404 as const, user: null, doc: null };
  }

  // Admins can only touch their own HOA's documents; superadmins are unrestricted
  if (user.role === "admin" && doc.hoaId !== user.hoaId) {
    return { error: "Forbidden", status: 403 as const, user: null, doc: null };
  }

  return { error: null, status: 200 as const, user, doc };
}

// PATCH /api/documents/[id] — update an existing document
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorizeDocAccess(id);
  if (auth.error || !auth.user || !auth.doc) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const body = await req.json();
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
  } = body;

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(category !== undefined && { category }),
      ...(content !== undefined && { content: content.trim() }),
      ...(isPublic !== undefined && { isPublic }),
      ...(isAccessibleToResidents !== undefined && { isAccessibleToResidents }),
      ...(requiresLogin !== undefined && { requiresLogin }),
      ...(isMandatoryRecord !== undefined && { isMandatoryRecord }),
      ...(fileSize !== undefined && { fileSize: fileSize || null }),
      ...(pages !== undefined && { pages: pages || null }),
    },
  });

  await prisma.auditLog.create({
    data: {
      hoaId: auth.doc.hoaId,
      userId: auth.user.id,
      action: "UPDATE",
      documentId: updated.id,
      documentTitle: updated.title,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/documents/[id] — remove a document
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const auth = await authorizeDocAccess(id);
  if (auth.error || !auth.user || !auth.doc) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  await prisma.document.delete({ where: { id } });

  await prisma.auditLog.create({
    data: {
      hoaId: auth.doc.hoaId,
      userId: auth.user.id,
      action: "DELETE",
      documentId: auth.doc.id,
      documentTitle: auth.doc.title,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
