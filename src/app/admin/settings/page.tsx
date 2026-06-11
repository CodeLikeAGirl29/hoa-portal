"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useAuth } from "@/hooks/useAuth";

// ─── Helpers ──────────────────────────────────────────────────────────────
function shadeColor(hex: string, pct: number): string {
  const n = parseInt(hex.replace("#", ""), 16);
  const r = Math.min(255, Math.max(0, (n >> 16) + Math.round(2.55 * pct)));
  const g = Math.min(
    255,
    Math.max(0, ((n >> 8) & 0xff) + Math.round(2.55 * pct)),
  );
  const b = Math.min(255, Math.max(0, (n & 0xff) + Math.round(2.55 * pct)));
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function getMonogram(name: string): string {
  return name
    .replace(/\bHOA\b/gi, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

// ─── Live Header Preview ───────────────────────────────────────────────────
function HeaderPreview({
  name,
  logoUrl,
  accentColor,
  city,
  state,
}: {
  name: string;
  logoUrl: string;
  accentColor: string;
  city: string;
  state: string;
}) {
  const accent = accentColor || "#185FA5";
  const accentDark = shadeColor(accent, -20);
  const location = city ? `${city}, ${state || "FL"}` : "Florida";

  return (
    <div className="rounded-xl overflow-hidden border border-gray-200 shadow-sm">
      <div className="bg-white px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt="Logo preview"
              className="w-9 h-9 rounded-lg object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          ) : (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{
                background: `linear-gradient(135deg, ${accent}, ${accentDark})`,
              }}
            >
              {getMonogram(name || "HOA")}
            </div>
          )}
          <div>
            <div className="text-sm font-bold" style={{ color: accentDark }}>
              {name || "Your HOA Name"}
            </div>
            <div className="text-[10px] text-gray-400 uppercase tracking-widest">
              {location} · F.S. 720.303
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{ background: `${accent}18`, color: accent }}
          >
            Resident
          </div>
          <div className="w-16 h-6 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
      {/* Accent bar */}
      <div
        className="h-1"
        style={{
          background: `linear-gradient(to right, ${accent}, ${accentDark}, ${accent})`,
        }}
      />
    </div>
  );
}

// ─── Color Swatch Picker ───────────────────────────────────────────────────
const PRESET_COLORS = [
  "#185FA5",
  "#0C447C",
  "#2D7A4F",
  "#3B6D11",
  "#C45C1A",
  "#854F0B",
  "#712B13",
  "#993C1D",
  "#533AB7",
  "#2D1F7A",
  "#0F6E56",
  "#1A5C68",
  "#1a1a1a",
  "#4A4A4A",
  "#8B5CF6",
  "#DB2777",
];

function ColorPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (c: string) => void;
}) {
  return (
    <div className="space-y-3">
      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            className="w-7 h-7 rounded-lg border-2 transition-all cursor-pointer"
            style={{
              background: c,
              borderColor: value === c ? "#fff" : "transparent",
              outline: value === c ? `2px solid ${c}` : "none",
              outlineOffset: 2,
            }}
            title={c}
          />
        ))}
      </div>
      {/* Custom */}
      <div className="flex gap-2 items-center">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => {
            if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value))
              onChange(e.target.value);
          }}
          maxLength={7}
          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm font-mono outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          placeholder="#185FA5"
        />
        <div
          className="w-9 h-9 rounded-lg border border-gray-200 flex-shrink-0"
          style={{ background: value }}
        />
      </div>
    </div>
  );
}

// ─── Section Card ──────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-50">
        <h2 className="text-sm font-bold text-gray-900 m-0">{title}</h2>
        {description && (
          <p className="text-xs text-gray-400 mt-0.5 m-0">{description}</p>
        )}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function HOASettingsPage() {
  const { hoa, role } = useAuth();
  const { update: updateSession } = useSession();

  const [form, setForm] = useState({
    name: "",
    logoUrl: "",
    accentColor: "#185FA5",
    address: "",
    city: "",
    state: "FL",
    zip: "",
    phone: "",
    email: "",
    website: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load current HOA settings
  useEffect(() => {
    fetch("/api/hoa/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          setForm({
            name: data.name ?? "",
            logoUrl: data.logoUrl ?? "",
            accentColor: data.accentColor ?? "#185FA5",
            address: data.address ?? "",
            city: data.city ?? "",
            state: data.state ?? "FL",
            zip: data.zip ?? "",
            phone: data.phone ?? "",
            email: data.email ?? "",
            website: data.website ?? "",
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetch("/api/hoa/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save settings.");
      }

      const updated = await res.json();

      // Refresh the NextAuth session so the header updates immediately
      await updateSession({
        hoa: {
          id: updated.id,
          name: updated.name,
          slug: updated.slug,
          logoUrl: updated.logoUrl,
          accentColor: updated.accentColor,
          address: updated.address,
          city: updated.city,
          state: updated.state,
          zip: updated.zip,
          phone: updated.phone,
          email: updated.email,
        },
      });

      setSaved(true);
      if (savedTimer.current) clearTimeout(savedTimer.current);
      savedTimer.current = setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-gray-300 text-center">
          <div className="text-3xl mb-2 animate-pulse">⚙️</div>
          <div className="text-sm">Loading settings…</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-8 py-6">
        <div className="max-w-3xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
              ⚙️ HOA Settings
            </h1>
            <p className="text-sm text-gray-400 mt-1 m-0">
              Update your community's branding, contact information, and header
              appearance.
            </p>
          </div>
        </div>
      </div>

      <form
        onSubmit={handleSave}
        className="max-w-3xl mx-auto px-8 py-6 space-y-6"
      >
        {/* Live preview */}
        <Section
          title="Header Preview"
          description="This is how your community will appear to all members."
        >
          <HeaderPreview
            name={form.name}
            logoUrl={form.logoUrl}
            accentColor={form.accentColor}
            city={form.city}
            state={form.state}
          />
        </Section>

        {/* Identity */}
        <Section
          title="Community Identity"
          description="The name and logo shown in the header."
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Community Name *
              </label>
              <input
                required
                type="text"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="Fair Oaks HOA"
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                Logo URL
                <span className="normal-case font-normal text-gray-400 ml-1">
                  (paste a direct image link, or leave blank for auto-monogram)
                </span>
              </label>
              <div className="flex gap-3 items-center">
                <input
                  type="url"
                  value={form.logoUrl}
                  onChange={(e) => set("logoUrl", e.target.value)}
                  placeholder="https://your-cdn.com/logo.png"
                  className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
                {form.logoUrl && (
                  <img
                    src={form.logoUrl}
                    alt="Logo"
                    className="w-10 h-10 rounded-lg object-cover border border-gray-200 flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1.5">
                💡 Use a square image (at least 88×88px) for best results.
                Supports JPG, PNG, WebP, SVG.
              </p>
            </div>
          </div>
        </Section>

        {/* Accent color */}
        <Section
          title="Brand Color"
          description="Sets the header gradient, role badge tint, and accent bar color."
        >
          <ColorPicker
            value={form.accentColor}
            onChange={(c) => set("accentColor", c)}
          />
        </Section>

        {/* Contact info */}
        <Section
          title="Contact Information"
          description="Displayed in the header subtitle and compliance footer."
        >
          <div className="grid grid-cols-2 gap-4">
            {[
              {
                label: "Street Address",
                field: "address" as const,
                span: 2,
                placeholder: "123 Community Dr",
              },
              {
                label: "City",
                field: "city" as const,
                span: 1,
                placeholder: "Naples",
              },
              {
                label: "State",
                field: "state" as const,
                span: 1,
                placeholder: "FL",
              },
              {
                label: "ZIP Code",
                field: "zip" as const,
                span: 1,
                placeholder: "34108",
              },
              {
                label: "Phone",
                field: "phone" as const,
                span: 1,
                placeholder: "(239) 555-0100",
              },
              {
                label: "Email",
                field: "email" as const,
                span: 2,
                placeholder: "board@yourhoa.org",
              },
              {
                label: "Website",
                field: "website" as const,
                span: 2,
                placeholder: "https://yourhoa.org",
              },
            ].map(({ label, field, span, placeholder }) => (
              <div key={field} className={`col-span-${span}`}>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                  {label}
                </label>
                <input
                  type={
                    field === "email"
                      ? "email"
                      : field === "website"
                        ? "url"
                        : "text"
                  }
                  value={(form as any)[field]}
                  onChange={(e) => set(field, e.target.value)}
                  placeholder={placeholder}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
                />
              </div>
            ))}
          </div>
        </Section>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <span>⚠️</span> {error}
          </div>
        )}

        {/* Save bar */}
        <div className="sticky bottom-4 bg-white border border-gray-200 rounded-xl px-5 py-4 shadow-lg flex items-center justify-between gap-4">
          <p className="text-xs text-gray-400 m-0">
            {saved
              ? "✅ Settings saved — header will update on next login or page refresh."
              : "Changes are applied immediately after saving."}
          </p>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 cursor-pointer border-0 flex-shrink-0"
            style={{
              background: `linear-gradient(135deg, ${form.accentColor}, ${shadeColor(form.accentColor, -20)})`,
            }}
          >
            {saving ? "Saving…" : saved ? "✓ Saved" : "Save Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
