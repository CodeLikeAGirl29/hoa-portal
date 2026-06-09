import type { Metadata } from "next";
import Link from "next/link";

interface PublicDoc {
  id: string;
  title: string;
  category: string;
  fileSize: string | null;
  pages: number | null;
  uploadDate: string;
  isMandatoryRecord: boolean;
}

interface HOAInfo {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
}

const CATEGORY_ICONS: Record<string, string> = {
  governing: "⚖️",
  financial: "💰",
  meetings: "📋",
  contracts: "📝",
  architectural: "🏗️",
  insurance: "🛡️",
  violations: "⚠️",
  legal: "🏛️",
};

function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)),
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function getMonogram(name: string): string {
  return name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

async function getHOAData(
  slug: string,
): Promise<{ hoa: HOAInfo; documents: PublicDoc[] } | null> {
  try {
    const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/public/hoa/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHOAData(slug);
  if (!data) return { title: "Community Not Found" };
  return {
    title: `${data.hoa.name} | Florida HOA Portal`,
    description: `Public records and documents for ${data.hoa.name} in ${data.hoa.city ?? "Florida"}.`,
  };
}

export default async function PublicHOAPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getHOAData(slug);

  if (!data) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🏘️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Community Not Found
          </h1>
          <p className="text-gray-400 mb-6">
            No active HOA exists with that address.
          </p>
          <Link
            href="/login"
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white no-underline"
            style={{ background: "#185FA5" }}
          >
            Back to Portal
          </Link>
        </div>
      </div>
    );
  }

  const { hoa, documents } = data;
  const accent = hoa.accentColor;
  const accentDark = shadeColor(accent, -20);

  // Group documents by category
  const grouped = documents.reduce<Record<string, PublicDoc[]>>((acc, doc) => {
    if (!acc[doc.category]) acc[doc.category] = [];
    acc[doc.category].push(doc);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero header */}
      <div
        style={{
          background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
        }}
      >
        <div className="max-w-4xl mx-auto px-8 py-10">
          <div className="flex items-center gap-4 mb-6">
            {hoa.logoUrl ? (
              <img
                src={hoa.logoUrl}
                alt={`${hoa.name} logo`}
                className="w-14 h-14 rounded-xl object-cover"
              />
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl font-bold"
                style={{ background: "rgba(255,255,255,0.2)" }}
              >
                {getMonogram(hoa.name)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight m-0">
                {hoa.name}
              </h1>
              {hoa.city && (
                <p className="text-white/70 text-sm m-0 mt-1">
                  📍 {hoa.city}, {hoa.state} {hoa.zip}
                </p>
              )}
            </div>
          </div>

          {/* Contact row */}
          <div className="flex flex-wrap gap-4 text-sm text-white/80">
            {hoa.phone && <span>📞 {hoa.phone}</span>}
            {hoa.email && (
              <a
                href={`mailto:${hoa.email}`}
                className="text-white/80 hover:text-white no-underline"
              >
                ✉️ {hoa.email}
              </a>
            )}
            {hoa.website && (
              <a
                href={hoa.website}
                target="_blank"
                className="text-white/80 hover:text-white no-underline"
              >
                🌐 {hoa.website}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Compliance bar */}
      <div className="bg-white border-b border-gray-100 px-8 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-400 m-0">
            Public records published per{" "}
            <strong>Florida Statute 720.303</strong> · {documents.length} public
            document{documents.length !== 1 ? "s" : ""}
          </p>
          <Link
            href="/login"
            className="text-xs font-semibold no-underline px-3 py-1.5 rounded-lg border transition-all"
            style={{
              color: accent,
              borderColor: `${accent}40`,
              background: `${accent}08`,
            }}
          >
            🔐 Resident Sign In →
          </Link>
        </div>
      </div>

      {/* Documents */}
      <div className="max-w-4xl mx-auto px-8 py-8">
        {documents.length === 0 ? (
          <div className="text-center py-16 text-gray-300">
            <div className="text-5xl mb-4">📁</div>
            <div className="text-lg">No public documents available yet.</div>
            <p className="text-sm mt-2">
              Residents can sign in to access additional records.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).map(([category, docs]) => (
              <div key={category}>
                <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                  <span>{CATEGORY_ICONS[category] ?? "📄"}</span>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                  <span className="text-gray-300 font-normal normal-case tracking-normal">
                    ({docs.length})
                  </span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex items-start gap-3 hover:shadow-sm transition-shadow"
                    >
                      <span className="text-2xl flex-shrink-0 mt-0.5">
                        {CATEGORY_ICONS[doc.category] ?? "📄"}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-sm text-gray-900 leading-snug">
                          {doc.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          {doc.isMandatoryRecord && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700">
                              F.S. 720 Required
                            </span>
                          )}
                          {doc.pages && (
                            <span className="text-[11px] text-gray-400">
                              {doc.pages}p
                            </span>
                          )}
                          {doc.fileSize && (
                            <span className="text-[11px] text-gray-400">
                              {doc.fileSize}
                            </span>
                          )}
                          <span className="text-[11px] text-gray-300">
                            {new Date(doc.uploadDate).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {/* Sign in to view */}
                      <Link
                        href="/login"
                        className="flex-shrink-0 text-xs font-semibold no-underline px-2.5 py-1.5 rounded-lg transition-all"
                        style={{ color: accent, background: `${accent}12` }}
                      >
                        View
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400">
            {hoa.name} · Public Records Portal · Florida Statute 720.303
            Compliant
          </p>
          <p className="text-xs text-gray-300 mt-1">
            Powered by{" "}
            <Link href="/" className="no-underline" style={{ color: accent }}>
              Florida HOA Portal
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
