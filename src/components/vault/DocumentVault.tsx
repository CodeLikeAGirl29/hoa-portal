"use client";

import { useState, useMemo } from "react";
import type { HOADocument, DocumentCategory } from "@/types";
import { MOCK_DOCUMENTS } from "@/lib/data";
import { canAccess, redactDocument, CATEGORY_META } from "@/lib/redaction";
import { useAuth } from "@/hooks/useAuth";
import { DocumentCard } from "./DocumentCard";

interface DocumentVaultProps {
  onView: (doc: HOADocument) => void;
  onDownload: (doc: HOADocument) => void;
}

export function DocumentVault({ onView, onDownload }: DocumentVaultProps) {
  const { role } = useAuth();
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState<DocumentCategory | "all">("all");

  const visible = useMemo(() => {
    return MOCK_DOCUMENTS.filter((doc) => {
      if (!canAccess(doc, role)) return false;
      const matchSearch =
        search === "" ||
        doc.title.toLowerCase().includes(search.toLowerCase()) ||
        doc.category.toLowerCase().includes(search.toLowerCase());
      const matchCat = filterCat === "all" || doc.category === filterCat;
      return matchSearch && matchCat;
    });
  }, [role, search, filterCat]);

  const redacted = useMemo(
    () => visible.map((doc) => redactDocument(doc, role)),
    [visible, role]
  );

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors bg-white"
        />
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value as DocumentCategory | "all")}
          className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer outline-none focus:border-blue-400"
        >
          <option value="all">All Categories</option>
          {(Object.entries(CATEGORY_META) as [DocumentCategory, typeof CATEGORY_META[DocumentCategory]][]).map(
            ([k, v]) => (
              <option key={k} value={k}>
                {v.icon} {v.label}
              </option>
            )
          )}
        </select>
        <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 flex items-center">
          {visible.length} document{visible.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Grid */}
      {redacted.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-base">No documents found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {redacted.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={onView}
              onDownload={onDownload}
            />
          ))}
        </div>
      )}
    </div>
  );
}
