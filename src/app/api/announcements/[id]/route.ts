import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireAdmin } from "@/lib/api";
import type { SessionUser } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// Loads the announcement and confirms this admin may change it.
async function loadOwned(id: string, user: SessionUser) {
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) throw new ApiError(404, "Not found");
  if (user.role !== "superadmin" && existing.hoaId !== user.hoaId) {
    throw new ApiError(403, "Forbidden");
  }
  return existing;
}

export const PATCH = handle(
  "PATCH /api/announcements/[id]",
  async (req: Request, { params }: Ctx) => {
    const user = await requireAdmin();
    const { id } = await params;
    const { title, body, pinned, expiresAt } = await readJson(req);

    await loadOwned(id, user);

    if (title !== undefined && !String(title).trim()) {
      throw new ApiError(400, "Title cannot be empty.");
    }
    if (body !== undefined && !String(body).trim()) {
      throw new ApiError(400, "Message cannot be empty.");
    }

    let expiry: Date | null | undefined;
    if (expiresAt !== undefined) {
      expiry = expiresAt ? new Date(String(expiresAt)) : null;
      if (expiry && Number.isNaN(expiry.getTime())) {
        throw new ApiError(400, "Expiry date is not a valid date.");
      }
    }

    const updated = await prisma.announcement.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: String(title).trim() }),
        ...(body !== undefined && { body: String(body).trim() }),
        ...(pinned !== undefined && { pinned: Boolean(pinned) }),
        ...(expiry !== undefined && { expiresAt: expiry }),
      },
      include: { author: { select: { name: true, email: true } } },
    });

    return NextResponse.json(updated);
  }
);

export const DELETE = handle(
  "DELETE /api/announcements/[id]",
  async (_req: Request, { params }: Ctx) => {
    const user = await requireAdmin();
    const { id } = await params;

    await loadOwned(id, user);
    await prisma.announcement.delete({ where: { id } });

    return NextResponse.json({ success: true });
  }
);
