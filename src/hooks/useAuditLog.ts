"use client";

import { useState, useCallback } from "react";
import type { AuditEntry, AuditAction } from "@/types";
import { useAuth } from "./useAuth";

let _log: AuditEntry[] = [];

export function useAuditLog() {
  const { user } = useAuth();
  const [entries, setEntries] = useState<AuditEntry[]>(_log);

  const log = useCallback(
    (
      action: AuditAction,
      opts?: { documentId?: string; documentTitle?: string; metadata?: Record<string, string> }
    ) => {
      const entry: AuditEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: user.id,
        userEmail: user.email,
        action,
        ipAddress: "192.168.1.x", // In production: extract from request headers server-side
        userAgent: typeof navigator !== "undefined" ? navigator.userAgent : undefined,
        ...opts,
      };

      _log = [entry, ..._log];
      setEntries([..._log]);
    },
    [user]
  );

  return { entries, log };
}
