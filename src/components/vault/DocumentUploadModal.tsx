"use client";

import { useState } from "react";
import type { DocumentCategory } from "@/types";
import { CATEGORY_META } from "@/lib/redaction";

interface DocumentFormData {
  title: string;
  category: DocumentCategory;
  content: string;
  isPublic: boolean;
  isAccessibleToResidents: boolean;
  requiresLogin: boolean;
  isMandatoryRecord: boolean;
  fileSize: string;
  pages: string;
}

const EMPTY_FORM: DocumentFormData = {
  title: "",
  category: "governing",
  content: "",
  isPublic: false,
  isAccessibleToResidents: true,
  requiresLogin: true,
  isMandatoryRecord: false,
  fileSize: "",
  pages: "",
};

interface DocumentUploadModalProps {
  initial?: Partial<DocumentFormData> & { id?: string };
  onSave: () => void;
  onClose: () => void;
}

export function DocumentUploadModal({
  initial,
  onSave,
  onClose,
}: DocumentUploadModalProps) {
  const [form, setForm] = useState<DocumentFormData>({
    ...EMPTY_FORM,
    ...initial,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;

  const set = <K extends keyof DocumentFormData>(
    k: K,
    v: DocumentFormData[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const url = isEdit ? `/api/documents/${initial!.id}` : "/api/documents";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          pages: form.pages ? parseInt(form.pages) : null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save document.");
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-set access flags based on category
  function handleCategoryChange(cat: DocumentCategory) {
    const isLegal = cat === "legal";
    set("category", cat);
    if (isLegal) {
      set("isPublic", false);
      set("isAccessibleToResidents", false);
    } else if (["governing", "meetings"].includes(cat)) {
      set("isPublic", true);
      set("isAccessibleToResidents", true);
    } else {
      set("isPublic", false);
      set("isAccessibleToResidents", true);
    }
  }

  const categories = Object.entries(CATEGORY_META) as [
    DocumentCategory,
    (typeof CATEGORY_META)[DocumentCategory],
  ][];

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <div>
            <h2 className="text-base font-bold text-gray-900 m-0">
              {isEdit ? "Edit Document" : "Add Document"}
            </h2>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              {isEdit
                ? "Update document details and content."
                : "Add a new document to the vault."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Document Title *
            </label>
            <input
              required
              type="text"
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              placeholder="Community Bylaws 2025"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map(([key, meta]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategoryChange(key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border-2 transition-all cursor-pointer"
                  style={{
                    background: form.category === key ? meta.bg : "#fff",
                    borderColor: form.category === key ? meta.color : "#e5e7eb",
                    color: form.category === key ? meta.color : "#6b7280",
                  }}
                >
                  <span>{meta.icon}</span> {meta.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
              Document Content *
              <span className="normal-case font-normal text-gray-400 ml-1">
                (paste full text — redaction applies automatically for non-admin
                viewers)
              </span>
            </label>
            <textarea
              required
              value={form.content}
              onChange={(e) => set("content", e.target.value)}
              rows={8}
              placeholder="Paste the full document text here…"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all resize-y font-mono"
            />
          </div>

          {/* Access settings */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">
              Access Level
            </label>
            <div className="space-y-2">
              {[
                {
                  field: "isPublic" as const,
                  label: "🔓 Public",
                  desc: "Visible to anyone without login",
                },
                {
                  field: "isAccessibleToResidents" as const,
                  label: "🔐 Residents",
                  desc: "Visible to logged-in residents and admins",
                },
                {
                  field: "requiresLogin" as const,
                  label: "🔒 Requires Login",
                  desc: "Hidden from public, requires authentication",
                },
                {
                  field: "isMandatoryRecord" as const,
                  label: "⚖️ F.S. 720 Required",
                  desc: "Mandatory record under Florida Statute 720.303",
                },
              ].map(({ field, label, desc }) => (
                <label
                  key={field}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={form[field] as boolean}
                    onChange={(e) => set(field, e.target.checked)}
                    className="w-4 h-4 rounded cursor-pointer"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">
                      {label}
                    </div>
                    <div className="text-xs text-gray-400">{desc}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                File Size
              </label>
              <input
                type="text"
                value={form.fileSize}
                onChange={(e) => set("fileSize", e.target.value)}
                placeholder="248 KB"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Pages
              </label>
              <input
                type="number"
                min="1"
                value={form.pages}
                onChange={(e) => set("pages", e.target.value)}
                placeholder="32"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 transition-all"
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-0"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 cursor-pointer border-0"
              style={{
                background: "linear-gradient(135deg, #185FA5, #0C447C)",
              }}
            >
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Document"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
