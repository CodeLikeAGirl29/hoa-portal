"use client";

import { useEffect } from "react";
import type { RedactedDocument } from "@/types";
import { CategoryBadge } from "@/components/ui";
import { Modal } from "@/components/ui/Modal";
import { REDACTED_FIELD_LABELS } from "@/lib/redaction";
import { formatBytes, isInlineMime } from "@/lib/files";
import { useAuditLog } from "@/hooks/useAuditLog";
import { useAuth } from "@/hooks/useAuth";

interface DocumentViewerProps {
  document: RedactedDocument | null;
  onClose: () => void;
}

const ACTION_CLASS =
  "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold no-underline transition-colors";

export function DocumentViewer({
  document: doc,
  onClose,
}: DocumentViewerProps) {
  const { log } = useAuditLog();
  const { role } = useAuth();
  const docId = doc?.id;
  const docTitle = doc?.title;

  // Record the view once per document opened — not on every re-render.
  useEffect(() => {
    if (!docId || role === "public") return;
    log("VIEW", { documentId: docId, documentTitle: docTitle });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docId]);

  if (!doc) return null;

  const downloadUrl = `/api/docs/${doc.id}/download`;
  const canOpenInBrowser = doc.file ? isInlineMime(doc.file.mimeType) : false;
  const details = [
    doc.pages ? `${doc.pages} pages` : null,
    doc.file ? formatBytes(doc.file.size) : doc.fileSize,
    `Last modified ${doc.lastModified}`,
  ].filter(Boolean);

  return (
    <Modal
      title={doc.title}
      titleAside={<CategoryBadge category={doc.category} />}
      description={details.join(", ")}
      onClose={onClose}
      size="lg"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-gray-600">
            {role === "public"
              ? "Public record"
              : "Your access to this record is logged."}
          </span>
          <div className="flex gap-2">
            {doc.file && canOpenInBrowser && (
              <a
                href={`${downloadUrl}?inline=1`}
                target="_blank"
                rel="noopener noreferrer"
                className={`${ACTION_CLASS} bg-white border border-gray-300 text-gray-800 hover:bg-gray-100`}
              >
                Open file
              </a>
            )}
            <a
              href={downloadUrl}
              className={`${ACTION_CLASS} bg-blue-700 text-white hover:bg-blue-800`}
            >
              Download
            </a>
          </div>
        </div>
      }
    >
      <div className="p-5 sm:p-6 space-y-4">
        {doc.file && (
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
            <span aria-hidden="true" className="text-xl">
              📎
            </span>
            <div className="min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">
                {doc.file.fileName}
              </div>
              <div className="text-xs text-gray-600">
                {formatBytes(doc.file.size)}, shared exactly as uploaded
              </div>
            </div>
          </div>
        )}

        {doc.wasRedacted && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: "#FAEEDA",
              border: "1px solid #EF9F27",
              color: "#633806",
            }}
          >
            <strong>Some details are hidden.</strong> For your access level,
            the text below leaves out:{" "}
            {doc.redactedFields.map((f) => REDACTED_FIELD_LABELS[f]).join(", ")}
            .
          </div>
        )}

        {doc.content ? (
          <div className="rounded-lg p-5 text-[15px] leading-7 text-gray-800 border border-gray-200 whitespace-pre-wrap font-serif bg-[#fdfcfa] max-w-[70ch]">
            {doc.content}
          </div>
        ) : (
          !doc.file && (
            <p className="text-sm text-gray-600 m-0">
              This document has no text or file yet.
            </p>
          )
        )}
      </div>
    </Modal>
  );
}
