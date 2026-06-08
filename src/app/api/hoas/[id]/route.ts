import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// PATCH /api/hoas/[id] — update an HOA
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  const {
    name,
    slug,
    accentColor,
    address,
    city,
    state,
    zip,
    phone,
    email,
    website,
    active,
  } = body;

  if (slug && !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json(
      {
        error: "Slug may only contain lowercase letters, numbers, and hyphens.",
      },
      { status: 400 }
    );
  }

  const hoa = await prisma.hOA.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(slug !== undefined && { slug }),
      ...(accentColor !== undefined && { accentColor }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(state !== undefined && { state }),
      ...(zip !== undefined && { zip }),
      ...(phone !== undefined && { phone }),
      ...(email !== undefined && { email }),
      ...(website !== undefined && { website }),
      ...(active !== undefined && { active }),
    },
  });

  return NextResponse.json(hoa);
}

// DELETE /api/hoas/[id] — deactivate (soft delete) an HOA
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || user.role !== "superadmin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  // Soft delete — set active: false rather than destroying data
  const hoa = await prisma.hOA.update({
    where: { id },
    data: { active: false },
  });

  return NextResponse.json({ success: true, hoa });
}
