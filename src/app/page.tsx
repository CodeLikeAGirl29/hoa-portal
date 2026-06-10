"use client";

import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { useState, useCallback } from "react";
import type { RedactedDocument } from "@/types";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import { useAuditLog } from "@/hooks/useAuditLog";
import { AlertBanner } from "@/components/ui";
import { StatsBar } from "@/components/layout/StatsBar";

export default function HomePage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-pulse">⚓</div>
          <div className="text-sm text-gray-300">Loading your portal…</div>
        </div>
      </div>
    );
  }

  if (role === "admin" || role === "superadmin") {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <AnnouncementBanner />
        </div>
        <AdminDashboard />
        <ComplianceFooter />
      </>
    );
  }

  return <DocumentPortal />;
}

function DocumentPortal() {
  const { role } = useAuth();
  const { log: logEvent } = useAuditLog();

  const [viewingDoc, setViewingDoc] = useState<RedactedDocument | null>(null);
  const [downloadDoc, setDownloadDoc] = useState<RedactedDocument | null>(null);

  const handleView = useCallback(
    (doc: RedactedDocument) => {
      setViewingDoc(doc);
      logEvent("VIEW", { documentId: doc.id, documentTitle: doc.title });
    },
    [logEvent],
  );

  const handleDownload = useCallback(
    (doc: RedactedDocument) => {
      setDownloadDoc(doc);
      logEvent("DOWNLOAD", { documentId: doc.id, documentTitle: doc.title });
    },
    [logEvent],
  );

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col">
        <AnnouncementBanner />

        {role === "public" && (
          <AlertBanner variant="info">
            <strong>Public Access Mode</strong> — Viewing publicly authorized
            records.{" "}
            <a href="/login" className="underline">
              Sign in
            </a>{" "}
            to access financial records and meeting minutes.
          </AlertBanner>
        )}

        {role === "resident" && <StatsBar />}

        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 min-h-[480px]">
            <DocumentVault onView={handleView} onDownload={handleDownload} />
          </div>
        </div>
      </main>
      <ComplianceFooter />

      <DocumentViewer
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}
