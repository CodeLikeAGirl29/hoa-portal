// src/components/vault/DocumentViewer.tsx
"use client";

import { useEffect, useState } from "react";
import { X, Download, FileText, AlertCircle, Loader2 } from "lucide-react";

interface Document {
  id: string;
  title: string;
  category: string;
  content?: string | null;
  fileUrl?: string | null;
  fileType?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Props {
  docId: string | null;
  onClose: () => void;
}

export default function DocumentViewer({ docId, onClose }: Props) {
  const [doc, setDoc] = useState<Document | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!docId) return;

    setLoading(true);
    setError(null);
    setDoc(null);

    fetch(`/api/docs/${docId}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load document (${res.status})`);
        return res.json();
      })
      .then(({ doc }) => setDoc(doc))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [docId]);

  if (!docId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-blue-50 shrink-0">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {loading ? "Loading…" : (doc?.title ?? "Document")}
              </h2>
              {doc && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {doc.category} · Updated{" "}
                  {new Date(doc.updatedAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4 shrink-0">
            {doc?.fileUrl && (
              <a
                href={doc.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading document…</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-48 gap-3 text-red-500">
              <AlertCircle className="w-8 h-8" />
              <p className="text-sm font-medium">{error}</p>
              <button
                onClick={() => {
                  setError(null);
                  setLoading(true);
                  fetch(`/api/docs/${docId}`)
                    .then((r) => r.json())
                    .then(({ doc }) => setDoc(doc))
                    .catch((e) => setError(e.message))
                    .finally(() => setLoading(false));
                }}
                className="text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          )}

          {doc && !loading && !error && <DocContent doc={doc} />}
        </div>
      </div>
    </div>
  );
}

// ─── Content renderer — picks strategy based on fileType / content ────────────

function DocContent({ doc }: { doc: Document }) {
  const isPdf =
    doc.fileType === "application/pdf" ||
    doc.fileUrl?.toLowerCase().endsWith(".pdf");

  // PDF: render in iframe
  if (isPdf && doc.fileUrl) {
    return (
      <iframe
        src={doc.fileUrl}
        className="w-full h-[60vh] rounded-lg border border-gray-200"
        title={doc.title}
      />
    );
  }

  // Text/markdown content stored in DB
  if (doc.content) {
    return (
      <div className="prose prose-sm prose-gray max-w-none">
        <FormattedContent content={doc.content} />
      </div>
    );
  }

  // File URL but not PDF (e.g. Word, image) — link out
  if (doc.fileUrl) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-4 text-gray-500">
        <FileText className="w-12 h-12 text-gray-300" />
        <p className="text-sm">This file type cannot be previewed inline.</p>
        <a
          href={doc.fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Open file
        </a>
      </div>
    );
  }

  // Nothing to show
  return (
    <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-400">
      <FileText className="w-10 h-10 text-gray-200" />
      <p className="text-sm">No content available for this document.</p>
    </div>
  );
}

// Simple formatter: preserves line breaks, bolds **text**, renders headings
function FormattedContent({ content }: { content: string }) {
  const lines = content.split("\n");

  return (
    <div className="space-y-2 text-gray-700 text-sm leading-relaxed whitespace-pre-wrap">
      {lines.map((line, i) => {
        if (line.startsWith("# "))
          return (
            <h1 key={i} className="text-xl font-bold text-gray-900 mt-4 mb-2">
              {line.slice(2)}
            </h1>
          );
        if (line.startsWith("## "))
          return (
            <h2
              key={i}
              className="text-lg font-semibold text-gray-900 mt-3 mb-1"
            >
              {line.slice(3)}
            </h2>
          );
        if (line.startsWith("### "))
          return (
            <h3
              key={i}
              className="text-base font-semibold text-gray-800 mt-2 mb-1"
            >
              {line.slice(4)}
            </h3>
          );
        if (line.trim() === "") return <div key={i} className="h-2" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

function renderInline(text: string) {
  // Handle **bold**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i}>{part.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
