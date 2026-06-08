import type { DocumentCategory } from "@/types";
import { ACCESS_MATRIX, CATEGORY_META } from "@/lib/redaction";

const ORDERED_CATEGORIES: DocumentCategory[] = [
  "governing",
  "meetings",
  "financial",
  "contracts",
  "architectural",
  "insurance",
  "violations",
  "legal",
];

const STATUTE_MAP: Partial<Record<DocumentCategory, string>> = {
  governing:     "F.S. 720.303(5)(a)",
  meetings:      "F.S. 720.303(2)(a)",
  financial:     "F.S. 720.303(4)",
  contracts:     "F.S. 720.303(5)(b)",
  architectural: "F.S. 720.3035",
  insurance:     "F.S. 720.303(7)",
  violations:    "F.S. 720.303(5)(c)",
  legal:         "Attorney-client privilege",
};

function Check({ value }: { value: boolean }) {
  return value ? (
    <span className="text-green-700 text-base font-bold">✓</span>
  ) : (
    <span className="text-gray-200 text-base">—</span>
  );
}

export function AccessMatrixTable() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b-2 border-gray-100">
            <th className="text-left px-4 py-3 text-gray-500 font-semibold">
              Document Category
            </th>
            <th className="text-left px-4 py-3 text-gray-500 font-semibold text-xs tracking-wide uppercase">
              Statute
            </th>
            {(["Public", "Resident", "Admin"] as const).map((r) => (
              <th key={r} className="text-center px-4 py-3 text-gray-500 font-semibold">
                {r}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ORDERED_CATEGORIES.map((cat, i) => {
            const meta = CATEGORY_META[cat];
            const rule = ACCESS_MATRIX[cat];
            return (
              <tr
                key={cat}
                className="border-b border-gray-50"
                style={{ background: i % 2 === 0 ? "#fafaf9" : "#fff" }}
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span>{meta.icon}</span>
                    <span className="font-medium text-gray-800">{meta.label}</span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-xs text-gray-400 font-mono">
                    {STATUTE_MAP[cat] ?? "—"}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={rule.public} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={rule.resident} />
                </td>
                <td className="px-4 py-3 text-center">
                  <Check value={rule.admin} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
