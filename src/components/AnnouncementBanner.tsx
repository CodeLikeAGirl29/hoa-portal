"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

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
      if (!res.ok) throw new Error((await res.json()).error);
      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <h2 className="text-base font-bold text-gray-900 m-0">
            {initial ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
          >
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
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
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
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
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
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
    </div>
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

  const fetchAnnouncements = async () => {
    const res = await fetch("/api/announcements");
    if (res.ok) setAnnouncements(await res.json());
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this announcement?")) return;
    await fetch(`/api/announcements/${id}`, { method: "DELETE" });
    fetchAnnouncements();
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
            📢 Post Announcement
          </button>
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
                <div className="text-xs text-gray-400 mt-2">
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
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-sm"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(ann.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 cursor-pointer border-0 bg-transparent text-sm"
                  >
                    🗑
                  </button>
                </>
              )}
              {!ann.pinned && (
                <button
                  onClick={() => setDismissed((d) => new Set([...d, ann.id]))}
                  className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-300 hover:bg-gray-100 cursor-pointer border-0 bg-transparent text-lg leading-none"
                >
                  ×
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
