import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson, requireUser } from "@/lib/api";

export const POST = handle("POST /api/account/password", async (req: Request) => {
  const user = await requireUser();
  const { currentPassword, newPassword } = await readJson(req);

  if (!currentPassword || !newPassword) {
    throw new ApiError(400, "Current and new password are required.");
  }
  if (String(newPassword).length < 8) {
    throw new ApiError(400, "New password must be at least 8 characters.");
  }

  const dbUser = await prisma.user.findUnique({ where: { id: user.id } });
  if (!dbUser) {
    throw new ApiError(
      404,
      "Your account could not be found. Sign out and back in, then try again."
    );
  }

  const valid = await bcrypt.compare(String(currentPassword), dbUser.password);
  if (!valid) throw new ApiError(400, "Current password is incorrect.");

  await prisma.user.update({
    where: { id: user.id },
    data: { password: await bcrypt.hash(String(newPassword), 10) },
  });

  return NextResponse.json({ success: true });
});
