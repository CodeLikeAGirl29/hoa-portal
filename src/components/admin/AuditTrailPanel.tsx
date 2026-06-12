"use client";

import { useState, useEffect, useCallback } from "react";

interface AuditEntry {
  id: string;
  action: string;
  documentId: string | null;
  documentTitle: string | null;
  userEmail: string;
  userName: string | null;
  ipAddress: string | null;
  timestamp: string;
}

const ACTION_STYLES: Record<
  string,
  { bg: string; color: string; icon: string }
> = {
  VIEW: { bg: "#E6F1FB", color: "#185FA5", icon: "👁" },
  DOWNLOAD: { bg: "#EAF3DE", color: "#3B6D11", icon: "⬇️" },
  LOGIN: { bg: "#EEEDFE", color: "#533AB7", icon: "🔐" },
  LOGOUT: { bg: "#F1EFE8", color: "#5F5E5A", icon: "👋" },
  SEARCH: { bg: "#FAEEDA", color: "#854F0B", icon: "🔍" },
  CREATE: { bg: "#EAF3DE", color: "#3B6D11", icon: "➕" },
  UPDATE: { bg: "#E6F1FB", color: "#185FA5", icon: "✏️" },
  DELETE: { bg: "#FAECE7", color: "#712B13", icon: "🗑" },
  UNAUTHORIZED_ACCESS_ATTEMPT: {
    bg: "#FEE2E2",
    color: "#B91C1C",
    icon: "🚫",
  },
};

const PAGE_SIZE = 20;

export function AuditTrailPanel() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState("all");

  const fetchEntries = useCallback(async (off = 0) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/audit?limit=${PAGE_SIZE}&offset=${off}`);
      if (res.ok) {
        const data = await res.json();
        setEntries(data.entries);
        setTotal(data.total);
        setOffset(off);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEntries(0);
  }, [fetchEntries]);

  const filtered =
    actionFilter === "all"
      ? entries
      : entries.filter((e) => e.action === actionFilter);

  const actions = [
    "all",
    "VIEW",
    "DOWNLOAD",
    "LOGIN",
    "CREATE",
    "UPDATE",
    "DELETE",
    "UNAUTHORIZED_ACCESS_ATTEMPT",
  ];
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentPage = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div>
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <p className="text-sm text-gray-500 m-0">
          {total} total entries · Server-side immutable log
        </p>

        {/* Action filter */}
        <div className="flex gap-1.5 flex-wrap">
          {actions.map((a) => {
            const s = ACTION_STYLES[a];
            return (
              <button
                key={a}
                onClick={() => setActionFilter(a)}
                className="px-2.5 py-1 rounded-lg text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer border-0"
                style={{
                  background:
                    actionFilter === a ? (s?.bg ?? "#E6F1FB") : "#f3f4f6",
                  color:
                    actionFilter === a ? (s?.color ?? "#185FA5") : "#9ca3af",
                }}
              >
                {a === "all"
                  ? "All"
                  : a === "UNAUTHORIZED_ACCESS_ATTEMPT"
                    ? `${s?.icon} Blocked`
                    : `${s?.icon} ${a}`}
              </button>
            );
          })}
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-gray-300">
          <div className="animate-spin text-2xl mb-3 inline-block">🔄</div>
          <div className="text-sm">Loading audit log…</div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-gray-300">
          <div className="text-3xl mb-3">🗃️</div>
          <div className="text-sm">No activity yet.</div>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const s = ACTION_STYLES[entry.action] ?? ACTION_STYLES.VIEW;
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 px-4 py-3 bg-gray-50 rounded-xl border border-gray-100 text-sm"
              >
                {/* Action icon */}
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0"
                  style={{ background: s.bg }}
                >
                  {s.icon}
                </span>

                {/* Document + user */}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-800 truncate">
                    {entry.documentTitle ?? "—"}
                  </div>
                  <div className="text-xs text-gray-400 truncate">
                    {entry.userName ?? entry.userEmail}
                    {entry.userEmail !== (entry.userName ?? "") && (
                      <span className="text-gray-300 ml-1">
                        · {entry.userEmail}
                      </span>
                    )}
                  </div>
                </div>

                {/* Badge */}
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase hidden sm:inline flex-shrink-0"
                  style={{ background: s.bg, color: s.color }}
                >
                  {entry.action}
                </span>

                {/* IP */}
                <span className="text-[11px] text-gray-300 font-mono hidden md:inline flex-shrink-0 w-28 text-right">
                  {entry.ipAddress ?? "—"}
                </span>

                {/* Time */}
                <span className="text-[11px] text-gray-400 flex-shrink-0 w-32 text-right">
                  {new Date(entry.timestamp).toLocaleString()}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
          <span className="text-xs text-gray-400">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchEntries(offset - PAGE_SIZE)}
              disabled={offset === 0 || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 cursor-pointer border-0 transition-all"
            >
              ← Previous
            </button>
            <button
              onClick={() => fetchEntries(offset + PAGE_SIZE)}
              disabled={offset + PAGE_SIZE >= total || loading}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-40 cursor-pointer border-0 transition-all"
            >
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
