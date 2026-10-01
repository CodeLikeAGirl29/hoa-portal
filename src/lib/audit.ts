// src/lib/audit.ts
import { prisma } from "@/lib/prisma";
import { clientIp } from "@/lib/api";

/** Every action the audit trail records. */
export const AUDIT_ACTIONS = [
  "VIEW",
  "DOWNLOAD",
  "SEARCH",
  "LOGIN",
  "LOGOUT",
  "CREATE",
  "UPDATE",
  "DELETE",
  "UNAUTHORIZED_ACCESS_ATTEMPT",
] as const;

export type AuditActionName = (typeof AUDIT_ACTIONS)[number];

/** Actions a browser is allowed to report about itself. */
export const CLIENT_AUDIT_ACTIONS: readonly string[] = [
  "VIEW",
  "DOWNLOAD",
  "SEARCH",
  "LOGIN",
  "LOGOUT",
];

interface AuditInput {
  hoaId: string;
  userId: string;
  action: AuditActionName;
  documentId?: string | null;
  documentTitle?: string | null;
  req?: Request;
}

/**
 * Writes one audit row. Never throws: a logging failure is reported to the
 * server log but must not turn a successful request into an error.
 * Returns whether the row was written.
 */
export async function writeAudit(input: AuditInput): Promise<boolean> {
  try {
    await prisma.auditLog.create({
      data: {
        hoaId: input.hoaId,
        userId: input.userId,
        action: input.action,
        documentId: input.documentId ?? null,
        documentTitle: input.documentTitle ?? null,
        ipAddress: input.req ? clientIp(input.req) : null,
        userAgent: input.req?.headers.get("user-agent") ?? null,
      },
    });
    return true;
  } catch (err) {
    console.error(`Audit write failed (${input.action}):`, err);
    return false;
  }
}
