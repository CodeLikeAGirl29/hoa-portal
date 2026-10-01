import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireSuperadmin } from "@/lib/api";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/users/[id]/hoa — reassign a user to a different HOA
export const PATCH = handle(
  "PATCH /api/users/[id]/hoa",
  async (req: Request, { params }: Ctx) => {
    await requireSuperadmin();

    const { id } = await params;
    const { hoaId } = await readJson(req);

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new ApiError(404, "User not found.");

    if (hoaId) {
      const hoa = await prisma.hOA.findUnique({ where: { id: hoaId } });
      if (!hoa) throw new ApiError(404, "HOA not found.");
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { hoaId: hoaId || null },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        hoaId: true,
        active: true,
        hoa: { select: { id: true, name: true, accentColor: true } },
      },
    });

    return NextResponse.json(updated);
  }
);
