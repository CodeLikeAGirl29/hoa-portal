import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireAdmin, ROLES } from "@/lib/api";
import { unusablePassword } from "@/lib/tokens";
import { sendPasswordLink } from "@/lib/users";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// GET /api/users — users of the current HOA (admin) or of any HOA (superadmin)
export const GET = handle("GET /api/users", async (req: Request) => {
  const user = await requireAdmin();

  const { searchParams } = new URL(req.url);
  const hoaId = searchParams.get("hoaId");

  // Admins can only see their own HOA's users. An admin with no HOA must
  // match nothing — an empty filter here would list every community's users.
  const filterHoaId =
    user.role === "superadmin" ? hoaId ?? undefined : user.hoaId ?? "";

  const users = await prisma.user.findMany({
    where: {
      ...(filterHoaId !== undefined ? { hoaId: filterHoaId } : {}),
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
});

// POST /api/users — create a user (admin: inside their HOA; superadmin: anywhere).
// With `sendInvite: true` no password is needed: the new member is emailed a
// link to choose their own.
export const POST = handle("POST /api/users", async (req: Request) => {
  const sessionUser = await requireAdmin();
  const { email, name, password, role, hoaId, sendInvite } =
    await readJson(req);

  const invite = Boolean(sendInvite);

  if (!email || !role || (!invite && !password)) {
    throw new ApiError(
      400,
      invite
        ? "Email and role are required."
        : "Email, password, and role are required."
    );
  }

  const cleanEmail = String(email).trim().toLowerCase();
  if (!EMAIL_RE.test(cleanEmail)) {
    throw new ApiError(400, "Enter a valid email address.");
  }
  if (!invite && String(password).length < 8) {
    throw new ApiError(400, "Password must be at least 8 characters.");
  }
  if (!ROLES.includes(role)) {
    throw new ApiError(400, "Unknown role.");
  }
  // Only a superadmin can mint another superadmin.
  if (role === "superadmin" && sessionUser.role !== "superadmin") {
    throw new ApiError(403, "Forbidden");
  }

  // Admins can only create users within their own HOA
  const targetHoaId =
    sessionUser.role === "superadmin" ? hoaId || null : sessionUser.hoaId;

  if (sessionUser.role !== "superadmin" && !targetHoaId) {
    throw new ApiError(400, "Your account isn't assigned to a community.");
  }
  if (targetHoaId) {
    const hoa = await prisma.hOA.findUnique({ where: { id: targetHoaId } });
    if (!hoa) throw new ApiError(404, "HOA not found.");
  }

  const existing = await prisma.user.findFirst({
    where: { email: { equals: cleanEmail, mode: "insensitive" } },
  });
  if (existing) {
    throw new ApiError(409, "A user with that email already exists.");
  }

  const newUser = await prisma.user.create({
    data: {
      email: cleanEmail,
      name: name ? String(name).trim() : null,
      // Invited members get a random password nobody knows until they
      // choose their own through the emailed link.
      password: await bcrypt.hash(
        invite ? unusablePassword() : String(password),
        10
      ),
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

  if (!invite) return NextResponse.json(newUser, { status: 201 });

  const delivery = await sendPasswordLink(
    newUser,
    "invite",
    sessionUser.name ?? sessionUser.email,
    req
  );

  return NextResponse.json({ ...newUser, invite: delivery }, { status: 201 });
});
