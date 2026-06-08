"use client";

import { useState, useMemo, useEffect } from "react";
import type { RedactedDocument, DocumentCategory, HOADocument } from "@/types";
import { CATEGORY_META } from "@/lib/redaction";
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

  // State for server-managed payloads
  const [documents, setDocuments] = useState<RedactedDocument[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Sync state parameters to your secure server route
  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Build the query string dynamically for server-side evaluation
    const params = new URLSearchParams();
    if (search) params.append("search", search);
    if (filterCat !== "all") params.append("category", filterCat);

    // Fetch authorized records from the secure Next.js API layer
    fetch(`/api/documents?${params.toString()}`, {
      method: "GET",
      headers: {
        // Tunneling client demo state context to server headers
        "x-demo-role": role,
      },
    })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 403)
            throw new Error("Access Denied. Insufficient credentials.");
          throw new Error("Failed to load official archive records.");
        }
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setDocuments(data);
          setIsLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message);
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [role, search, filterCat]);

  return (
    <div>
      {/* Search + Filter UI Controls */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <input
          type="text"
          placeholder="Search authorized documents…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[180px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-colors bg-white"
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
            ? "..."
            : `${documents.length} record${documents.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Main Content Workspace Canvas */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">
          <div className="animate-spin text-2xl mb-3 inline-block">🔄</div>
          <div className="text-sm">Querying secure records vault…</div>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-600 bg-red-50/50 border border-red-100 rounded-xl">
          <div className="text-3xl mb-2">🛡️</div>
          <div className="text-sm font-semibold">{error}</div>
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-16 text-gray-300">
          <div className="text-4xl mb-3">🔍</div>
          <div className="text-base">No authorized documents found</div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <DocumentCard
              key={doc.id}
              document={doc}
              onView={() => onView(doc)}
              onDownload={() => onDownload(doc)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
