import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/hoa/settings — get the current user's HOA
export async function GET() {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.hoaId) {
    return NextResponse.json(
      { error: "No HOA assigned to your account." },
      { status: 400 }
    );
  }

  const hoa = await prisma.hOA.findUnique({
    where: { id: user.hoaId },
  });

  if (!hoa)
    return NextResponse.json({ error: "HOA not found." }, { status: 404 });

  return NextResponse.json(hoa);
}

// PATCH /api/hoa/settings — update the current user's HOA
export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!user.hoaId) {
    return NextResponse.json(
      { error: "No HOA assigned to your account." },
      { status: 400 }
    );
  }

  const body = await req.json();
  const {
    name,
    logoUrl,
    accentColor,
    address,
    city,
    state,
    zip,
    phone,
    email,
    website,
  } = body;

  if (name !== undefined && !name.trim()) {
    return NextResponse.json(
      { error: "Name cannot be empty." },
      { status: 400 }
    );
  }

  const hoa = await prisma.hOA.update({
    where: { id: user.hoaId },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      ...(accentColor !== undefined && { accentColor }),
      ...(address !== undefined && { address: address || null }),
      ...(city !== undefined && { city: city || null }),
      ...(state !== undefined && { state }),
      ...(zip !== undefined && { zip: zip || null }),
      ...(phone !== undefined && { phone: phone || null }),
      ...(email !== undefined && { email: email || null }),
      ...(website !== undefined && { website: website || null }),
    },
  });

  return NextResponse.json(hoa);
}
