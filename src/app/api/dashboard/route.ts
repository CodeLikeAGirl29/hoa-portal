import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard — aggregate stats for the current admin's HOA
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hoaId =
    user.role === "superadmin"
      ? searchParams.get("hoaId") ?? user.hoaId
      : user.hoaId;

  if (!hoaId) {
    return NextResponse.json({ error: "No HOA context." }, { status: 400 });
  }

  const [
    totalDocuments,
    publicDocuments,
    totalMembers,
    activeMembers,
    recentRaw,
    categoryGroups,
  ] = await Promise.all([
    prisma.document.count({ where: { hoaId } }),
    prisma.document.count({ where: { hoaId, isPublic: true } }),
    prisma.user.count({ where: { hoaId } }),
    prisma.user.count({ where: { hoaId, active: true } }),
    prisma.auditLog.findMany({
      where: { hoaId },
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.document.groupBy({
      by: ["category"],
      where: { hoaId },
      _count: { _all: true },
    }),
  ]);

  const recentActivity = recentRaw.map((e) => ({
    id: e.id,
    action: e.action,
    documentTitle: e.documentTitle,
    userEmail: e.user?.email ?? "unknown",
    timestamp: e.timestamp,
  }));

  const documentsByCategory = categoryGroups
    .map((g) => ({ category: g.category, count: g._count._all }))
    .sort((a, b) => b.count - a.count);

  return NextResponse.json({
    totalDocuments,
    publicDocuments,
    totalMembers,
    activeMembers,
    recentActivity,
    documentsByCategory,
  });
}
