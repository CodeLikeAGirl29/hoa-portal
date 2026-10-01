import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPublicDocument } from "@/lib/public-hoa";
import { CATEGORY_META, REDACTED_FIELD_LABELS } from "@/lib/redaction";
import { formatBytes, isInlineMime } from "@/lib/files";

// Always read fresh: if an admin makes a document private, this page must
// stop showing it immediately rather than serving a cached copy.
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string; id: string }> };

async function load(slug: string, id: string) {
  try {
    return await getPublicDocument(slug, id);
  } catch (err) {
    console.error(`Public document "${slug}/${id}" failed to load:`, err);
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) return { title: "Document not found" };
  return {
    title: `${data.document.title} | ${data.hoa.name}`,
    description: `Public record of ${data.hoa.name}.`,
  };
}

// A public document, readable by anyone without signing in.
export default async function PublicDocumentPage({ params }: Props) {
  const { slug, id } = await params;
  const data = await load(slug, id);
  if (!data) notFound();

  const { hoa, document: doc } = data;
  const accent = hoa.accentColor;
  const category = CATEGORY_META[doc.category];
  const downloadUrl = `/api/docs/${doc.id}/download`;
  const details = [
    category?.label,
    doc.pages ? `${doc.pages} pages` : null,
    doc.file ? formatBytes(doc.file.size) : doc.fileSize,
    `Last modified ${doc.lastModified}`,
  ].filter(Boolean);

  return (
    <div className="min-h-screen">
      <div style={{ background: accent }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-8 py-4">
          <Link
            href={`/hoa/${hoa.slug}`}
            className="text-sm font-medium text-white no-underline hover:underline"
          >
            <span aria-hidden="true">← </span>
            {hoa.name} public records
          </Link>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-8 py-8">
        <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight m-0 font-serif">
          {doc.title}
        </h1>
        <p className="text-sm text-gray-600 mt-2 mb-6">{details.join(", ")}</p>

        <div className="flex flex-wrap gap-2 mb-6">
          {doc.file && isInlineMime(doc.file.mimeType) && (
            <a
              href={`${downloadUrl}?inline=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 rounded-lg text-sm font-semibold no-underline bg-white border border-gray-300 text-gray-800 hover:bg-gray-100"
            >
              Open file
            </a>
          )}
          <a
            href={downloadUrl}
            className="px-4 py-2 rounded-lg text-sm font-semibold no-underline text-white"
            style={{ background: accent }}
          >
            Download{doc.file ? ` ${doc.file.fileName}` : " as text"}
          </a>
        </div>

        {doc.wasRedacted && (
          <p
            className="rounded-lg px-4 py-3 text-sm mb-4"
            style={{
              background: "#FAEEDA",
              border: "1px solid #EF9F27",
              color: "#633806",
            }}
          >
            <strong>Some details are hidden.</strong> The public version of
            this text leaves out:{" "}
            {doc.redactedFields.map((f) => REDACTED_FIELD_LABELS[f]).join(", ")}
            .
          </p>
        )}

        {doc.content ? (
          <div className="bg-white rounded-xl border border-gray-200 p-5 sm:p-8 text-base leading-7 text-gray-800 whitespace-pre-wrap font-serif">
            {doc.content}
          </div>
        ) : (
          <p className="text-sm text-gray-600">
            This record is provided as a file. Use the buttons above to open
            or download it.
          </p>
        )}

        <p className="text-xs text-gray-600 mt-8">
          Published by {hoa.name} under Florida Statute 720.303.{" "}
          <Link href="/login" className="underline" style={{ color: accent }}>
            Residents can sign in
          </Link>{" "}
          to see more records.
        </p>
      </main>
    </div>
  );
}
