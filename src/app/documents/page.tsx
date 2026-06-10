"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import type { HOADocument } from "@/types";

export default function DocumentsPage() {
  const { role, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";

  const [viewingDoc, setViewingDoc] = useState<HOADocument | null>(null);

  const handleView = useCallback((doc: HOADocument) => {
    setViewingDoc(doc);
  }, []);

  const handleDownload = useCallback((_doc: HOADocument) => {
    // download handler — extend later with actual file download
  }, []);

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

            <div
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: `${accent}12`, color: accent }}
            >
              {role === "public" && "🔓 Public records only"}
              {role === "resident" && "🔐 Resident access"}
              {role === "admin" && "🛡️ Admin — full vault"}
              {role === "superadmin" && "⚡ Super Admin"}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        {/* Public notice */}
        {role === "public" && (
          <div className="flex items-start gap-3 px-5 py-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800">
            <span>ℹ️</span>
            <span>
              <strong>Public Access</strong> — Viewing publicly available
              records per F.S. 720.303.{" "}
              <a href="/login" className="underline font-semibold">
                Sign in as a resident
              </a>{" "}
              to access financial summaries, meeting minutes, and more.
            </span>
          </div>
        )}

        {/* Main vault */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-6">
            <DocumentVault onView={handleView} onDownload={handleDownload} />
          </div>
        </div>

        {/* F.S. 720 compliance note */}
        <div className="px-5 py-4 bg-white rounded-xl border border-gray-100 text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-500">
            Florida Statute 720.303 Notice:
          </strong>{" "}
          This portal provides access to official HOA records as required by
          Florida law. Documents containing personally identifiable information
          are automatically redacted for non-administrator viewers. All document
          access is logged to an immutable audit trail.
        </div>
      </main>

      <ComplianceFooter />

      {/* Viewer modal — only renders when a doc is selected */}
      <DocumentViewer
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}
