export function ComplianceFooter() {
  return (
    <footer className="border-t border-gray-100 bg-gray-50 px-8 py-5">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
        <div>
          <span className="font-semibold text-gray-500">Pelican Bay HOA</span>
          {" · "}Document Portal{" · "}
          <span className="text-blue-600">F.S. 720.303 Compliant</span>
        </div>
        <div className="flex flex-wrap gap-4">
          <span>90-day draft auto-purge enabled</span>
          <span>·</span>
          <span>Downloads watermarked "OFFICIAL RECORD"</span>
          <span>·</span>
          <span>RBAC enforced at database level</span>
        </div>
      </div>
    </footer>
  );
}
