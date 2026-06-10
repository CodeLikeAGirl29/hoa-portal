"use client";

import { useEffect } from "react";
import type { HOADocument } from "@/types";
import { CategoryBadge, Button } from "@/components/ui";
import { REDACTED_FIELD_LABELS, redactDocument } from "@/lib/redaction";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";

interface DocumentViewerProps {
  document: HOADocument;
  onClose: () => void;
}

export function DocumentViewer({
  document: doc,
  onClose,
}: DocumentViewerProps) {
  const { role } = useAuth();
  const { log } = useAuditLog();
  const redacted = redactDocument(doc, role);

  useEffect(() => {
    log("VIEW", { documentId: doc.id, documentTitle: doc.title });

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [doc.id, doc.title, log, onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-5"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-labelledby="doc-viewer-title"
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
        {/* Sticky header */}
        <div className="flex justify-between items-start px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <div className="flex items-center gap-3 mb-1">
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
              Last modified {doc.lastModified}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-0 bg-transparent"
            aria-label="Close document viewer"
          >
            ×
          </button>
        </div>

        {/* Official record banner */}
        <div
          className="flex items-center justify-between px-6 py-2"
          style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
        >
          <span className="text-white text-[11px] font-bold tracking-widest uppercase">
            ⚓ Official Record — Florida HOA Portal
          </span>
          <span className="text-white/60 text-[11px]">
            F.S. 720.303 Compliant
          </span>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 p-6 space-y-4">
          {role !== "admin" && (
            <div
              className="rounded-xl px-4 py-3 text-sm"
              style={{
                background: "#FAEEDA",
                border: "1px solid #EF9F27",
                color: "#854F0B",
              }}
            >
              <strong>Redaction Notice:</strong> This document has been
              automatically redacted per F.S. 720 and your access level.
            </div>
          )}

          {redacted.wasRedacted && redacted.redactedFields.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {redacted.redactedFields.map((f) => (
                <span
                  key={f}
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: "#FAECE7", color: "#712B13" }}
                >
                  🔒 {REDACTED_FIELD_LABELS[f]} redacted
                </span>
              ))}
            </div>
          )}

          <div
            className="rounded-xl p-5 text-sm leading-relaxed text-gray-700 border border-gray-100 whitespace-pre-wrap"
            style={{
              background: "#fdfcfa",
              fontFamily: "Georgia, 'Times New Roman', serif",
            }}
          >
            {redacted.content}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
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
