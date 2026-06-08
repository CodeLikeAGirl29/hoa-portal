import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Your NextAuth config
import { prisma } from "@/lib/prisma";
import { canAccess, redactDocument } from "@/lib/redaction";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 1. Authenticate the session
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { role, hoaId } = session.user as any;

    // 2. Fetch document from real database, strictly scoped to hoaId
    const doc = await prisma.document.findFirst({
      where: {
        id: id,
        hoaId: hoaId, // Multi-tenant isolation barrier
      },
    });

    if (!doc) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // 3. Enforce Access Matrix
    if (!canAccess(doc, role)) {
      await prisma.auditLog.create({
        data: {
          hoaId,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          userId: session.user.id,
          documentId: id,
        },
      });
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    // 4. Log the view event
    await prisma.auditLog.create({
      data: { hoaId, action: "VIEW", userId: session.user.id, documentId: id },
    });

    // 5. Process and return redacted document
    const processedDoc = redactDocument(doc, role);

    return NextResponse.json(processedDoc, {
      status: 200,
      headers: {
        "Cache-Control": "private, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("[DOC_FETCH_ERROR]", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
