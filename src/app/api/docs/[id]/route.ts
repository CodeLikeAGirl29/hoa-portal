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
    const session = await getServerSession(authOptions);
    const user = session?.user as
      | { id: string; role: string; hoaId: string }
      | undefined;

    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const doc = await prisma.document.findFirst({
      where: { id, hoaId: user.hoaId },
    });

    if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!canAccess(doc, user.role)) {
      await prisma.auditLog.create({
        data: {
          hoaId: user.hoaId,
          action: "UNAUTHORIZED_ACCESS_ATTEMPT",
          userId: user.id,
          // Use 'connect' or provide the foreign key if your schema allows
          document: { connect: { id } },
        },
      });
      return NextResponse.json({ error: "Access Denied" }, { status: 403 });
    }

    await prisma.auditLog.create({
      data: {
        hoaId: user.hoaId,
        action: "VIEW",
        userId: user.id,
        document: { connect: { id } },
      },
    });

    return NextResponse.json(redactDocument(doc, user.role), { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
