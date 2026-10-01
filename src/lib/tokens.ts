// src/lib/tokens.ts
// One-time links for setting a password — used by "forgot password" and by
// member invitations. The link carries a random token; the database stores
// only its SHA-256 hash, so a leaked database can't be used to take over
// accounts.
import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type TokenType = "reset" | "invite";

export const RESET_MINUTES = 60;
export const INVITE_DAYS = 7;

const LIFETIME_MS: Record<TokenType, number> = {
  reset: RESET_MINUTES * 60 * 1000,
  invite: INVITE_DAYS * 24 * 60 * 60 * 1000,
};

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

/** The site's public address, for building links that go into emails. */
export function siteUrl(req: Request): string {
  // Prefer the configured address: a request's Host header can be forged,
  // and a reset link must never point at someone else's domain.
  const configured = process.env.NEXTAUTH_URL?.replace(/\/+$/, "");
  return configured || new URL(req.url).origin;
}

/**
 * Creates a token for a user and returns the link to send them. Any earlier
 * unused links of the same kind stop working.
 */
export async function createPasswordLink(
  userId: string,
  type: TokenType,
  req: Request
): Promise<string> {
  const raw = randomBytes(32).toString("base64url");

  await prisma.$transaction([
    prisma.authToken.deleteMany({ where: { userId, type, usedAt: null } }),
    prisma.authToken.create({
      data: {
        userId,
        type,
        tokenHash: hashToken(raw),
        expiresAt: new Date(Date.now() + LIFETIME_MS[type]),
      },
    }),
  ]);

  return `${siteUrl(req)}/reset-password?token=${raw}`;
}

/** True if this user was sent a link of this kind in the last few minutes. */
export async function recentlySent(
  userId: string,
  type: TokenType,
  withinMinutes = 2
): Promise<boolean> {
  const recent = await prisma.authToken.findFirst({
    where: {
      userId,
      type,
      createdAt: { gt: new Date(Date.now() - withinMinutes * 60 * 1000) },
    },
    select: { id: true },
  });
  return Boolean(recent);
}

/** Looks up a still-usable token. Returns null if unknown, used or expired. */
export async function findUsableToken(raw: string) {
  if (!raw || raw.length > 200) return null;

  const token = await prisma.authToken.findUnique({
    where: { tokenHash: hashToken(raw) },
    include: {
      user: { select: { id: true, email: true, name: true, active: true } },
    },
  });

  if (!token || token.usedAt || token.expiresAt.getTime() < Date.now()) {
    return null;
  }
  if (!token.user.active) return null;
  return token;
}

/** A random password hash input nobody knows — for invited accounts. */
export function unusablePassword(): string {
  return randomBytes(32).toString("base64url");
}
