import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
