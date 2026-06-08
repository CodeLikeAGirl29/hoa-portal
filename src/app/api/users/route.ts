import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

// GET /api/users — list users for the current HOA (admin) or all HOAs (superadmin)
export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const user = session?.user as any;

  if (!user || !["admin", "superadmin"].includes(user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const hoaId = searchParams.get("hoaId");

  // Admins can only see their own HOA's users
  const filterHoaId =
    user.role === "superadmin" ? hoaId ?? undefined : user.hoaId;

  const users = await prisma.user.findMany({
    where: {
      ...(filterHoaId ? { hoaId: filterHoaId } : {}),
      // Superadmins are platform-level, don't show them in HOA lists
      NOT: { role: "superadmin" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hoaId: true,
      active: true,
      createdAt: true,
      hoa: { select: { id: true, name: true, accentColor: true } },
    },
    orderBy: [{ role: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(users);
}

// POST /api/users — create a new user (admin creates within their HOA, superadmin anywhere)
export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const sessionUser = session?.user as any;

  if (!sessionUser || !["admin", "superadmin"].includes(sessionUser.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { email, name, password, role, hoaId } = body;

  if (!email || !password || !role) {
    return NextResponse.json(
      { error: "Email, password, and role are required." },
      { status: 400 }
    );
  }

  // Admins can only create residents within their own HOA
  const targetHoaId =
    sessionUser.role === "superadmin" ? hoaId ?? null : sessionUser.hoaId;

  if (sessionUser.role === "admin" && role === "admin") {
    // Admins can create other admins only within their own HOA
    if (!targetHoaId || targetHoaId !== sessionUser.hoaId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with that email already exists." },
      { status: 409 }
    );
  }

  const hashed = await bcrypt.hash(password, 10);

  const newUser = await prisma.user.create({
    data: {
      email,
      name: name || null,
      password: hashed,
      role,
      hoaId: targetHoaId,
    },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      hoaId: true,
      active: true,
      createdAt: true,
    },
  });

  return NextResponse.json(newUser, { status: 201 });
}
