"use client";

import { useState, useCallback } from "react";
import type { HOADocument } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import { DownloadToast } from "@/components/ui/DownloadToast";
import { AlertBanner } from "@/components/ui";

function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)),
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

export default function DocumentsPage() {
  const { role, hoa } = useAuth();
  const { log: logEvent } = useAuditLog();
  const accent = hoa?.accentColor ?? "#185FA5";

  const [viewingDoc, setViewingDoc] = useState<HOADocument | null>(null);
  const [downloadToast, setDownloadToast] = useState<HOADocument | null>(null);

  const handleView = useCallback(
    (doc: HOADocument) => {
      setViewingDoc(doc);
      logEvent("VIEW", { documentId: doc.id, documentTitle: doc.title });
    },
    [logEvent],
  );

  const handleDownload = useCallback(
    (doc: HOADocument) => {
      setDownloadToast(doc);
      logEvent("DOWNLOAD", { documentId: doc.id, documentTitle: doc.title });
    },
    [logEvent],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
                📁 Document Vault
              </h1>
              <p className="text-sm text-gray-400 mt-1 m-0">
                {hoa?.name ?? "Your HOA"} · F.S. 720.303 Compliant Records
              </p>
            </div>

            {/* Breadcrumb-style role indicator */}
            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: `${accent}12`, color: accent }}
            >
              {role === "public" &&
                "🔓 Public Access — showing public records only"}
              {role === "resident" &&
                "🔐 Resident Access — showing all authorized records"}
              {role === "admin" && "🛡️ Admin Access — full vault, unredacted"}
              {role === "superadmin" && "⚡ Super Admin — full access"}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6">
        {/* Public notice */}
        {role === "public" && (
          <AlertBanner variant="info">
            <strong>Public Access</strong> — You are viewing publicly available
            records per F.S. 720.303.{" "}
            <a href="/login" className="underline font-semibold">
              Sign in as a resident
            </a>{" "}
            to access financial summaries, meeting minutes, and more.
          </AlertBanner>
        )}

        {/* Stats row for residents/admins */}
        {role !== "public" && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
            {[
              { label: "All Records", icon: "📄", filter: "all" },
              { label: "Governing", icon: "⚖️", filter: "governing" },
              { label: "Financial", icon: "💰", filter: "financial" },
              { label: "Meetings", icon: "📋", filter: "meetings" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3 hover:shadow-sm transition-shadow cursor-default"
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-medium text-gray-700">
                  {s.label}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Main vault */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-6">
            <DocumentVault onView={handleView} onDownload={handleDownload} />
          </div>
        </div>

        {/* F.S. 720 compliance note */}
        <div className="mt-6 px-5 py-4 bg-white rounded-xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-500">
            Florida Statute 720.303 Notice:
          </strong>{" "}
          This portal provides access to official HOA records as required by
          Florida law. Documents containing personally identifiable information
          (SSNs, financial account numbers, medical records) are automatically
          redacted for non-administrator viewers. All document access is logged
          to an immutable audit trail. For questions about record availability,
          contact your HOA board directly.
        </div>
      </main>

      <ComplianceFooter />

      {viewingDoc && (
        <DocumentViewer
          document={viewingDoc}
          onClose={() => setViewingDoc(null)}
        />
      )}

      {downloadToast && (
        <DownloadToast
          document={downloadToast}
          onClose={() => setDownloadToast(null)}
        />
      )}
    </div>
  );
}
