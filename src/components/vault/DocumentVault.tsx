"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploadModal } from "./DocumentUploadModal";
import type { RedactedDocument } from "@/types";

interface DocumentVaultProps {
  onView: (doc: RedactedDocument) => void;
  onDownload: (doc: RedactedDocument) => void;
}

const CATEGORIES = [
  "All",
  "Governing",
  "Financial",
  "Meetings",
  "Notices",
  "Insurance",
  "Contracts",
];

export function DocumentVault({ onView, onDownload }: DocumentVaultProps) {
  const { role } = useAuth();
  const isAdmin = role === "admin" || role === "superadmin";

  const [docs, setDocs] = useState<RedactedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RedactedDocument | null>(null);

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const data = await res.json();
      setDocs(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleDelete(doc: RedactedDocument) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete");
      fetchDocs();
    } catch (err: any) {
      alert(err.message ?? "Delete failed");
    }
  }

  const filtered = docs.filter((d) => {
    const matchesSearch =
      !search || d.title.toLowerCase().includes(search.toLowerCase());
    const matchesCategory =
      activeCategory === "All" ||
      d.category.toLowerCase() === activeCategory.toLowerCase();
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          className="flex-1 min-w-48 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {isAdmin && (
          <button
            onClick={() => setShowUpload(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer border-0"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            + Add Document
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all ${
              activeCategory === cat
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <div className="text-3xl mb-3 animate-pulse">📄</div>
          <div className="text-sm text-gray-400">Loading documents…</div>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-8 text-center">
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-sm text-red-500 mb-3">{error}</div>
          <button
            onClick={fetchDocs}
            className="px-4 py-2 rounded-xl text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 cursor-pointer bg-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm text-gray-400">
            {search
              ? `No documents matching "${search}"`
              : "No documents available yet."}
          </div>
        </div>
      )}

      {/* Document grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={() => onView(doc)}
              onDownload={() => onDownload(doc)}
              onEdit={isAdmin ? () => setEditingDoc(doc) : undefined}
              onDelete={isAdmin ? () => handleDelete(doc) : undefined}
            />
          ))}
        </div>
      )}

      {/* Add document modal */}
      {showUpload && (
        <DocumentUploadModal
          onSave={fetchDocs}
          onClose={() => setShowUpload(false)}
        />
      )}

      {/* Edit document modal */}
      {editingDoc && (
        <DocumentUploadModal
          initial={{
            id: editingDoc.id,
            title: editingDoc.title,
            category: editingDoc.category,
            content: editingDoc.content,
            isPublic: editingDoc.isPublic,
            isAccessibleToResidents: editingDoc.isAccessibleToResidents,
            requiresLogin: editingDoc.requiresLogin,
            isMandatoryRecord: editingDoc.isMandatoryRecord,
            fileSize: editingDoc.fileSize ?? "",
            pages: editingDoc.pages ? String(editingDoc.pages) : "",
          }}
          onSave={fetchDocs}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </div>
  );
}
