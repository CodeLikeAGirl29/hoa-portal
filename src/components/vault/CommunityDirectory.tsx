"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

interface Community {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  accentColor: string;
  city: string | null;
  state: string;
  publicDocuments: number;
}

function monogram(name: string): string {
  return name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * What a signed-out visitor sees in place of the document vault: the list of
 * communities, each linking to its public records page.
 */
export function CommunityDirectory() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/public/hoas");
      const data = await res.json().catch(() => null);
      if (!res.ok) throw new Error(data?.error ?? "Could not load communities.");
      setCommunities(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message ?? "Could not load communities.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const query = search.trim().toLowerCase();
  const filtered = communities.filter(
    (c) =>
      !query ||
      c.name.toLowerCase().includes(query) ||
      (c.city ?? "").toLowerCase().includes(query)
  );

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-bold text-gray-900 m-0">
          Find your community
        </h2>
        <p className="text-sm text-gray-600 mt-1 m-0">
          Choose a community to view its public records, or sign in to see
          everything available to residents.
        </p>
      </div>

      {communities.length > 5 && (
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by community or city…"
          aria-label="Search communities"
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      )}

      {loading && (
        <div className="py-16 text-center">
          <div className="text-3xl mb-3 animate-pulse">🏘️</div>
          <div className="text-sm text-gray-600">Loading communities…</div>
        </div>
      )}

      {!loading && error && (
        <div className="py-8 text-center" role="alert">
          <div className="text-3xl mb-3">⚠️</div>
          <div className="text-sm text-red-500 mb-3">{error}</div>
          <button
            onClick={load}
            className="px-4 py-2 rounded-xl text-sm text-blue-600 border border-blue-200 hover:bg-blue-50 cursor-pointer bg-white"
          >
            Try again
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="py-16 text-center">
          <div className="text-4xl mb-3">📭</div>
          <div className="text-sm text-gray-600">
            {query
              ? `No communities matching "${search}"`
              : "No communities have been added yet."}
          </div>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filtered.map((c) => (
            <Link
              key={c.id}
              href={`/hoa/${c.slug}`}
              className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-4 no-underline hover:shadow-md transition-shadow"
            >
              {c.logoUrl ? (
                <img
                  src={c.logoUrl}
                  alt=""
                  className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
                />
              ) : (
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                  style={{ background: c.accentColor }}
                >
                  {monogram(c.name)}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 truncate">
                  {c.name}
                </div>
                <div className="text-xs text-gray-600">
                  {c.city ? `${c.city}, ${c.state} · ` : ""}
                  {c.publicDocuments} public document
                  {c.publicDocuments !== 1 ? "s" : ""}
                </div>
              </div>
              <span
                className="text-xs font-semibold flex-shrink-0"
                style={{ color: c.accentColor }}
              >
                View →
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
