import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError, handle, readJson } from "@/lib/api";
import { passwordChangedEmailHtml, sendEmail } from "@/lib/email";
import { findUsableToken } from "@/lib/tokens";

const EXPIRED =
  "This link has expired or was already used. Request a new one.";

// GET /api/account/reset-password?token=… — is this link still good?
// Lets the page say "expired" before someone types a new password.
export const GET = handle(
  "GET /api/account/reset-password",
  async (req: Request) => {
    const raw = new URL(req.url).searchParams.get("token") ?? "";
    const token = await findUsableToken(raw);
    if (!token) throw new ApiError(410, EXPIRED);

    return NextResponse.json({ valid: true, type: token.type });
  }
);

// POST /api/account/reset-password — set a new password using a link.
export const POST = handle(
  "POST /api/account/reset-password",
  async (req: Request) => {
    const { token: raw, password } = await readJson(req);

    if (!password || String(password).length < 8) {
      throw new ApiError(400, "Password must be at least 8 characters.");
    }

    const token = await findUsableToken(String(raw ?? ""));
    if (!token) throw new ApiError(410, EXPIRED);

    const hashed = await bcrypt.hash(String(password), 10);

    // Marking the token used is conditional on it still being unused, so two
    // requests racing with the same link can't both succeed.
    const claimed = await prisma.authToken.updateMany({
      where: { id: token.id, usedAt: null },
      data: { usedAt: new Date() },
    });
    if (claimed.count === 0) throw new ApiError(410, EXPIRED);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: token.userId },
        data: { password: hashed },
      }),
      // Any other outstanding links for this account stop working too.
      prisma.authToken.deleteMany({
        where: { userId: token.userId, usedAt: null },
      }),
    ]);

    if (token.type === "reset") {
      await sendEmail({
        to: token.user.email,
        subject: "Your Florida HOA Portal password was changed",
        html: passwordChangedEmailHtml({
          name: token.user.name ?? "there",
          hoaName: "Florida HOA",
        }),
      });
    }

    return NextResponse.json({ success: true, email: token.user.email });
  }
);
