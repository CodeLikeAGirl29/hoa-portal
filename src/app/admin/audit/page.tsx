"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { AuditTrailPanel } from "@/components/admin/AuditTrailPanel";

export default function AuditPage() {
  const { role, hoa, isLoading } = useAuth();
  const router = useRouter();
  const accent = hoa?.accentColor ?? "#185FA5";

  useEffect(() => {
    if (!isLoading && role !== "admin" && role !== "superadmin") {
      router.replace("/");
    }
  }, [role, isLoading, router]);

  if (isLoading) return null;
  if (role !== "admin" && role !== "superadmin") return null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Header />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
              🗃️ Audit Trail
            </h1>
            <p className="text-sm text-gray-400 mt-1 m-0">
              {hoa?.name ?? "Your HOA"} · Immutable record of all document
              activity per F.S. 720.303
            </p>
          </div>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold"
            style={{ background: `${accent}12`, color: accent }}
          >
            🔒 Tamper-evident log
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <AuditTrailPanel />
        </div>
      </main>

      <ComplianceFooter />
    </div>
  );
}
