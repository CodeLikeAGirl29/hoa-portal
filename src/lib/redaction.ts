import type {
  HOADocument,
  RedactedDocument,
  RedactedField,
  UserRole,
  AccessMatrix,
  DocumentCategory,
} from "@/types";

// ─── Access Matrix (F.S. 720.303) ─────────────────────────────────────────
export const ACCESS_MATRIX: AccessMatrix = {
  governing:      { public: true,  resident: true,  admin: true },
  financial:      { public: false, resident: true,  admin: true },
  meetings:       { public: true,  resident: true,  admin: true },
  contracts:      { public: false, resident: true,  admin: true },
  architectural:  { public: false, resident: true,  admin: true },
  insurance:      { public: false, resident: true,  admin: true },
  violations:     { public: false, resident: true,  admin: true },
  legal:          { public: false, resident: false, admin: true },
};

/** Returns true if the given role can access a document */
export function canAccess(doc: HOADocument, role: UserRole): boolean {
  if (role === "admin") return true;
  if (role === "resident") return doc.isAccessibleToResidents;
  return doc.isPublic;
}

// ─── Redaction Patterns ────────────────────────────────────────────────────
const PATTERNS: Record<RedactedField, RegExp> = {
  ssn:         /\b\d{3}-\d{2}-\d{4}\b/g,
  financials:  /\$[\d,]+\.\d{2}/g,
  bankAccount: /\b\d{10,16}\b/g,
  medical:     /\b(diagnosis|treatment|disability)\b/gi,
};

const REPLACEMENTS: Record<RedactedField, string> = {
  ssn:         "***-**-****",
  financials:  "[$REDACTED]",
  bankAccount: "[ACCT-REDACTED]",
  medical:     "[MEDICAL-REDACTED]",
};

/**
 * Redacts sensitive PII from document content based on the viewer's role.
 * Admins receive the original document unchanged.
 */
export function redactDocument(
  doc: HOADocument,
  role: UserRole
): RedactedDocument {
  if (role === "admin") {
    return { ...doc, wasRedacted: false, redactedFields: [] };
  }

  let content = doc.content;
  const redactedFields: RedactedField[] = [];

  for (const [field, pattern] of Object.entries(PATTERNS) as [RedactedField, RegExp][]) {
    if (pattern.test(content)) {
      redactedFields.push(field);
      pattern.lastIndex = 0; // reset stateful regex
      content = content.replace(pattern, REPLACEMENTS[field]);
    }
    pattern.lastIndex = 0;
  }

  return {
    ...doc,
    content,
    wasRedacted: redactedFields.length > 0,
    redactedFields,
  };
}

/** Returns which fields would be redacted without actually redacting */
export function detectSensitiveFields(content: string): RedactedField[] {
  return (Object.entries(PATTERNS) as [RedactedField, RegExp][])
    .filter(([, pattern]) => {
      const found = pattern.test(content);
      pattern.lastIndex = 0;
      return found;
    })
    .map(([field]) => field);
}

// ─── Category Metadata ─────────────────────────────────────────────────────
export const CATEGORY_META: Record<
  DocumentCategory,
  { label: string; icon: string; color: string; bg: string }
> = {
  governing:     { label: "Governing",     icon: "⚖️",  color: "#185FA5", bg: "#E6F1FB" },
  financial:     { label: "Financial",     icon: "💰",  color: "#3B6D11", bg: "#EAF3DE" },
  meetings:      { label: "Meetings",      icon: "📋",  color: "#854F0B", bg: "#FAEEDA" },
  contracts:     { label: "Contracts",     icon: "📝",  color: "#712B13", bg: "#FAECE7" },
  architectural: { label: "Architectural", icon: "🏗️",  color: "#533AB7", bg: "#EEEDFE" },
  insurance:     { label: "Insurance",     icon: "🛡️",  color: "#0F6E56", bg: "#E1F5EE" },
  violations:    { label: "Violations",    icon: "⚠️",  color: "#993C1D", bg: "#FAECE7" },
  legal:         { label: "Legal",         icon: "🏛️",  color: "#5F5E5A", bg: "#F1EFE8" },
};

export const REDACTED_FIELD_LABELS: Record<RedactedField, string> = {
  ssn:         "SSN",
  financials:  "financial amounts",
  bankAccount: "account numbers",
  medical:     "medical info",
};
