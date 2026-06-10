import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { title, body, pinned, expiresAt } = await req.json();

  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "admin" && existing.hoaId !== user.hoaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.announcement.update({
    where: { id },
    data: {
      ...(title !== undefined && { title: title.trim() }),
      ...(body !== undefined && { body: body.trim() }),
      ...(pinned !== undefined && { pinned }),
      ...(expiresAt !== undefined && {
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }),
    },
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing)
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (user.role === "admin" && existing.hoaId !== user.hoaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.announcement.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
