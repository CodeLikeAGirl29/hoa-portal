"use client";

import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";
import { DocumentViewer } from "@/components/vault/DocumentViewer";
import type { RedactedDocument } from "@/types";

const ACCESS_LABEL: Record<string, string> = {
  public: "Public records only",
  resident: "Resident access",
  admin: "Admin: full vault",
  superadmin: "Super admin: all communities",
};

export default function DocumentsPage() {
  const { role, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";

  const [viewingDoc, setViewingDoc] = useState<RedactedDocument | null>(null);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Page header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 tracking-tight m-0 font-serif">
                Document vault
              </h1>
              <p className="text-sm text-gray-600 mt-1 m-0">
                {hoa?.name ?? "Florida HOA Portal"}, official records under
                F.S. 720.303
              </p>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs font-semibold"
              style={{ background: `${accent}14`, color: accent }}
            >
              {ACCESS_LABEL[role] ?? ACCESS_LABEL.public}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-6 space-y-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="p-4 sm:p-6">
            <DocumentVault onView={setViewingDoc} />
          </div>
        </div>

        <p className="px-4 sm:px-5 py-4 bg-white rounded-xl border border-gray-200 text-xs text-gray-600 leading-relaxed m-0">
          <strong className="text-gray-800">Florida Statute 720.303:</strong>{" "}
          this portal gives access to official HOA records as the law
          requires. Sensitive details in a document&apos;s text are hidden from
          anyone who isn&apos;t an administrator, and signed-in access is
          logged.
        </p>
      </main>

      <ComplianceFooter />

      <DocumentViewer
        document={viewingDoc}
        onClose={() => setViewingDoc(null)}
      />
    </div>
  );
}
