"use server";

import { headers } from "next/headers";
import crypto from "crypto";
import type { AuditAction, AuditEntry } from "@/types";

export async function logServerAudit(
  userId: string,
  userEmail: string,
  action: AuditAction,
  documentId?: string,
  documentTitle?: string
): Promise<AuditEntry> {
  const headerList = await headers();

  // Extract authentic connectivity metadata straight from incoming headers
  const ipAddress =
    headerList.get("x-forwarded-for")?.split(",")[0] ||
    headerList.get("x-real-ip") ||
    "127.0.0.1";

  const userAgent = headerList.get("user-agent") || "Unknown";

  const newEntry: AuditEntry = {
    id: `log-${crypto.randomUUID()}`,
    timestamp: new Date().toISOString(), // Authoritative server timestamp
    userId,
    userEmail,
    action,
    documentId,
    documentTitle,
    ipAddress,
    userAgent,
  };

  // PRODUCTION NOTE: Write directly to your transactional ledger here
  // e.g., await db.auditLog.create({ data: newEntry });
  console.log("🔒 Immutable Server Audit Logged:", newEntry);

  return newEntry;
}
