"use client";

import type { RedactedDocument } from "@/types";
import { CategoryBadge, AccessBadge, Button } from "@/components/ui";
import { REDACTED_FIELD_LABELS } from "@/lib/redaction";
import { formatBytes } from "@/lib/files";

interface DocumentCardProps {
  document: RedactedDocument;
  onView: (doc: RedactedDocument) => void;
  onEdit?: (doc: RedactedDocument) => void;
  onDelete?: (doc: RedactedDocument) => void;
}

export function DocumentCard({
  document: doc,
  onView,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const preview =
    doc.content.length > 160 ? doc.content.slice(0, 157) + "…" : doc.content;

  const size = doc.file ? formatBytes(doc.file.size) : doc.fileSize;
  const details = [doc.pages ? `${doc.pages} pages` : null, size].filter(
    Boolean
  );

  return (
    <article className="bg-white border border-gray-200 rounded-xl p-4 sm:p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start gap-3">
        <h3 className="m-0 text-[15px] font-semibold text-gray-900 leading-snug">
          {doc.title}
        </h3>
        <AccessBadge
          isPublic={doc.isPublic}
          isResident={doc.isAccessibleToResidents}
        />
      </div>

      {/* Badges */}
      <div className="flex gap-2 flex-wrap items-center">
        <CategoryBadge category={doc.category} />
        {doc.isMandatoryRecord && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-800">
            F.S. 720 required
          </span>
        )}
        {doc.file && (
          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
            <span aria-hidden="true">📎 </span>File attached
          </span>
        )}
        {details.length > 0 && (
          <span className="text-xs text-gray-600">{details.join(", ")}</span>
        )}
      </div>

      {/* Preview */}
      {preview && (
        <p className="m-0 rounded-lg p-3 text-sm leading-relaxed text-gray-700 font-serif bg-[#f8f7f5]">
          {preview}
        </p>
      )}

      {/* Redaction notice */}
      {doc.wasRedacted && doc.redactedFields.length > 0 && (
        <div
          className="rounded-lg px-3 py-2 text-xs"
          style={{
            background: "#FAEEDA",
            border: "1px solid #EF9F27",
            color: "#633806",
          }}
        >
          Hidden for your access level:{" "}
          {doc.redactedFields.map((f) => REDACTED_FIELD_LABELS[f]).join(", ")}
        </div>
      )}

      {/* Dates */}
      <div className="flex justify-between gap-3 text-xs text-gray-600">
        <span>Uploaded {doc.uploadDate}</span>
        <span>Modified {doc.lastModified}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap border-t border-gray-200 pt-3">
        <Button
          variant="primary"
          size="sm"
          className="flex-1 min-w-[5rem]"
          onClick={() => onView(doc)}
        >
          View
        </Button>
        <a
          href={`/api/docs/${doc.id}/download`}
          className="inline-flex items-center justify-center font-semibold rounded-lg text-xs px-3 py-1.5 bg-gray-100 text-gray-800 hover:bg-gray-200 no-underline transition-colors"
        >
          Download
        </a>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={() => onEdit(doc)}>
            Edit
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doc)}
            className="text-red-700 hover:bg-red-50 hover:border-red-200"
          >
            Delete
          </Button>
        )}
      </div>
    </article>
  );
}
