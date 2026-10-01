// src/lib/files.ts
// Rules for files attached to documents. No server-only imports, so the
// upload form can use the same limits the API enforces.

/**
 * Largest upload accepted. Vercel rejects request bodies over 4.5 MB before
 * they reach the app, so the limit sits just under that.
 */
export const MAX_FILE_BYTES = 4 * 1024 * 1024;

interface FileType {
  mime: string;
  label: string;
  /** Safe to open in a browser tab; everything else is download-only. */
  inline: boolean;
  /** Leading bytes every real file of this type starts with. */
  signature: number[];
}

export const FILE_TYPES: Record<string, FileType> = {
  pdf: {
    mime: "application/pdf",
    label: "PDF",
    inline: true,
    signature: [0x25, 0x50, 0x44, 0x46], // %PDF
  },
  png: {
    mime: "image/png",
    label: "PNG image",
    inline: true,
    signature: [0x89, 0x50, 0x4e, 0x47],
  },
  jpg: {
    mime: "image/jpeg",
    label: "JPEG image",
    inline: true,
    signature: [0xff, 0xd8, 0xff],
  },
  jpeg: {
    mime: "image/jpeg",
    label: "JPEG image",
    inline: true,
    signature: [0xff, 0xd8, 0xff],
  },
  docx: {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    label: "Word document",
    inline: false,
    signature: [0x50, 0x4b, 0x03, 0x04], // zip container
  },
  xlsx: {
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    label: "Excel spreadsheet",
    inline: false,
    signature: [0x50, 0x4b, 0x03, 0x04],
  },
};

/** Value for a file input's `accept` attribute. */
export const FILE_ACCEPT = Object.keys(FILE_TYPES)
  .map((ext) => `.${ext}`)
  .join(",");

export const FILE_TYPES_LABEL = "PDF, Word, Excel, PNG or JPEG";

export function fileExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot === -1 ? "" : fileName.slice(dot + 1).toLowerCase();
}

export function fileTypeFor(fileName: string): FileType | null {
  return FILE_TYPES[fileExtension(fileName)] ?? null;
}

export function isInlineMime(mime: string): boolean {
  return Object.values(FILE_TYPES).some((t) => t.mime === mime && t.inline);
}

/** "248 KB", "1.2 MB" */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Why a file can't be accepted, or null if it can. `head` is the first few
 * bytes of the file; when given, the contents must match the extension.
 */
export function fileProblem(
  fileName: string,
  size: number,
  head?: Uint8Array
): string | null {
  const type = fileTypeFor(fileName);
  if (!type) return `Only ${FILE_TYPES_LABEL} files can be uploaded.`;
  if (size === 0) return "That file is empty.";
  if (size > MAX_FILE_BYTES) {
    return `That file is too large. The limit is ${formatBytes(MAX_FILE_BYTES)}.`;
  }
  if (head && !type.signature.every((byte, i) => head[i] === byte)) {
    return `That file doesn't look like a real ${type.label}.`;
  }
  return null;
}

/** Strips path parts and characters that are unsafe in a download header. */
export function safeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? "file";
  const cleaned = base.replace(/[^\w.\- ()]/g, "_").trim();
  return cleaned.slice(0, 120) || "file";
}

/** Content-Disposition header value for a download or an in-tab view. */
export function contentDisposition(fileName: string, inline: boolean): string {
  const safe = safeFileName(fileName);
  return `${inline ? "inline" : "attachment"}; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
}
