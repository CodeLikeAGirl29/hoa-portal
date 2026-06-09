import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/audit — fetch audit log for current HOA
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const offset = parseInt(searchParams.get("offset") ?? "0");
  const hoaId =
    user.role === "superadmin"
      ? searchParams.get("hoaId") ?? user.hoaId
      : user.hoaId;

  if (!hoaId) {
    return NextResponse.json({ error: "No HOA context." }, { status: 400 });
  }

  const [entries, total] = await Promise.all([
    prisma.auditLog.findMany({
      where: { hoaId },
      orderBy: { timestamp: "desc" },
      take: limit,
      skip: offset,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.auditLog.count({ where: { hoaId } }),
  ]);

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      action: e.action,
      documentId: e.documentId,
      documentTitle: e.documentTitle,
      userEmail: e.user.email,
      userName: e.user.name,
      ipAddress: e.ipAddress,
      timestamp: e.timestamp,
    })),
    total,
    limit,
    offset,
  });
}

// POST /api/audit — write an audit entry (called client-side on view/download)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !user.hoaId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { action, documentId, documentTitle } = await req.json();

  if (!action) {
    return NextResponse.json({ error: "Action is required." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0] ?? "unknown";

  await prisma.auditLog.create({
    data: {
      hoaId: user.hoaId,
      userId: user.id,
      action,
      documentId: documentId ?? null,
      documentTitle: documentTitle ?? null,
      ipAddress: ip,
      userAgent: req.headers.get("user-agent") ?? null,
    },
  });

  return NextResponse.json({ success: true });
}
