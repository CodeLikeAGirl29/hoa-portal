# Pelican Bay HOA — Document Portal

Florida Statute **F.S. 720.303** compliant HOA document management portal built with **Next.js 15 + TypeScript + Tailwind CSS**.

---

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3000
```

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with AuthProvider
│   ├── page.tsx            # Main page (role-gated dashboard)
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── index.tsx       # RoleBadge, CategoryBadge, Button, Card, Alert, StatCard
│   │   ├── Tabs.tsx
│   │   └── DownloadToast.tsx
│   ├── vault/
│   │   ├── DocumentVault.tsx   # Search + filter + grid
│   │   ├── DocumentCard.tsx    # Card with redaction warning
│   │   └── DocumentViewer.tsx  # Full modal viewer
│   ├── admin/
│   │   ├── AuditTrailPanel.tsx
│   │   ├── AccessMatrixTable.tsx
│   │   └── ImplementationChecklist.tsx
│   └── layout/
│       ├── Header.tsx
│       ├── ComplianceFooter.tsx
│       └── StatsBar.tsx
├── hooks/
│   ├── useAuth.tsx         # AuthContext + AuthProvider + useAuth()
│   └── useAuditLog.ts      # Audit logging hook
├── lib/
│   ├── redaction.ts        # Core redaction logic + access matrix
│   └── data.ts             # Mock documents + checklist items
└── types/
    └── index.ts            # All TypeScript types
```

---

## Security Architecture

### Redaction Engine (`src/lib/redaction.ts`)
Runs on every document render. Patterns:
| Field | Pattern |
|-------|---------|
| SSN | `/\b\d{3}-\d{2}-\d{4}\b/g` |
| Financials | `/\$[\d,]+\.\d{2}/g` |
| Bank accounts | `/\b\d{10,16}\b/g` |
| Medical | `/\b(diagnosis\|treatment\|disability)\b/gi` |

### Access Matrix (F.S. 720.303)
| Category | Public | Resident | Admin |
|----------|--------|----------|-------|
| Governing | ✓ | ✓ | ✓ |
| Meetings | ✓ | ✓ | ✓ |
| Financial | ✗ | ✓ | ✓ |
| Contracts | ✗ | ✓ | ✓ |
| Architectural | ✗ | ✓ | ✓ |
| Insurance | ✗ | ✓ | ✓ |
| Violations | ✗ | ✓ | ✓ |
| Legal | ✗ | ✗ | ✓ |

### Audit Trail
All `VIEW` and `DOWNLOAD` events are logged with:
- Timestamp (ISO 8601)
- User ID + email
- Document ID + title
- IP address
- Action type

**Production note:** Move audit writes to a Next.js API Route (`/api/audit`) so they run server-side and are tamper-proof.

---

## Production TODOs

- [ ] Replace mock `AuthProvider` with NextAuth.js + Firebase Auth
- [ ] Move redaction to a server-side API route (never trust client-side alone)
- [ ] Deploy Firestore security rules that mirror `ACCESS_MATRIX`
- [ ] Add PDF watermarking microservice (`OFFICIAL RECORD` stamp on download)
- [ ] Implement 90-day auto-purge Cloud Function for draft documents
- [ ] Write audit entries server-side via `/api/audit` POST route
- [ ] Add rate limiting to document view/download endpoints

---

## F.S. 720.303 Compliance

This portal is structured to meet the mandatory record-keeping and access requirements of **Florida Statute 720.303**, including:
- Public availability of governing documents
- Resident access to financial summaries and meeting minutes
- Automated redaction of SSNs, bank data, and medical information
- Audit trail for all document access

*This is a demo implementation. Consult your HOA attorney before going live.*
