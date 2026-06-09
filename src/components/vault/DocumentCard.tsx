"use client";

import type { HOADocument, RedactedDocument, RedactedField } from "@/types";
import { CategoryBadge, AccessBadge, Button } from "@/components/ui";
import { REDACTED_FIELD_LABELS } from "@/lib/redaction";

interface RedactionWarningProps {
  fields: RedactedField[];
}

function RedactionWarning({ fields }: RedactionWarningProps) {
  if (fields.length === 0) return null;
  return (
    <div
      className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs mt-2"
      style={{
        background: "#FAEEDA",
        border: "1px solid #EF9F27",
        color: "#854F0B",
      }}
    >
      <span>⚠️</span>
      <span>
        Sensitive data redacted:{" "}
        {fields.map((f) => REDACTED_FIELD_LABELS[f]).join(", ")}
      </span>
    </div>
  );
}

interface DocumentCardProps {
  document: RedactedDocument;
  onView: (doc: HOADocument) => void;
  onDownload: (doc: HOADocument) => void;
  onEdit?: (doc: RedactedDocument) => void;
  onDelete?: (doc: RedactedDocument) => void;
}

export function DocumentCard({
  document: doc,
  onView,
  onDownload,
  onEdit,
  onDelete,
}: DocumentCardProps) {
  const preview =
    doc.content.length > 160 ? doc.content.slice(0, 157) + "…" : doc.content;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex flex-col gap-3 transition-shadow duration-200 hover:shadow-md">
      {/* Header */}
      <div className="flex justify-between items-start gap-2">
        <h3 className="m-0 text-sm font-semibold text-gray-900 leading-snug">
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
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
            F.S. 720 Required
          </span>
        )}
        {(doc.pages || doc.fileSize) && (
          <span className="text-[11px] text-gray-400">
            {doc.pages ? `${doc.pages}p` : ""}
            {doc.pages && doc.fileSize ? " · " : ""}
            {doc.fileSize ?? ""}
          </span>
        )}
      </div>

      {/* Preview */}
      <div
        className="rounded-lg p-3 text-xs leading-relaxed text-gray-500 min-h-[60px]"
        style={{ background: "#f8f7f5", fontFamily: "Georgia, serif" }}
      >
        {preview}
      </div>

      {/* Redaction warning */}
      {doc.wasRedacted && <RedactionWarning fields={doc.redactedFields} />}

      {/* Dates */}
      <div className="flex justify-between text-[11px] text-gray-400">
        <span>Uploaded {doc.uploadDate}</span>
        <span>Modified {doc.lastModified}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <Button
          variant="primary"
          size="sm"
          className="flex-1"
          onClick={() => onView(doc)}
        >
          View
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onDownload(doc)}
          title="Download"
        >
          ⬇
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(doc)}
            title="Edit"
          >
            ✏️
          </Button>
        )}
        {onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(doc)}
            title="Delete"
            className="text-red-500 hover:bg-red-50 hover:border-red-200"
          >
            🗑
          </Button>
        )}
      </div>
    </div>
  );
}
