// ─── Auth ──────────────────────────────────────────────────────────────────
export type UserRole = "public" | "resident" | "admin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
}

// ─── Documents ─────────────────────────────────────────────────────────────
export type DocumentCategory =
  | "governing"
  | "financial"
  | "meetings"
  | "contracts"
  | "architectural"
  | "insurance"
  | "violations"
  | "legal";

export interface HOADocument {
  id: string;
  title: string;
  category: DocumentCategory;
  content: string;
  redactedContent?: string;
  isPublic: boolean;
  isAccessibleToResidents: boolean;
  requiresLogin: boolean;
  uploadDate: string;
  lastModified: string;
  fileSize: string;
  pages: number;
  uploadedBy: string;
  /** F.S. 720.303 mandatory category flag */
  isMandatoryRecord: boolean;
}

export interface RedactedDocument extends HOADocument {
  wasRedacted: boolean;
  redactedFields: RedactedField[];
}

export type RedactedField = "ssn" | "financials" | "bankAccount" | "medical";

// ─── Audit Trail ────────────────────────────────────────────────────────────
export type AuditAction = "VIEW" | "DOWNLOAD" | "SEARCH" | "LOGIN" | "LOGOUT";

export interface AuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userEmail: string;
  action: AuditAction;
  documentId?: string;
  documentTitle?: string;
  ipAddress: string;
  userAgent?: string;
  metadata?: Record<string, string>;
}

// ─── Access Control ─────────────────────────────────────────────────────────
export interface AccessRule {
  category: DocumentCategory;
  public: boolean;
  resident: boolean;
  admin: boolean;
}

export type AccessMatrix = Record<DocumentCategory, Omit<AccessRule, "category">>;

// ─── Implementation Checklist ───────────────────────────────────────────────
export type ChecklistPriority = "high" | "medium" | "low";

export interface ChecklistItem {
  id: number;
  label: string;
  description?: string;
  done: boolean;
  priority: ChecklistPriority;
  statute?: string;
}

// ─── UI State ───────────────────────────────────────────────────────────────
export interface FilterState {
  search: string;
  category: DocumentCategory | "all";
  accessLevel: "all" | "public" | "resident" | "admin";
}
