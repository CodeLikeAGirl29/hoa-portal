import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  ApiError,
  getSessionUser,
  handle,
  readJson,
  requireAdmin,
  resolveHoaId,
} from "@/lib/api";

function parseExpiry(value: unknown): Date | null {
  if (value === null || value === undefined || value === "") return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new ApiError(400, "Expiry date is not a valid date.");
  }
  return date;
}

// GET /api/announcements — active announcements for the viewer's HOA.
// Visitors and accounts with no HOA simply have none, so this returns an
// empty list rather than an error the banner would have to swallow.
export const GET = handle("GET /api/announcements", async (req: Request) => {
  const user = await getSessionUser();
  const { searchParams } = new URL(req.url);
  const hoaId = user ? resolveHoaId(user, searchParams.get("hoaId")) : null;

  if (!hoaId) return NextResponse.json([]);

  const announcements = await prisma.announcement.findMany({
    where: {
      hoaId,
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json(announcements);
});

// POST /api/announcements — create an announcement (admin only)
export const POST = handle("POST /api/announcements", async (req: Request) => {
  const user = await requireAdmin();
  const { title, body, pinned, expiresAt, hoaId } = await readJson(req);

  const targetHoaId = resolveHoaId(user, hoaId);
  if (!targetHoaId) {
    throw new ApiError(
      400,
      "Your account isn't assigned to a community, so there is nowhere to post this."
    );
  }

  if (typeof title !== "string" || typeof body !== "string") {
    throw new ApiError(400, "Title and body are required.");
  }
  if (!title.trim() || !body.trim()) {
    throw new ApiError(400, "Title and body are required.");
  }

  const announcement = await prisma.announcement.create({
    data: {
      hoaId: targetHoaId,
      authorId: user.id,
      title: title.trim(),
      body: body.trim(),
      pinned: Boolean(pinned),
      expiresAt: parseExpiry(expiresAt),
    },
    include: { author: { select: { name: true, email: true } } },
  });

  return NextResponse.json(announcement, { status: 201 });
});
