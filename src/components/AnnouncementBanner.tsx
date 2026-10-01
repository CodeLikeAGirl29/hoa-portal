"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Overlay } from "@/components/ui/Modal";

interface Announcement {
  id: string;
  title: string;
  body: string;
  pinned: boolean;
  expiresAt: string | null;
  createdAt: string;
  author: { name: string | null; email: string };
}

interface AnnouncementFormProps {
  initial?: Announcement;
  onSave: () => void;
  onClose: () => void;
}

function AnnouncementForm({ initial, onSave, onClose }: AnnouncementFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [expiresAt, setExpiresAt] = useState(
    initial?.expiresAt
      ? new Date(initial.expiresAt).toISOString().slice(0, 10)
      : "",
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = initial
        ? `/api/announcements/${initial.id}`
        : "/api/announcements";
      const method = initial ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          body,
          pinned,
          expiresAt: expiresAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not save the announcement.");
      }
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Could not save the announcement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose} label={initial ? "Edit announcement" : "New announcement"}>
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 m-0">
            {initial ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Title *
            </label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Pool Closure Notice"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Message *
            </label>
            <textarea
              required
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="The pool will be closed for maintenance from June 10–12."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Expires On (optional)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400"
              />
            </div>
            <div className="flex items-end pb-2.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pinned}
                  onChange={(e) => setPinned(e.target.checked)}
                  className="w-4 h-4 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-700">
                  📌 Pin to top
                </span>
              </label>
            </div>
          </div>
          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span>⚠️</span> {error}
            </div>
          )}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer border-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60 cursor-pointer border-0"
              style={{
                background: "linear-gradient(135deg, #185FA5, #0C447C)",
              }}
            >
              {saving
                ? "Saving…"
                : initial
                  ? "Save Changes"
                  : "Post Announcement"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

export function AnnouncementBanner() {
  const { role, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";
  const isAdmin = role === "admin" || role === "superadmin";

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);

  const [loadError, setLoadError] = useState("");

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        throw new Error(data?.error ?? "Could not load announcements.");
      }
      setAnnouncements(Array.isArray(data) ? data : []);
      setLoadError("");
    } catch (err: any) {
      setLoadError(err.message ?? "Could not load announcements.");
    }
  };

  useEffect(() => {
    // Visitors have no community, so there is nothing to ask for.
    if (role === "public") return;
    fetchAnnouncements();
  }, [role]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Could not delete the announcement.");
      }
      fetchAnnouncements();
    } catch (err: any) {
      alert(err.message ?? "Could not delete the announcement.");
    }
  }

  const visible = announcements.filter((a) => !dismissed.has(a.id));

  if (visible.length === 0 && !isAdmin) return null;

  return (
    <div className="space-y-3 mb-6">
      {/* Admin post button */}
      {isAdmin && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setEditing(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white cursor-pointer border-0 transition-all"
            style={{ background: accent }}
          >
            Post announcement
          </button>
        </div>
      )}

      {/* Only admins can act on a load failure, so only they see it. */}
      {isAdmin && loadError && (
        <div
          role="alert"
          className="flex items-start gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
        >
          <span>⚠️</span> <span>{loadError}</span>
        </div>
      )}

      {/* Announcement cards */}
      {visible.map((ann) => (
        <div
          key={ann.id}
          className="rounded-xl border px-5 py-4 relative"
          style={{
            background: ann.pinned ? `${accent}08` : "#fff",
            borderColor: ann.pinned ? `${accent}30` : "#e5e7eb",
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <span className="text-xl flex-shrink-0 mt-0.5">
                {ann.pinned ? "📌" : "📢"}
              </span>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-gray-900 text-sm">
                  {ann.title}
                </div>
                <p className="text-sm text-gray-600 mt-1 m-0 leading-relaxed">
                  {ann.body}
                </p>
                <div className="text-xs text-gray-600 mt-2">
                  {ann.author.name ?? ann.author.email} ·{" "}
                  {new Date(ann.createdAt).toLocaleDateString()}
                  {ann.expiresAt && (
                    <span className="ml-2">
                      · Expires {new Date(ann.expiresAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setEditing(ann);
                      setShowForm(true);
                    }}
                    aria-label={`Edit announcement: ${ann.title}`}
                    className="px-2 h-8 flex items-center justify-center rounded-lg text-gray-700 hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-xs font-semibold"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    aria-label={`Delete announcement: ${ann.title}`}
                    className="px-2 h-8 flex items-center justify-center rounded-lg text-red-700 hover:bg-red-50 cursor-pointer border-0 bg-transparent text-xs font-semibold"
                  >
                    Delete
                  </button>
                </>
              )}
              {!ann.pinned && (
                <button
                  onClick={() => setDismissed((d) => new Set([...d, ann.id]))}
                  aria-label={`Dismiss announcement: ${ann.title}`}
                  className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-600 hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-lg leading-none"
                >
                  <span aria-hidden="true">×</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ))}

      {showForm && (
        <AnnouncementForm
          initial={editing ?? undefined}
          onSave={fetchAnnouncements}
          onClose={() => {
            setShowForm(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
