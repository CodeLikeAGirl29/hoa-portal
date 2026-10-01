import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handle, readJson } from "@/lib/api";
import { isEmailConfigured } from "@/lib/email";
import { recentlySent } from "@/lib/tokens";
import { sendPasswordLink } from "@/lib/users";

// POST /api/account/forgot-password — email a password-reset link.
// The reply is the same whether or not the address belongs to an account,
// so this can't be used to find out who has one.
export const POST = handle(
  "POST /api/account/forgot-password",
  async (req: Request) => {
    const { email } = await readJson(req);
    const cleanEmail = String(email ?? "").trim();

    if (!isEmailConfigured()) {
      // Saying "check your inbox" when nothing can be sent would strand the
      // person. This reveals nothing about any account.
      return NextResponse.json(
        {
          error:
            "Password reset emails aren't set up on this site yet. Ask your HOA administrator to send you a link.",
          code: "EMAIL_NOT_CONFIGURED",
        },
        { status: 503 }
      );
    }

    if (cleanEmail) {
      const user = await prisma.user.findFirst({
        where: {
          email: { equals: cleanEmail, mode: "insensitive" },
          active: true,
        },
        select: { id: true, email: true, name: true, hoaId: true },
      });

      // Skip quietly if a link went out moments ago, so the form can't be
      // used to flood someone's inbox.
      if (user && !(await recentlySent(user.id, "reset"))) {
        await sendPasswordLink(user, "reset", "", req);
      }
    }

    return NextResponse.json({ success: true });
  }
);
