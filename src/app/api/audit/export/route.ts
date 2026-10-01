import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, requireAdmin, resolveHoaId } from "@/lib/api";

// Escapes a value for safe CSV output (handles commas, quotes, newlines) and
// neutralises cells a spreadsheet would otherwise run as a formula.
function csvCell(value: unknown): string {
  let s = value === null || value === undefined ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// GET /api/audit/export — full audit log for the current HOA as CSV
export const GET = handle("GET /api/audit/export", async (req: Request) => {
  const user = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const hoaId = resolveHoaId(user, searchParams.get("hoaId"));

  // A superadmin with no community selected exports every community.
  if (!hoaId && user.role !== "superadmin") {
    throw new ApiError(400, "No HOA context.");
  }

  const [hoa, entries] = await Promise.all([
    hoaId
      ? prisma.hOA.findUnique({
          where: { id: hoaId },
          select: { name: true, slug: true },
        })
      : null,
    prisma.auditLog.findMany({
      where: hoaId ? { hoaId } : {},
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { email: true, name: true } },
        hoa: { select: { name: true } },
      },
    }),
  ]);

  const headers = [
    "Timestamp",
    "Community",
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
      e.hoa?.name ?? "",
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
  const filename = `audit-log-${hoa?.slug ?? "all-communities"}-${datestamp}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
});
