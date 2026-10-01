// src/lib/users.ts
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/lib/api";
import type { SessionUser } from "@/lib/api";
import {
  inviteEmailHtml,
  isEmailConfigured,
  passwordResetEmailHtml,
  sendEmail,
} from "@/lib/email";
import {
  createPasswordLink,
  INVITE_DAYS,
  RESET_MINUTES,
} from "@/lib/tokens";
import type { TokenType } from "@/lib/tokens";

/**
 * Loads a user and confirms the signed-in admin may manage them: HOA admins
 * manage their own community only, and never a superadmin.
 */
export async function loadManagedUser(id: string, sessionUser: SessionUser) {
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) throw new ApiError(404, "Not found");

  if (sessionUser.role !== "superadmin") {
    if (target.hoaId !== sessionUser.hoaId || target.role === "superadmin") {
      throw new ApiError(403, "Forbidden");
    }
  }
  return target;
}

export interface LinkDelivery {
  /** Whether the email was handed to the mail service. */
  emailed: boolean;
  /**
   * The link itself — only present when it could not be emailed, so the
   * admin can pass it on another way.
   */
  link?: string;
}

/**
 * Creates a set-password link for a user and emails it to them.
 * `invite` is for a new member; `reset` is for someone who already had a
 * password.
 */
export async function sendPasswordLink(
  user: { id: string; email: string; name: string | null; hoaId: string | null },
  type: TokenType,
  invitedBy: string,
  req: Request
): Promise<LinkDelivery> {
  const link = await createPasswordLink(user.id, type, req);
  if (!isEmailConfigured()) return { emailed: false, link };

  const name = user.name ?? "there";
  let subject: string;
  let html: string;

  if (type === "invite") {
    const hoa = user.hoaId
      ? await prisma.hOA.findUnique({
          where: { id: user.hoaId },
          select: { name: true, accentColor: true },
        })
      : null;
    const hoaName = hoa?.name ?? "Florida HOA";
    subject = `You're invited to the ${hoaName} portal`;
    html = inviteEmailHtml({
      name,
      hoaName,
      accentColor: hoa?.accentColor,
      invitedBy,
      link,
      days: INVITE_DAYS,
    });
  } else {
    subject = "Reset your Florida HOA Portal password";
    html = passwordResetEmailHtml({ name, link, minutes: RESET_MINUTES });
  }

  const result = await sendEmail({ to: user.email, subject, html });
  return result.success ? { emailed: true } : { emailed: false, link };
}
