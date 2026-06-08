"use client";

import type { AuditAction } from "@/types";
import { useAuditLog } from "@/hooks/useAuditLog";
import { MOCK_DOCUMENTS } from "@/lib/data";

const ACTION_STYLES: Record<AuditAction, { bg: string; color: string }> = {
  VIEW:     { bg: "#E6F1FB", color: "#185FA5" },
  DOWNLOAD: { bg: "#EAF3DE", color: "#3B6D11" },
  SEARCH:   { bg: "#FAEEDA", color: "#854F0B" },
  LOGIN:    { bg: "#EEEDFE", color: "#533AB7" },
  LOGOUT:   { bg: "#F1EFE8", color: "#5F5E5A" },
};

export function AuditTrailPanel() {
  const { entries } = useAuditLog();

  return (
    <div>
      <p className="text-sm text-gray-500 mb-4">
        All document interactions are automatically logged with timestamp, user, IP, and action.
        In production, this data is written server-side and immutable.
      </p>

      {entries.length === 0 ? (
        <div className="text-center py-12 text-gray-300">
          <div className="text-3xl mb-3">🗃️</div>
          <div className="text-sm">No activity yet. View a document to generate an audit entry.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) => {
            const docTitle =
              entry.documentTitle ??
              MOCK_DOCUMENTS.find((d) => d.id === entry.documentId)?.title ??
              entry.documentId;
            const s = ACTION_STYLES[entry.action];

            return (
              <div
                key={entry.id}
                className="grid gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm items-center"
                style={{ gridTemplateColumns: "1fr auto auto auto" }}
              >
                <div>
                  <div className="font-medium text-gray-800 text-sm">{docTitle}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {new Date(entry.timestamp).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs text-gray-500">{entry.userEmail}</div>
                <span
                  className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: s.bg, color: s.color }}
                >
                  {entry.action}
                </span>
                <div
                  className="text-[11px] text-gray-400 font-mono"
                  title="IP Address"
                >
                  {entry.ipAddress}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
