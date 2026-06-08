"use client";

import { useState, useCallback } from "react";
import type { HOADocument } from "@/types";
import { MOCK_DOCUMENTS } from "@/lib/data";
import { canAccess } from "@/lib/redaction";
import { useAuth } from "@/hooks/useAuth";
import { useAuditLog } from "@/hooks/useAuditLog";

import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { StatsBar } from "@/components/layout/StatsBar";
import { Tabs } from "@/components/ui/Tabs";
import { AlertBanner } from "@/components/ui";
import { DownloadToast } from "@/components/ui/DownloadToast";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import { AuditTrailPanel } from "@/components/admin/AuditTrailPanel";
import { AccessMatrixTable } from "@/components/admin/AccessMatrixTable";
import { ImplementationChecklist } from "@/components/admin/ImplementationChecklist";

function useTabsForRole(role: string) {
  const docCount = MOCK_DOCUMENTS.filter((d) => {
    if (role === "admin") return true;
    if (role === "resident") return d.isAccessibleToResidents;
    return d.isPublic;
  }).length;

  if (role === "public") {
    return [
      { id: "vault", label: "Public Documents", icon: "📁", count: docCount },
      { id: "matrix", label: "Access Matrix", icon: "🛡️" },
    ];
  }

  const base = [
    { id: "vault", label: "Document Vault", icon: "📁", count: docCount },
    { id: "matrix", label: "Access Matrix", icon: "🛡️" },
  ];

  if (role === "admin") {
    return [
      ...base,
      { id: "audit", label: "System Audit", icon: "🗃️" },
      { id: "checklist", label: "Compliance Board", icon: "📋" },
    ];
  }
  return base;
}

export default function Dashboard() {
  const { role } = useAuth();
  const { logEvent } = useAuditLog();
  const tabs = useTabsForRole(role);

  const [activeTab, setActiveTab] = useState("vault");
  const [viewingDoc, setViewingDoc] = useState<HOADocument | null>(null);
  const [downloadToast, setDownloadToast] = useState<HOADocument | null>(null);

  const effectiveTab = tabs.some((t) => t.id === activeTab)
    ? activeTab
    : "vault";

  const handleTabChange = useCallback(
    (id: string) => {
      setActiveTab(id);
      logEvent("SEARCH", undefined, undefined, { tab: id });
    },
    [logEvent],
  );

  const handleView = useCallback(
    (doc: HOADocument) => {
      setViewingDoc(doc);
      logEvent("VIEW", doc.id, doc.title);
    },
    [logEvent],
  );

  const handleDownload = useCallback(
    (doc: HOADocument) => {
      setDownloadToast(doc);
      logEvent("DOWNLOAD", doc.id, doc.title);
    },
    [logEvent],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 justify-between">
      <Header />

      {/* Main Container with refined margins and max-width layout */}
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        {/* Role contextual banners */}
        {role === "public" && (
          <AlertBanner variant="info">
            <strong>Public Access Mode</strong> — You are viewing publicly
            authorized records. Sign in with resident credentials to access
            financial records and meeting logs.
          </AlertBanner>
        )}
        {role === "admin" && (
          <AlertBanner variant="admin">
            <strong>Administrative Workspace</strong> — Full, unredacted
            database visibility. All view and download interactions are locked
            securely into the immutable audit sequence.
          </AlertBanner>
        )}

        {/* High-density metrics row */}
        {role !== "public" && (
          <div className="mb-4">
            <StatsBar />
          </div>
        )}

        {/* Workspace Card Container: Hooks tabs and panels into a single component surface */}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden transition-all duration-200">
          <div className="bg-slate-50/45 border-b border-slate-100 px-5 pt-4">
            <Tabs
              tabs={tabs}
              active={effectiveTab}
              onChange={handleTabChange}
            />
          </div>

          <div className="p-5 flex-1 min-h-[480px]">
            {effectiveTab === "vault" && (
              <DocumentVault onView={handleView} onDownload={handleDownload} />
            )}
            {effectiveTab === "matrix" && <AccessMatrixTable />}
            {effectiveTab === "audit" && <AuditTrailPanel />}
            {effectiveTab === "checklist" && <ImplementationChecklist />}
          </div>
        </div>
      </main>

      <ComplianceFooter />

      {/* Presentation Components */}
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
