"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { DocumentCard } from "./DocumentCard";
import { DocumentUploadModal } from "./DocumentUploadModal";
import { CommunityDirectory } from "./CommunityDirectory";
import { CATEGORY_META } from "@/lib/redaction";
import type { RedactedDocument } from "@/types";

interface DocumentVaultProps {
  onView: (doc: RedactedDocument) => void;
  /** Called with the full list whenever documents are (re)loaded. */
  onLoaded?: (docs: RedactedDocument[]) => void;
}

// Filter pills come from the real category list, so every category a
// document can be filed under has a pill (and none exist that match nothing).
const CATEGORIES = ["All", ...Object.values(CATEGORY_META).map((m) => m.label)];

export function DocumentVault({ onView, onLoaded }: DocumentVaultProps) {
  const { role, user } = useAuth();
  const isAdmin = role === "admin" || role === "superadmin";
  // A visitor isn't tied to a community, so there is no vault to load —
  // they pick a community from the directory instead.
  const isVisitor = role === "public";
  // Superadmins see every community; without one of their own they can't add.
  const canAdd = isAdmin && Boolean(user.hoaId);

  const [docs, setDocs] = useState<RedactedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCategory, setCategory] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [editingDoc, setEditingDoc] = useState<RedactedDocument | null>(null);

  const fetchDocs = useCallback(async () => {
    if (isVisitor) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/documents");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Failed to load documents");
      const list: RedactedDocument[] = Array.isArray(data) ? data : [];
      setDocs(list);
      onLoaded?.(list);
    } catch (err: any) {
      setError(err.message ?? "Failed to load documents");
    } finally {
      setLoading(false);
    }
    // onLoaded is left out on purpose: a parent passing an inline function
    // would otherwise reload the vault on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisitor]);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleDelete(doc: RedactedDocument) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/documents/${doc.id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Failed to delete");
      }
      fetchDocs();
    } catch (err: any) {
      alert(err.message ?? "Delete failed");
    }
  }

  if (isVisitor) return <CommunityDirectory />;

  const query = search.trim().toLowerCase();
  const filtered = docs.filter((d) => {
    const matchesSearch =
      !query ||
      d.title.toLowerCase().includes(query) ||
      d.content.toLowerCase().includes(query);
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
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents…"
          aria-label="Search documents"
          className="flex-1 min-w-[12rem] px-4 py-2.5 border border-gray-300 rounded-lg text-sm placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
        />
        {canAdd && (
          <button
            onClick={() => setShowUpload(true)}
            className="px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 cursor-pointer border-0 transition-colors"
          >
            Add document
          </button>
        )}
      </div>

      {/* Category pills — scroll sideways on a phone instead of stacking */}
      <div
        className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1"
        role="group"
        aria-label="Filter by category"
      >
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            aria-pressed={activeCategory === cat}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors whitespace-nowrap flex-shrink-0 ${
              activeCategory === cat
                ? "bg-blue-700 text-white border-blue-700"
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-100"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center text-sm text-gray-600" role="status">
          Loading documents…
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <div className="py-8 text-center" role="alert">
          <div className="text-sm text-red-700 mb-3">{error}</div>
          <button
            onClick={fetchDocs}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-blue-800 border border-blue-200 hover:bg-blue-50 cursor-pointer bg-white"
          >
            Try again
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && filtered.length === 0 && (
        <div className="py-16 text-center text-sm text-gray-600">
          {query
            ? `No documents match "${search}".`
            : activeCategory !== "All"
              ? `No ${activeCategory.toLowerCase()} documents yet.`
              : canAdd
                ? "No documents yet. Add the first one to get started."
                : "No documents available yet."}
        </div>
      )}

      {/* Document grid */}
      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={onView}
              onEdit={isAdmin ? setEditingDoc : undefined}
              onDelete={isAdmin ? handleDelete : undefined}
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
            pages: editingDoc.pages ? String(editingDoc.pages) : "",
            file: editingDoc.file ?? null,
          }}
          onSave={fetchDocs}
          onClose={() => setEditingDoc(null)}
        />
      )}
    </div>
  );
}
