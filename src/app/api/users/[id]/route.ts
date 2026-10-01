import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireAdmin, ROLES } from "@/lib/api";
import { loadManagedUser } from "@/lib/users";

type Ctx = { params: Promise<{ id: string }> };

// PATCH /api/users/[id]
export const PATCH = handle(
  "PATCH /api/users/[id]",
  async (req: Request, { params }: Ctx) => {
    const sessionUser = await requireAdmin();
    const { id } = await params;
    const { name, email, password, role, active, hoaId } = await readJson(req);

    await loadManagedUser(id, sessionUser);

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name ? String(name).trim() : null;

    if (email !== undefined) {
      const cleanEmail = String(email).trim().toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        throw new ApiError(400, "Enter a valid email address.");
      }
      const clash = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          NOT: { id },
        },
      });
      if (clash) {
        throw new ApiError(409, "A user with that email already exists.");
      }
      updateData.email = cleanEmail;
    }

    if (role !== undefined) {
      if (!ROLES.includes(role)) throw new ApiError(400, "Unknown role.");
      // Only a superadmin can promote someone to superadmin.
      if (role === "superadmin" && sessionUser.role !== "superadmin") {
        throw new ApiError(403, "Forbidden");
      }
      if (id === sessionUser.id && role !== sessionUser.role) {
        throw new ApiError(400, "You cannot change your own role.");
      }
      updateData.role = role;
    }

    if (active !== undefined) {
      if (id === sessionUser.id && !active) {
        throw new ApiError(400, "You cannot deactivate your own account.");
      }
      updateData.active = Boolean(active);
    }

    // An empty password field means "leave it unchanged".
    if (password !== undefined && password !== "") {
      if (String(password).length < 8) {
        throw new ApiError(400, "Password must be at least 8 characters.");
      }
      updateData.password = await bcrypt.hash(String(password), 10);
    }

    // Only superadmins can move a user to another HOA
    if (hoaId !== undefined && sessionUser.role === "superadmin") {
      if (hoaId) {
        const hoa = await prisma.hOA.findUnique({ where: { id: hoaId } });
        if (!hoa) throw new ApiError(404, "HOA not found.");
      }
      updateData.hoaId = hoaId || null;
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
);

// DELETE /api/users/[id] — soft delete
export const DELETE = handle(
  "DELETE /api/users/[id]",
  async (_req: Request, { params }: Ctx) => {
    const sessionUser = await requireAdmin();
    const { id } = await params;

    await loadManagedUser(id, sessionUser);

    // Prevent self-deactivation
    if (id === sessionUser.id) {
      throw new ApiError(400, "You cannot deactivate your own account.");
    }

    await prisma.user.update({ where: { id }, data: { active: false } });
    return NextResponse.json({ success: true });
  }
);
