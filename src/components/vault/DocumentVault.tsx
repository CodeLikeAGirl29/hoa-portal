"use client";

import { useState, useEffect, useCallback } from "react";
import type { RedactedDocument, DocumentCategory, HOADocument } from "@/types";
import { CATEGORY_META } from "@/lib/redaction";
import { useAuth } from "@/hooks/useAuth";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploadModal } from "./DocumentUploadModal";

interface DocumentVaultProps {
  onView: (doc: HOADocument) => void;
  onDownload: (doc: HOADocument) => void;
}

export function DocumentVault({ onView, onDownload }: DocumentVaultProps) {
  const { role, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";
  const isAdmin = role === "admin" || role === "superadmin";
  const [viewingDocId, setViewingDocId] = useState<string | null>(null);

  const [documents, setDocuments] = useState<RedactedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<DocumentCategory | "all">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RedactedDocument | null>(null);

  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (filterCat !== "all") params.set("category", filterCat);
      if (hoa?.id) params.set("hoaId", hoa.id); // Ensures superadmins/public pass the context

      const res = await fetch(`/api/documents?${params}`);

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Non-JSON response:", text);
        throw new Error(
          "Server returned an invalid format. Please check the network log.",
        );
      }

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to load documents.");
      }

      setDocuments(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [search, filterCat, hoa?.id]);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  async function handleDelete(doc: RedactedDocument) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
    fetchDocuments();
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex gap-3 mb-6 flex-wrap items-center">
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white transition-colors"
        />

        <select
          value={filterCat}
          onChange={(e) =>
            setFilterCat(e.target.value as DocumentCategory | "all")
          }
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer outline-none focus:border-blue-400"
        >
          <option value="all">All Categories</option>
          {(
            Object.entries(CATEGORY_META) as [
              DocumentCategory,
              (typeof CATEGORY_META)[DocumentCategory],
            ][]
          ).map(([k, v]) => (
            <option key={k} value={k}>
              {v.icon} {v.label}
            </option>
          ))}
        </select>

        <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 flex items-center">
          {isLoading
            ? "…"
            : `${documents.length} record${documents.length !== 1 ? "s" : ""}`}
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setEditingDoc(null);
              setShowUpload(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer border-0 transition-all"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${shadeColor(accent, -20)})`,
            }}
          >
            + Add Document
          </button>
        )}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="animate-spin text-2xl mb-3 inline-block">🔄</div>
          <div className="text-sm">Loading documents…</div>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600 bg-red-50/50 border border-red-100 rounded-xl">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="text-sm font-semibold">{error}</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-4xl mb-3">📁</div>
          <div className="text-base">No documents found</div>
          {isAdmin && (
            <button
              onClick={() => setShowUpload(true)}
              className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer border-0"
              style={{ background: accent }}
            >
              Add the first document
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={(id) => setViewingDocId(id)}
              onDownload={onDownload}
              onEdit={
                isAdmin
                  ? (d) => {
                      setEditingDoc(d);
                      setShowUpload(true);
                    }
                  : undefined
              }
              onDelete={isAdmin ? handleDelete : undefined}
            />
          ))}
        </div>
      )}

      {/* Upload / Edit modal */}
      {showUpload && (
        <DocumentUploadModal
          initial={
            editingDoc
              ? {
                  id: editingDoc.id,
                  title: editingDoc.title,
                  category: editingDoc.category,
                  content: editingDoc.content,
                  isPublic: editingDoc.isPublic,
                  isAccessibleToResidents: editingDoc.isAccessibleToResidents,
                  requiresLogin: editingDoc.requiresLogin,
                  isMandatoryRecord: editingDoc.isMandatoryRecord,
                  fileSize: editingDoc.fileSize ?? "",
                  pages: editingDoc.pages?.toString() ?? "",
                }
              : undefined
          }
          onSave={fetchDocuments}
          onClose={() => {
            setShowUpload(false);
            setEditingDoc(null);
          }}
        />
      )}
    </div>
  );
}

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
