"use client";

import { useEffect } from "react";
import type { HOADocument } from "@/types";
import { CategoryBadge, Button } from "@/components/ui";
import { useAuditLog } from "@/hooks/useAuditLog";

interface DocumentViewerProps {
  document: HOADocument | null;
  onClose: () => void;
}

export function DocumentViewer({
  document: doc,
  onClose,
}: DocumentViewerProps) {
  const { log } = useAuditLog();

  useEffect(() => {
    if (!doc) return;
    log("VIEW", { documentId: doc.id, documentTitle: doc.title });
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [doc, log, onClose]);

  if (!doc) return null;

  const content = typeof doc.content === "string" ? doc.content : "";

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100 bg-white rounded-t-2xl">
          <div>
            <div className="flex items-center gap-3 mb-1 flex-wrap">
              <h2
                id="doc-viewer-title"
                className="m-0 text-base font-bold text-gray-900"
              >
                {doc.title}
              </h2>
              <CategoryBadge category={doc.category} />
            </div>
            <p className="text-xs text-gray-400 m-0">
              {doc.pages ? `${doc.pages} pages · ` : ""}
              {doc.fileSize ? `${doc.fileSize} · ` : ""}
              Last modified {String(doc.lastModified ?? "")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent flex-shrink-0"
          >
            ×
          </button>
        </div>

        {/* Banner */}
        <div
          className="flex items-center justify-between px-6 py-2 flex-shrink-0"
          style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
        >
          <span className="text-white text-[11px] font-bold tracking-widest uppercase">
            ⚓ Official Record — Florida HOA Portal
          </span>
          <span className="text-white/60 text-[11px]">F.S. 720.303</span>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6">
          {!doc.isPublic && (
            <div
              className="rounded-xl px-4 py-3 text-sm mb-4"
              style={{
                background: "#FAEEDA",
                border: "1px solid #EF9F27",
                color: "#854F0B",
              }}
            >
              <strong>Access Notice:</strong> This document may contain redacted
              fields per F.S. 720 and your access level.
            </div>
          )}

          <div
            className="rounded-xl p-5 text-sm leading-relaxed text-gray-700 border border-gray-100 whitespace-pre-wrap"
            style={{
              background: "#fdfcfa",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {content || (
              <span className="text-gray-300 italic">
                No content available for this document.
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex-shrink-0">
          <span className="text-[11px] text-gray-400">
            Accessed {new Date().toLocaleString()} · Logged to audit trail
          </span>
          <Button variant="primary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
