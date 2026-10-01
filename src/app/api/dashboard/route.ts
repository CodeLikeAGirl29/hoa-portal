import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, requireAdmin, resolveHoaId } from "@/lib/api";

// GET /api/dashboard — HOA-scoped stats, or portal-wide for a superadmin
// who hasn't picked a community.
export const GET = handle("GET /api/dashboard", async (req: Request) => {
  const user = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const hoaId = resolveHoaId(user, searchParams.get("hoaId"));
  const portalWide = !hoaId;

  if (portalWide && user.role !== "superadmin") {
    throw new ApiError(400, "No HOA context.");
  }

  // Same queries either way; only the scope changes.
  const docScope = hoaId ? { hoaId } : {};
  const memberScope = hoaId ? { hoaId } : { NOT: { role: "superadmin" } };

  const [
    totalDocuments,
    publicDocuments,
    totalMembers,
    activeMembers,
    totalCommunities,
    recentRaw,
    categoryGroups,
  ] = await Promise.all([
    prisma.document.count({ where: docScope }),
    prisma.document.count({ where: { ...docScope, isPublic: true } }),
    prisma.user.count({ where: memberScope }),
    prisma.user.count({ where: { ...memberScope, active: true } }),
    portalWide ? prisma.hOA.count({ where: { active: true } }) : null,
    prisma.auditLog.findMany({
      where: docScope,
      orderBy: { timestamp: "desc" },
      take: 8,
      include: { user: { select: { email: true, name: true } } },
    }),
    prisma.document.groupBy({
      by: ["category"],
      where: docScope,
      _count: { _all: true },
    }),
  ]);

  return NextResponse.json({
    portalWide,
    ...(totalCommunities !== null && { totalCommunities }),
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
});
