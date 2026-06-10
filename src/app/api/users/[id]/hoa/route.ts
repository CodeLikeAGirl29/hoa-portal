import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/users/[id]/hoa — reassign a user to a different HOA
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;

  if (!sessionUser || sessionUser.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const { hoaId } = await req.json();

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user)
    return NextResponse.json({ error: "User not found." }, { status: 404 });

  if (hoaId) {
    const hoa = await prisma.hOA.findUnique({ where: { id: hoaId } });
    if (!hoa)
      return NextResponse.json({ error: "HOA not found." }, { status: 404 });
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
