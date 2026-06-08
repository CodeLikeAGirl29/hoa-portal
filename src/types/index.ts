// ─── Auth ──────────────────────────────────────────────────────────────────
export type UserRole = "public" | "resident" | "admin" | "superadmin";

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  hoaId: string | null;
}

// ─── HOA Branding ──────────────────────────────────────────────────────────
export interface HOABranding {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  phone: string | null;
  email: string | null;
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
  hoaId: string;
  title: string;
  category: DocumentCategory;
  content: string;
  isPublic: boolean;
  isAccessibleToResidents: boolean;
  requiresLogin: boolean;
  uploadDate: string;
  lastModified: string;
  fileSize: string | null;
  pages: number | null;
  uploadedBy: string | null;
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

export type AccessMatrix = Record<
  DocumentCategory,
  Omit<AccessRule, "category">
>;

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
