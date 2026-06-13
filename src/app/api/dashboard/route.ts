import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/dashboard — HOA-scoped stats, or portal-wide for superadmins
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const requestedHoaId = searchParams.get("hoaId");

  // Superadmin with no specific HOA selected → portal-wide rollup
  const isPortalWide =
    user.role === "superadmin" && !requestedHoaId && !user.hoaId;

  if (isPortalWide) {
    const [
      totalDocuments,
      publicDocuments,
      totalMembers,
      activeMembers,
      totalCommunities,
      recentRaw,
      categoryGroups,
    ] = await Promise.all([
      prisma.document.count(),
      prisma.document.count({ where: { isPublic: true } }),
      prisma.user.count({ where: { NOT: { role: "superadmin" } } }),
      prisma.user.count({
        where: { active: true, NOT: { role: "superadmin" } },
      }),
      prisma.hOA.count({ where: { active: true } }),
      prisma.auditLog.findMany({
        orderBy: { timestamp: "desc" },
        take: 8,
        include: { user: { select: { email: true, name: true } } },
      }),
      prisma.document.groupBy({
        by: ["category"],
        _count: { _all: true },
      }),
    ]);

    return NextResponse.json({
      portalWide: true,
      totalCommunities,
      totalDocuments,
      publicDocuments,
      totalMembers,
      activeMembers,
      recentActivity: recentRaw.map((e) => ({
        id: e.id,
        action: e.action,
        documentTitle: e.documentTitle,
        userEmail: e.user?.email ?? "unknown",
        timestamp: e.timestamp,
      })),
      documentsByCategory: categoryGroups
        .map((g) => ({ category: g.category, count: g._count._all }))
        .sort((a, b) => b.count - a.count),
    });
  }

  // Otherwise scope to a single HOA
  const hoaId =
    user.role === "superadmin" ? requestedHoaId ?? user.hoaId : user.hoaId;

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

  return NextResponse.json({
    portalWide: false,
    totalDocuments,
    publicDocuments,
    totalMembers,
    activeMembers,
    recentActivity: recentRaw.map((e) => ({
      id: e.id,
      action: e.action,
      documentTitle: e.documentTitle,
      userEmail: e.user?.email ?? "unknown",
      timestamp: e.timestamp,
    })),
    documentsByCategory: categoryGroups
      .map((g) => ({ category: g.category, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
  });
}
