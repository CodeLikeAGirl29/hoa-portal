import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

async function getAuthorizedSession() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;
  if (!user || !["admin", "superadmin"].includes(user.role)) return null;
  return user;
}

// PATCH /api/users/[id]
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getAuthorizedSession();
  if (!sessionUser)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;
  const body = await req.json();
  // Extract hoaId from the incoming body
  const { name, email, password, role, active, hoaId } = body;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sessionUser.role === "admin" && target.hoaId !== sessionUser.hoaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) updateData.email = email;
  if (role !== undefined) updateData.role = role;
  if (active !== undefined) updateData.active = active;
  if (password !== undefined)
    updateData.password = await bcrypt.hash(password, 10);

  // Allow superadmins to reassign the user's HOA
  if (hoaId !== undefined && sessionUser.role === "superadmin") {
    updateData.hoaId = hoaId === "" ? null : hoaId;
  }

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hoaId: true,
      active: true,
    },
  });

  return NextResponse.json(updated);
}

// DELETE /api/users/[id] — soft delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const sessionUser = await getAuthorizedSession();
  if (!sessionUser)
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await params;

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target)
    return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (sessionUser.role === "admin" && target.hoaId !== sessionUser.hoaId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Prevent self-deactivation
  if (id === sessionUser.id) {
    return NextResponse.json(
      { error: "You cannot deactivate your own account." },
      { status: 400 }
    );
  }

  await prisma.user.update({ where: { id }, data: { active: false } });
  return NextResponse.json({ success: true });
}
