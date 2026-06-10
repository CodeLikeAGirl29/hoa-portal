import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEmail, newDocumentEmailHtml } from "@/lib/email";
import { redactDocument } from "@/lib/redaction";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const sessionUser = session?.user as any;
    const role = sessionUser?.role ?? "public";
    const hoaId = sessionUser?.hoaId as string | null;

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase() ?? "";
    const category = searchParams.get("category") ?? "all";
    const targetHoaId = hoaId ?? searchParams.get("hoaId");

    if (!targetHoaId) {
      return NextResponse.json(
        { error: "No HOA context provided." },
        { status: 400 }
      );
    }

    const where: Record<string, unknown> = { hoaId: targetHoaId };
    if (role === "public") where.isPublic = true;
    else if (role === "resident") where.isAccessibleToResidents = true;
    if (category !== "all") where.category = category;

    const docs = await prisma.document.findMany({
      where,
      orderBy: [{ category: "asc" }, { uploadDate: "desc" }],
    });

    const filtered = search
      ? docs.filter(
          (d) =>
            d.title.toLowerCase().includes(search) ||
            d.category.toLowerCase().includes(search)
        )
      : docs;

    const results = filtered.map((doc) =>
      redactDocument(
        {
          id: doc.id,
          hoaId: doc.hoaId,
          title: doc.title,
          category: doc.category as any,
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
        },
        role as any
      )
    );

    return NextResponse.json(results);
  } catch (error) {
    console.error("GET /api/documents error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

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
    notifyResidents = true,
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

  // Log audit entry
  await prisma.auditLog.create({
    data: {
      hoaId: user.hoaId,
      userId: user.id,
      action: "CREATE",
      documentId: doc.id,
      documentTitle: doc.title,
      ipAddress: req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown",
    },
  });

  // Notify residents if this is a resident-accessible document
  if (notifyResidents && (isAccessibleToResidents || isPublic)) {
    try {
      const [hoa, residents] = await Promise.all([
        prisma.hOA.findUnique({ where: { id: user.hoaId } }),
        prisma.user.findMany({
          where: { hoaId: user.hoaId, role: "resident", active: true },
          select: { email: true },
        }),
      ]);

      if (hoa && residents.length > 0) {
        const loginUrl = `${
          process.env.NEXTAUTH_URL ?? "https://floridahoaportal.com"
        }/login`;
        const uploaderUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { name: true, email: true },
        });

        // Send in batches to avoid rate limits
        const emails = residents.map((r) => r.email);
        const BATCH = 50;
        for (let i = 0; i < emails.length; i += BATCH) {
          await sendEmail({
            to: emails.slice(i, i + BATCH),
            subject: `New Document: ${doc.title} — ${hoa.name}`,
            html: newDocumentEmailHtml({
              hoaName: hoa.name,
              accentColor: hoa.accentColor,
              documentTitle: doc.title,
              category: doc.category,
              uploadedBy:
                uploaderUser?.name ?? uploaderUser?.email ?? "Your HOA Admin",
              loginUrl,
            }),
          });
        }
      }
    } catch (emailErr) {
      // Don't fail the request if email fails
      console.error("Email notification error:", emailErr);
    }
  }

  return NextResponse.json(doc, { status: 201 });
}
