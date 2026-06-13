import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Escapes a value for safe CSV output (handles commas, quotes, newlines).
function csvCell(value: unknown): string {
  const s = value === null || value === undefined ? "" : String(value);
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/audit/export — full audit log for the current HOA as CSV
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

  const [hoa, entries] = await Promise.all([
    prisma.hOA.findUnique({
      where: { id: hoaId },
      select: { name: true, slug: true },
    }),
    prisma.auditLog.findMany({
      where: { hoaId },
      orderBy: { timestamp: "desc" },
      include: { user: { select: { email: true, name: true } } },
    }),
  ]);

  const headers = [
    "Timestamp",
    "Action",
    "Blocked",
    "Document",
    "User Name",
    "User Email",
    "IP Address",
  ];

  const rows = entries.map((e) =>
    [
      e.timestamp.toISOString(),
      e.action,
      e.action === "UNAUTHORIZED_ACCESS_ATTEMPT" ? "YES" : "",
      e.documentTitle ?? "",
      e.user?.name ?? "",
      e.user?.email ?? "",
      e.ipAddress ?? "",
    ]
      .map(csvCell)
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\r\n");

  const datestamp = new Date().toISOString().split("T")[0];
  const filename = `audit-log-${hoa?.slug ?? "hoa"}-${datestamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
