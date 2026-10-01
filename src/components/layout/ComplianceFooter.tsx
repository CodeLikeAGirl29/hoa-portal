export function ComplianceFooter() {
  return (
    <footer className="border-t border-gray-200 bg-white px-4 sm:px-8 py-5 mt-8">
      <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-xs text-gray-600">
        <div>
          <span className="font-semibold text-gray-800">My FL HOA</span>{" "}
          document portal, built around Florida Statute 720.303
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          <span>Signed-in document access is logged</span>
          <span>
            Created by{" "}
            <a
              href="http://lindseyk.dev"
              className="text-blue-800 underline underline-offset-2"
            >
              lindseyk
            </a>
          </span>
        </div>
      </div>
    </footer>
  );
}
