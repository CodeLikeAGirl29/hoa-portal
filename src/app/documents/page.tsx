import { Header } from "@/components/layout/Header";
import { ComplianceFooter } from "@/components/layout/ComplianceFooter";
import { DocumentVault } from "@/components/vault/DocumentVault";

export default function DocumentsPage() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <Header />
      <main className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col">
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 min-h-[480px]">
            {/* View and Download handlers can be passed directly or managed via state as in HomePage */}
            <DocumentVault onView={() => {}} onDownload={() => {}} />
          </div>
        </div>
      </main>
      <ComplianceFooter />
    </div>
  );
}
