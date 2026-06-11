"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

// ─── Types ────────────────────────────────────────────────────────────────
interface HOARecord {
  id: string;
  name: string;
  slug: string;
  accentColor: string;
  address: string | null;
  city: string | null;
  state: string;
  zip: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  active: boolean;
  createdAt: string;
  _count: { users: number; documents: number };
}

const EMPTY_FORM = {
  name: "",
  slug: "",
  accentColor: "#185FA5",
  address: "",
  city: "",
  state: "FL",
  zip: "",
  phone: "",
  email: "",
  website: "",
};

// ─── Helpers ──────────────────────────────────────────────────────────────
function toSlug(name: string) {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

function shadeColor(hex: string, pct: number) {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)),
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function Monogram({ name, color }: { name: string; color: string }) {
  const letters = name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
      style={{
        background: `linear-gradient(135deg, ${color}, ${shadeColor(color, -20)})`,
      }}
    >
      {letters}
    </div>
  );
}

// ─── HOA Form Modal ───────────────────────────────────────────────────────
function HOAFormModal({
  initial,
  onSave,
  onClose,
}: {
  initial?: Partial<HOARecord>;
  onSave: (data: typeof EMPTY_FORM) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState({ ...EMPTY_FORM, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;

  const set = (k: keyof typeof EMPTY_FORM, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form as any);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  const Field = ({
    label,
    field,
    type = "text",
    placeholder = "",
    half = false,
  }: {
    label: string;
    field: keyof typeof EMPTY_FORM;
    type?: string;
    placeholder?: string;
    half?: boolean;
  }) => (
    <div className={half ? "col-span-1" : "col-span-2"}>
      <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
        {label}
      </label>
      <input
        type={type}
        value={(form as any)[field]}
        onChange={(e) => set(field, e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
      />
    </div>
  );

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 sticky top-0 bg-white rounded-t-2xl">
          <div>
            <h2 className="text-base font-bold text-gray-900 m-0">
              {isEdit ? "Edit HOA Community" : "Add New HOA Community"}
            </h2>
            <p className="text-xs text-gray-400 m-0 mt-0.5">
              {isEdit
                ? "Update community details and branding."
                : "Create a new Florida HOA community on the portal."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
          >
            ×
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Preview */}
          <div
            className="flex items-center gap-3 p-4 rounded-xl border"
            style={{
              background: `${form.accentColor}10`,
              borderColor: `${form.accentColor}30`,
            }}
          >
            <Monogram name={form.name || "?"} color={form.accentColor} />
            <div>
              <div
                className="font-bold text-sm"
                style={{ color: shadeColor(form.accentColor, -20) }}
              >
                {form.name || "Community Name"}
              </div>
              <div className="text-xs text-gray-400">
                {form.city || "City"}, {form.state} · {form.slug || "slug"}
              </div>
            </div>
            <div
              className="ml-auto w-8 h-8 rounded-lg border-2 border-white shadow-sm"
              style={{ background: form.accentColor }}
              title="Accent color preview"
            />
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Community Name *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => {
                  set("name", e.target.value);
                  if (!isEdit) set("slug", toSlug(e.target.value));
                }}
                placeholder="Fair Oaks HOA"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Slug *{" "}
                <span className="normal-case text-gray-400 font-normal">
                  (url-friendly)
                </span>
              </label>
              <input
                required
                type="text"
                value={form.slug}
                onChange={(e) =>
                  set(
                    "slug",
                    e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""),
                  )
                }
                placeholder="pelican-bay"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-400 font-mono"
              />
            </div>

            <div className="col-span-1">
              <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">
                Accent Color
              </label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={form.accentColor}
                  onChange={(e) => set("accentColor", e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-blue-400"
                  maxLength={7}
                />
              </div>
            </div>

            <Field
              label="Street Address"
              field="address"
              placeholder="123 Main St"
            />
            <Field label="City" field="city" placeholder="Naples" half />
            <Field label="State" field="state" placeholder="FL" half />
            <Field label="ZIP" field="zip" placeholder="34108" half />
            <Field
              label="Phone"
              field="phone"
              placeholder="(239) 555-0100"
              half
            />
            <Field
              label="Email"
              field="email"
              type="email"
              placeholder="board@yourhoa.org"
            />
            <Field
              label="Website"
              field="website"
              placeholder="https://yourhoa.org"
            />
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
              {saving
                ? "Saving…"
                : isEdit
                  ? "Save Changes"
                  : "Create Community"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── HOA Card ─────────────────────────────────────────────────────────────
function HOACard({
  hoa,
  onEdit,
  onToggleActive,
}: {
  hoa: HOARecord;
  onEdit: (hoa: HOARecord) => void;
  onToggleActive: (hoa: HOARecord) => void;
}) {
  return (
    <div
      className="bg-white border rounded-xl overflow-hidden transition-shadow hover:shadow-md"
      style={{
        borderColor: hoa.active ? `${hoa.accentColor}30` : "#e5e7eb",
        opacity: hoa.active ? 1 : 0.6,
      }}
    >
      {/* Color bar */}
      <div
        className="h-1.5"
        style={{ background: hoa.active ? hoa.accentColor : "#d1d5db" }}
      />

      <div className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Monogram
            name={hoa.name}
            color={hoa.active ? hoa.accentColor : "#9ca3af"}
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-bold text-gray-900 text-sm m-0">
                {hoa.name}
              </h3>
              {!hoa.active && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 uppercase">
                  Inactive
                </span>
              )}
            </div>
            <div className="text-xs text-gray-400 font-mono mt-0.5">
              {hoa.slug}
            </div>
            {hoa.city && (
              <div className="text-xs text-gray-500 mt-1">
                📍 {hoa.city}, {hoa.state} {hoa.zip}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-gray-800">
              {hoa._count.users}
            </div>
            <div className="text-[11px] text-gray-400">Members</div>
          </div>
          <div className="bg-gray-50 rounded-lg px-3 py-2 text-center">
            <div className="text-lg font-bold text-gray-800">
              {hoa._count.documents}
            </div>
            <div className="text-[11px] text-gray-400">Documents</div>
          </div>
        </div>

        {/* Contact */}
        {(hoa.email || hoa.phone) && (
          <div className="text-xs text-gray-400 space-y-0.5 mb-4">
            {hoa.email && <div>✉️ {hoa.email}</div>}
            {hoa.phone && <div>📞 {hoa.phone}</div>}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 border-t border-gray-100 pt-4">
          <button
            onClick={() => onEdit(hoa)}
            className="flex-1 py-2 rounded-lg text-xs font-semibold text-white transition-all cursor-pointer border-0"
            style={{ background: hoa.active ? hoa.accentColor : "#9ca3af" }}
          >
            Edit
          </button>
          <button
            onClick={() => onToggleActive(hoa)}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
              hoa.active
                ? "border-red-200 text-red-600 bg-red-50 hover:bg-red-100"
                : "border-green-200 text-green-700 bg-green-50 hover:bg-green-100"
            }`}
          >
            {hoa.active ? "Deactivate" : "Reactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ManageHOAsPage() {
  const { role, isLoading: authLoading } = useAuth();
  const router = useRouter();

  const [hoas, setHoas] = useState<HOARecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<HOARecord | null>(null);

  // Redirect non-superadmins
  useEffect(() => {
    if (!authLoading && role !== "superadmin") router.replace("/");
  }, [role, authLoading, router]);

  const fetchHOAs = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/hoas");
    if (res.ok) setHoas(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHOAs();
  }, [fetchHOAs]);

  async function handleCreate(data: typeof EMPTY_FORM) {
    const res = await fetch("/api/hoas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to create community.");
    }
    await fetchHOAs();
  }

  async function handleEdit(data: typeof EMPTY_FORM) {
    if (!editing) return;
    const res = await fetch(`/api/hoas/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error ?? "Failed to update community.");
    }
    await fetchHOAs();
  }

  async function handleToggleActive(hoa: HOARecord) {
    await fetch(`/api/hoas/${hoa.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !hoa.active }),
    });
    await fetchHOAs();
  }

  const filtered = hoas.filter(
    (h) =>
      h.name.toLowerCase().includes(search.toLowerCase()) ||
      h.slug.toLowerCase().includes(search.toLowerCase()) ||
      (h.city ?? "").toLowerCase().includes(search.toLowerCase()),
  );

  const activeCount = hoas.filter((h) => h.active).length;
  const inactiveCount = hoas.filter((h) => !h.active).length;

  if (authLoading) return null;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
              🏘️ HOA Communities
            </h1>
            <p className="text-sm text-gray-400 mt-1 m-0">
              Manage all Florida HOA communities on the portal
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer border-0"
            style={{ background: "linear-gradient(135deg, #185FA5, #0C447C)" }}
          >
            + Add Community
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-6">
        {/* Stats */}
        <div className="flex gap-4 mb-6 flex-wrap">
          {[
            {
              label: "Total Communities",
              value: hoas.length,
              color: "#185FA5",
              bg: "#E6F1FB",
            },
            {
              label: "Active",
              value: activeCount,
              color: "#3B6D11",
              bg: "#EAF3DE",
            },
            {
              label: "Inactive",
              value: inactiveCount,
              color: "#854F0B",
              bg: "#FAEEDA",
            },
            {
              label: "Total Members",
              value: hoas.reduce((s, h) => s + h._count.users, 0),
              color: "#533AB7",
              bg: "#EEEDFE",
            },
            {
              label: "Total Documents",
              value: hoas.reduce((s, h) => s + h._count.documents, 0),
              color: "#712B13",
              bg: "#FAECE7",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3 flex-1 min-w-[100px]"
              style={{ background: s.bg }}
            >
              <div className="text-2xl font-bold" style={{ color: s.color }}>
                {s.value}
              </div>
              <div
                className="text-[11px] mt-0.5 opacity-80"
                style={{ color: s.color }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="flex gap-3 mb-6">
          <input
            type="text"
            placeholder="Search communities…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
          />
          <div className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm text-gray-500 flex items-center">
            {filtered.length} result{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="bg-white border border-gray-100 rounded-xl h-48 animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-300">
            <div className="text-5xl mb-4">🏘️</div>
            <div className="text-lg font-medium">
              {search
                ? "No communities match your search"
                : "No communities yet"}
            </div>
            {!search && (
              <button
                onClick={() => {
                  setEditing(null);
                  setShowModal(true);
                }}
                className="mt-4 px-5 py-2.5 rounded-xl text-sm font-bold text-white cursor-pointer border-0"
                style={{ background: "#185FA5" }}
              >
                Add your first community
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((hoa) => (
              <HOACard
                key={hoa.id}
                hoa={hoa}
                onEdit={(h) => {
                  setEditing(h);
                  setShowModal(true);
                }}
                onToggleActive={handleToggleActive}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <HOAFormModal
          initial={editing ?? undefined}
          onSave={editing ? handleEdit : handleCreate}
          onClose={() => {
            setShowModal(false);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
