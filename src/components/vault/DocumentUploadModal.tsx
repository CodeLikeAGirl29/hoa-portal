"use client";

import { useState } from "react";
import type { DocumentCategory, DocumentFileInfo } from "@/types";
import { CATEGORY_META } from "@/lib/redaction";
import {
  FILE_ACCEPT,
  FILE_TYPES_LABEL,
  MAX_FILE_BYTES,
  fileProblem,
  formatBytes,
} from "@/lib/files";
import {
  FormMessage,
  INPUT_CLASS,
  LABEL_CLASS,
  Modal,
} from "@/components/ui/Modal";

interface DocumentFormData {
  title: string;
  category: DocumentCategory;
  content: string;
  isPublic: boolean;
  isAccessibleToResidents: boolean;
  requiresLogin: boolean;
  isMandatoryRecord: boolean;
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
  pages: "",
};

interface DocumentUploadModalProps {
  initial?: Partial<DocumentFormData> & {
    id?: string;
    file?: DocumentFileInfo | null;
  };
  onSave: () => void;
  onClose: () => void;
}

const ACCESS_OPTIONS = [
  {
    field: "isPublic" as const,
    label: "Public",
    desc: "Anyone can open it, without signing in",
  },
  {
    field: "isAccessibleToResidents" as const,
    label: "Residents",
    desc: "Signed-in residents can open it",
  },
  {
    field: "requiresLogin" as const,
    label: "Requires sign-in",
    desc: "Hidden from the public page",
  },
  {
    field: "isMandatoryRecord" as const,
    label: "F.S. 720 required record",
    desc: "An official record under Florida Statute 720.303",
  },
];

async function errorFrom(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null);
  return data?.error ?? fallback;
}

export function DocumentUploadModal({
  initial,
  onSave,
  onClose,
}: DocumentUploadModalProps) {
  const [form, setForm] = useState<DocumentFormData>({
    ...EMPTY_FORM,
    title: initial?.title ?? EMPTY_FORM.title,
    category: initial?.category ?? EMPTY_FORM.category,
    content: initial?.content ?? EMPTY_FORM.content,
    isPublic: initial?.isPublic ?? EMPTY_FORM.isPublic,
    isAccessibleToResidents:
      initial?.isAccessibleToResidents ?? EMPTY_FORM.isAccessibleToResidents,
    requiresLogin: initial?.requiresLogin ?? EMPTY_FORM.requiresLogin,
    isMandatoryRecord:
      initial?.isMandatoryRecord ?? EMPTY_FORM.isMandatoryRecord,
    pages: initial?.pages ?? EMPTY_FORM.pages,
  });
  // The file already saved on this document (when editing)…
  const [savedFile, setSavedFile] = useState<DocumentFileInfo | null>(
    initial?.file ?? null
  );
  // …and a newly chosen one that will replace it on save.
  const [newFile, setNewFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;

  const set = <K extends keyof DocumentFormData>(
    k: K,
    v: DocumentFormData[K],
  ) => setForm((f) => ({ ...f, [k]: v }));

  function handleFileChange(file: File | null) {
    setError("");
    if (!file) {
      setNewFile(null);
      return;
    }
    const problem = fileProblem(file.name, file.size);
    if (problem) {
      setNewFile(null);
      setError(problem);
      return;
    }
    setNewFile(file);
    // Save a step: an untitled document takes the file's name.
    if (!form.title.trim()) {
      set("title", file.name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " "));
    }
  }

  async function handleRemoveSavedFile() {
    if (!initial?.id || !savedFile) return;
    if (!confirm(`Remove "${savedFile.fileName}" from this document?`)) return;
    setError("");
    setSaving(true);
    try {
      const res = await fetch(`/api/documents/${initial.id}/file`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(await errorFrom(res, "Could not remove the file."));
      setSavedFile(null);
      onSave();
    } catch (err: any) {
      setError(err.message ?? "Could not remove the file.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const hasFile = Boolean(newFile || savedFile);
    if (!hasFile && !form.content.trim()) {
      setError("Attach a file or enter the document text.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(
        isEdit ? `/api/documents/${initial!.id}` : "/api/documents",
        {
          method: isEdit ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...form,
            pages: form.pages ? parseInt(form.pages, 10) : null,
            hasFile,
          }),
        }
      );
      if (!res.ok) throw new Error(await errorFrom(res, "Could not save the document."));
      const saved = await res.json();

      if (newFile) {
        const body = new FormData();
        body.append("file", newFile);
        const upload = await fetch(`/api/documents/${saved.id}/file`, {
          method: "PUT",
          body,
        });
        if (!upload.ok) {
          const message = await errorFrom(upload, "The file could not be uploaded.");
          // Don't leave a brand-new document behind without its file.
          if (!isEdit) {
            await fetch(`/api/documents/${saved.id}`, { method: "DELETE" }).catch(
              () => {}
            );
          }
          throw new Error(message);
        }
      }

      onSave();
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Could not save the document.");
    } finally {
      setSaving(false);
    }
  }

  // Auto-set access flags based on category
  function handleCategoryChange(cat: DocumentCategory) {
    set("category", cat);
    if (cat === "legal") {
      set("isPublic", false);
      set("isAccessibleToResidents", false);
    } else if (cat === "governing" || cat === "meetings") {
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
    <Modal
      title={isEdit ? "Edit document" : "Add document"}
      description={
        isEdit
          ? "Update the details, text or attached file."
          : "Upload a file, paste the text, or both."
      }
      onClose={onClose}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="px-5 sm:px-6 py-5 space-y-5">
        {/* File */}
        <div>
          <label htmlFor="doc-file" className={LABEL_CLASS}>
            File
          </label>

          {savedFile && !newFile && (
            <div className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 mb-2">
              <div className="min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">
                  {savedFile.fileName}
                </div>
                <div className="text-xs text-gray-600">
                  {formatBytes(savedFile.size)}, currently attached
                </div>
              </div>
              <button
                type="button"
                onClick={handleRemoveSavedFile}
                disabled={saving}
                className="text-xs font-semibold text-red-700 bg-white border border-red-200 hover:bg-red-50 rounded-lg px-3 py-1.5 cursor-pointer disabled:opacity-60"
              >
                Remove file
              </button>
            </div>
          )}

          <input
            id="doc-file"
            type="file"
            accept={FILE_ACCEPT}
            onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
            className="block w-full text-sm text-gray-700 file:mr-3 file:px-4 file:py-2 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-800 hover:file:bg-blue-100 file:cursor-pointer"
          />
          <p className="text-xs text-gray-600 mt-1.5 m-0">
            {savedFile && !newFile
              ? "Choose a file to replace the current one. "
              : ""}
            {FILE_TYPES_LABEL}, up to {formatBytes(MAX_FILE_BYTES)}.
          </p>
          <p className="text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-2 m-0">
            Files are shared exactly as uploaded. Automatic redaction only
            covers the text box below, so black out anything private in the
            file itself before uploading it.
          </p>
        </div>

        {/* Title */}
        <div>
          <label htmlFor="doc-title" className={LABEL_CLASS}>
            Title
          </label>
          <input
            id="doc-title"
            required
            type="text"
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            placeholder="Community Bylaws 2025"
            className={INPUT_CLASS}
          />
        </div>

        {/* Category */}
        <fieldset className="border-0 p-0 m-0">
          <legend className={LABEL_CLASS}>Category</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {categories.map(([key, meta]) => {
              const selected = form.category === key;
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => handleCategoryChange(key)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold border-2 transition-colors cursor-pointer"
                  style={{
                    background: selected ? meta.bg : "#fff",
                    borderColor: selected ? meta.color : "#d1d5db",
                    color: selected ? meta.color : "#374151",
                  }}
                >
                  <span aria-hidden="true">{meta.icon}</span> {meta.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Content */}
        <div>
          <label htmlFor="doc-content" className={LABEL_CLASS}>
            Document text{" "}
            <span className="font-normal text-gray-600">
              (optional when a file is attached)
            </span>
          </label>
          <textarea
            id="doc-content"
            value={form.content}
            onChange={(e) => set("content", e.target.value)}
            rows={7}
            placeholder="Paste the text, or a short summary of the file."
            className={`${INPUT_CLASS} resize-y`}
          />
          <p className="text-xs text-gray-600 mt-1.5 m-0">
            Shown as the preview. Social Security numbers, dollar amounts and
            account numbers in this text are hidden from non-admins
            automatically.
          </p>
        </div>

        {/* Access settings */}
        <fieldset className="border-0 p-0 m-0">
          <legend className={LABEL_CLASS}>Who can see it</legend>
          <div className="space-y-2">
            {ACCESS_OPTIONS.map(({ field, label, desc }) => (
              <label
                key={field}
                className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <input
                  type="checkbox"
                  checked={form[field]}
                  onChange={(e) => set(field, e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded cursor-pointer"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">
                    {label}
                  </span>
                  <span className="block text-xs text-gray-600">{desc}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        {/* Pages */}
        <div className="max-w-[10rem]">
          <label htmlFor="doc-pages" className={LABEL_CLASS}>
            Pages{" "}
            <span className="font-normal text-gray-600">(optional)</span>
          </label>
          <input
            id="doc-pages"
            type="number"
            min="1"
            value={form.pages}
            onChange={(e) => set("pages", e.target.value)}
            placeholder="32"
            className={INPUT_CLASS}
          />
        </div>

        {error && <FormMessage>{error}</FormMessage>}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors cursor-pointer border-0"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 transition-colors disabled:opacity-60 cursor-pointer border-0"
          >
            {saving
              ? newFile
                ? "Uploading…"
                : "Saving…"
              : isEdit
                ? "Save changes"
                : "Add document"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
