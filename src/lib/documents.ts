// src/lib/documents.ts
// Turns a database document into what the browser receives, and decides who
// may open it. Shared by every route that returns documents.
import { canAccess, redactDocument } from "@/lib/redaction";
import type { DocumentCategory, RedactedDocument, UserRole } from "@/types";

/** Fields to load for the attached file — everything except its contents. */
export const FILE_META_SELECT = {
  fileName: true,
  mimeType: true,
  size: true,
} as const;

interface DocumentRow {
  id: string;
  hoaId: string;
  title: string;
  category: string;
  content: string;
  isPublic: boolean;
  isAccessibleToResidents: boolean;
  requiresLogin: boolean;
  isMandatoryRecord: boolean;
  fileSize: string | null;
  pages: number | null;
  uploadedBy: string | null;
  uploadDate: Date;
  lastModified: Date;
  file?: { fileName: string; mimeType: string; size: number } | null;
}

/** The document as a given role should see it: text redacted, dates flat. */
export function presentDocument(
  doc: DocumentRow,
  role: UserRole
): RedactedDocument {
  return redactDocument(
    {
      id: doc.id,
      hoaId: doc.hoaId,
      title: doc.title,
      category: doc.category as DocumentCategory,
      content: doc.content,
      isPublic: doc.isPublic,
      isAccessibleToResidents: doc.isAccessibleToResidents,
      requiresLogin: doc.requiresLogin,
      uploadDate: doc.uploadDate.toISOString().split("T")[0],
      lastModified: doc.lastModified.toISOString().split("T")[0],
      fileSize: doc.fileSize,
      pages: doc.pages,
      uploadedBy: doc.uploadedBy,
      isMandatoryRecord: doc.isMandatoryRecord,
      file: doc.file
        ? {
            fileName: doc.file.fileName,
            mimeType: doc.file.mimeType,
            size: doc.file.size,
          }
        : null,
    },
    role
  );
}

/**
 * May this viewer open the document?
 * A signed-in user is limited to their own community (superadmins aren't);
 * a visitor may open only documents marked public.
 */
export function mayOpen(
  doc: Pick<DocumentRow, "hoaId" | "isPublic" | "isAccessibleToResidents">,
  viewer: { role: string; hoaId: string | null } | null
): boolean {
  if (!viewer) return doc.isPublic;
  const role = viewer.role as UserRole;
  if (role !== "superadmin" && doc.hoaId !== viewer.hoaId) return false;
  return canAccess(doc, role);
}
