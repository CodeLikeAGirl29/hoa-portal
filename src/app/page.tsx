"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import AdminDashboard from "@/components/dashboard/AdminDashboard";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import { AnnouncementBanner } from "@/components/AnnouncementBanner";
import { StatsBar } from "@/components/layout/StatsBar";
import type { RedactedDocument } from "@/types";

export default function HomePage() {
  const { role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-sm text-gray-600" role="status">
          Loading your portal…
        </div>
      </div>
    );
  }

  if (role === "admin" || role === "superadmin") {
    return (
      <>
        <Header />
        <div className="max-w-6xl mx-auto px-4 sm:px-8 pt-6">
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

  const [docs, setDocs] = useState<RedactedDocument[]>([]);
  const [viewingDoc, setViewingDoc] = useState<RedactedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-6 flex-1 flex flex-col">
        <AnnouncementBanner />

        {role === "resident" && <StatsBar docs={docs} />}

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-6 min-h-[480px]">
            <DocumentVault onView={setViewingDoc} onLoaded={setDocs} />
          </div>
        </div>
      </main>
      <ComplianceFooter />

      {/* The viewer records the view and offers the download. */}
      <DocumentViewer
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}
