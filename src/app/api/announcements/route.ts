import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/announcements — list active announcements for current HOA
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !user.hoaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  const announcements = await prisma.announcement.findMany({
    where: {
      hoaId: user.hoaId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: {
      author: { select: { name: true, email: true } },
    },
  });

  return NextResponse.json(announcements);
}

// POST /api/announcements — create an announcement (admin only)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { title, body, pinned, expiresAt } = await req.json();

  if (!title || !body) {
    return NextResponse.json(
      { error: "Title and body are required." },
      { status: 400 }
    );
  }

  const announcement = await prisma.announcement.create({
    data: {
      hoaId: user.hoaId,
      authorId: user.id,
      title: title.trim(),
      body: body.trim(),
      pinned: pinned ?? false,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
    },
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
}
