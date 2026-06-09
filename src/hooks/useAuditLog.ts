"use client";

import { useCallback } from "react";
import { useAuth } from "./useAuth";
import type { AuditAction } from "@/types";

export function useAuditLog() {
  const { user } = useAuth();

  const log = useCallback(
    async (
      action: AuditAction,
      opts?: {
        documentId?: string;
        documentTitle?: string;
        metadata?: Record<string, string>;
      }
    ) => {
      // Fire-and-forget — don't block the UI
      fetch("/api/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          documentId: opts?.documentId,
          documentTitle: opts?.documentTitle,
        }),
      }).catch(() => {
        // Silently fail — audit logging should never break the user experience
      });
    },
    [user]
  );

  return { log };
}
