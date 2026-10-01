"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Overlay } from "@/components/ui/Modal";
import { Header } from "@/components/layout/Header";

// ─── Types ────────────────────────────────────────────────────────────────
interface UserRecord {
  id: string;
  email: string;
  name: string | null;
  role: string;
  hoaId: string | null;
  active: boolean;
  createdAt: string;
  hoa: { id: string; name: string; accentColor: string } | null;
}

const EMPTY_FORM = {
  email: "",
  name: "",
  password: "",
  role: "resident",
  hoaId: "",
};

const ROLE_OPTIONS = [
  { value: "resident", label: "Resident" },
  { value: "admin", label: "HOA Admin" },
];

const ROLE_STYLES: Record<string, { bg: string; color: string }> = {
  resident: { bg: "#E6F1FB", color: "#185FA5" },
  admin: { bg: "#EAF3DE", color: "#3B6D11" },
  superadmin: { bg: "#EEEDFE", color: "#533AB7" },
};

// ─── Invite / Edit Modal ──────────────────────────────────────────────────
function UserFormModal({
  initial,
  hoas,
  currentUserRole,
  onSave,
  onClose,
}: {
  initial?: UserRecord;
  hoas: { id: string; name: string }[];
  currentUserRole: string;
  onSave: (data: typeof EMPTY_FORM, sendInvite: boolean) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_FORM>({
    ...EMPTY_FORM,
    ...(initial
      ? { ...initial, name: initial.name ?? "", hoaId: initial.hoaId ?? "" }
      : {}),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!initial?.id;
  // New members are emailed a link to choose their own password unless the
  // admin opts to type one for them.
  const [sendInvite, setSendInvite] = useState(true);
  const inviting = !isEdit && sendInvite;

  const set = (k: keyof typeof EMPTY_FORM, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await onSave(form, inviting);
      onClose();
    } catch (err: any) {
      setError(err.message ?? "Something went wrong.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Overlay onClose={onClose} label={isEdit ? "Edit member" : "Invite member"}>
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100">
          <div>
            <h2 className="text-base font-bold text-gray-900 m-0">
              {isEdit ? "Edit Member" : "Invite New Member"}
            </h2>
            <p className="text-xs text-gray-600 m-0 mt-0.5">
              {isEdit
                ? "Update member details or role."
                : "They'll get an email with a link to set their password."}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-600 text-2xl w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Full Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Jane Smith"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Email Address *
            </label>
            <input
              required
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="jane@example.com"
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
            />
          </div>

          {!isEdit && (
            <label className="flex items-start gap-3 px-4 py-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
              <input
                type="checkbox"
                checked={sendInvite}
                onChange={(e) => setSendInvite(e.target.checked)}
                className="w-4 h-4 mt-0.5 rounded cursor-pointer"
              />
              <span>
                <span className="block text-sm font-medium text-gray-900">
                  Email an invitation
                </span>
                <span className="block text-xs text-gray-600">
                  They choose their own password. Untick to set one yourself.
                </span>
              </span>
            </label>
          )}

          {!inviting && (
            <div>
              <label
                htmlFor="member-password"
                className="block text-sm font-medium text-gray-800 mb-1.5"
              >
                {isEdit ? "New password (leave blank to keep current)" : "Password"}
              </label>
              <input
                id="member-password"
                required={!isEdit}
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder={
                  isEdit ? "Leave blank to keep current" : "At least 8 characters"
                }
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-800 mb-1.5">
              Role *
            </label>
            <select
              value={form.role}
              onChange={(e) => set("role", e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white cursor-pointer"
            >
              {ROLE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {currentUserRole === "superadmin" && (
            <div>
              <label className="block text-sm font-medium text-gray-800 mb-1.5">
                Assign to Community
              </label>
              <select
                value={form.hoaId}
                onChange={(e) => set("hoaId", e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white cursor-pointer"
              >
                <option value="">Global / No Community</option>
                {hoas.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <span>⚠️</span> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
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
                  ? "Save changes"
                  : inviting
                    ? "Send invitation"
                    : "Add member"}
            </button>
          </div>
        </form>
      </div>
    </Overlay>
  );
}

// ─── User Row ─────────────────────────────────────────────────────────────
function UserRow({
  user,
  currentUserId,
  currentUserRole,
  onEdit,
  onToggleActive,
  onSendLink,
}: {
  user: UserRecord;
  currentUserId: string;
  currentUserRole: string;
  onEdit: (u: UserRecord) => void;
  onToggleActive: (u: UserRecord) => void;
  onSendLink: (u: UserRecord) => void;
}) {
  const rs = ROLE_STYLES[user.role] ?? ROLE_STYLES.resident;
  const isSelf = user.id === currentUserId;

  return (
    <div
      className="flex items-center gap-4 px-5 py-4 border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
      style={{ opacity: user.active ? 1 : 0.5 }}
    >
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
        style={{ background: user.active ? rs.color : "#9ca3af" }}
      >
        {(user.name ?? user.email)[0].toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm text-gray-900">
            {user.name ?? "—"}
          </span>
          {isSelf && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
              You
            </span>
          )}
          {!user.active && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 uppercase">
              Inactive
            </span>
          )}
        </div>
        <div className="text-xs text-gray-600 truncate">{user.email}</div>
      </div>

      {/* Role badge */}
      <span
        className="text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide hidden sm:inline"
        style={{ background: rs.bg, color: rs.color }}
      >
        {user.role}
      </span>

      {currentUserRole === "superadmin" && (
        <span className="text-xs text-gray-500 hidden lg:inline w-32 truncate font-medium">
          {user.hoa?.name ?? "Global System"}
        </span>
      )}

      {/* Joined */}
      <span className="text-xs text-gray-500 hidden md:inline w-24 text-right flex-shrink-0">
        {new Date(user.createdAt).toLocaleDateString()}
      </span>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
        {!isSelf && user.active && (
          <button
            onClick={() => onSendLink(user)}
            title="Email this member a link to set a new password"
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all cursor-pointer border-0"
          >
            Send link
          </button>
        )}
        <button
          onClick={() => onEdit(user)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 transition-all cursor-pointer border-0"
        >
          Edit
        </button>
        {!isSelf && (
          <button
            onClick={() => onToggleActive(user)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer border-0 ${
              user.active
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-green-700 bg-green-50 hover:bg-green-100"
            }`}
          >
            {user.active ? "Deactivate" : "Reactivate"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function ManageUsersPage() {
  const { role, user: currentUser, hoa } = useAuth();
  const accent = hoa?.accentColor ?? "#185FA5";

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [hoas, setHoas] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<UserRecord | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
    if (role === "superadmin") {
      fetch("/api/hoas")
        .then((res) => (res.ok ? res.json() : []))
        .then((data) => setHoas(data));
    }
  }, [fetchUsers, role]);

  // What happened to the last invitation or password link.
  const [notice, setNotice] = useState<{
    tone: "success" | "info" | "error";
    text: string;
    link?: string;
  } | null>(null);

  function reportDelivery(
    email: string,
    delivery: { emailed: boolean; link?: string } | undefined
  ) {
    if (!delivery) return;
    if (delivery.emailed) {
      setNotice({ tone: "success", text: `A set-password link was emailed to ${email}.` });
    } else {
      // Email isn't configured (or the send failed), so hand the admin the
      // link to pass on themselves.
      setNotice({
        tone: "info",
        text: `The email to ${email} couldn't be sent. Copy this link and send it to them yourself. It works once and expires in 7 days.`,
        link: delivery.link,
      });
    }
  }

  async function handleCreate(data: typeof EMPTY_FORM, sendInvite: boolean) {
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, sendInvite }),
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error ?? "Could not add the member.");
    setNotice(null);
    reportDelivery(data.email, body?.invite);
    await fetchUsers();
  }

  async function handleSendLink(u: UserRecord) {
    if (!confirm(`Email ${u.email} a link to set a new password?`)) return;
    try {
      const res = await fetch(`/api/users/${u.id}/invite`, { method: "POST" });
      const body = await res.json().catch(() => null);
      if (!res.ok) throw new Error(body?.error ?? "Could not send the link.");
      reportDelivery(u.email, body);
    } catch (err: any) {
      setNotice({ tone: "error", text: err.message ?? "Could not send the link." });
    }
  }

  async function handleEdit(data: typeof EMPTY_FORM) {
    if (!editing) return;
    // Don't send empty password
    const payload = { ...data };
    if (!payload.password) delete (payload as any).password;
    const res = await fetch(`/api/users/${editing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.error ?? "Could not save the member.");
    }
    await fetchUsers();
  }

  async function handleToggleActive(u: UserRecord) {
    const res = await fetch(`/api/users/${u.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !u.active }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      setNotice({
        tone: "error",
        text: body?.error ?? "Could not update the member.",
      });
    }
    await fetchUsers();
  }

  const filtered = users.filter((u) => {
    const matchSearch =
      (u.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === "all" || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    total: users.length,
    active: users.filter((u) => u.active).length,
    admins: users.filter((u) => u.role === "admin").length,
    residents: users.filter((u) => u.role === "resident").length,
  };

  return (
    <div className="min-h-screen">
      <Header />
      {/* Page header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-8 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight m-0">
              👥 Members
            </h1>
            <p className="text-sm text-gray-600 mt-1 m-0">
              {hoa?.name ?? "Your HOA"} · Manage residents and administrators
            </p>
          </div>
          <button
            onClick={() => {
              setEditing(null);
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all cursor-pointer border-0"
            style={{
              background: `linear-gradient(135deg, ${accent}, ${shadeColor(accent, -20)})`,
            }}
          >
            Invite member
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-8 py-6">
        {notice && (
          <div
            role={notice.tone === "error" ? "alert" : "status"}
            className={`mb-6 px-4 py-3 rounded-lg border text-sm ${
              notice.tone === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : notice.tone === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-blue-50 border-blue-200 text-blue-900"
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="m-0">{notice.text}</p>
              <button
                type="button"
                onClick={() => setNotice(null)}
                className="text-xs font-semibold underline bg-transparent border-0 cursor-pointer text-current flex-shrink-0"
              >
                Dismiss
              </button>
            </div>
            {notice.link && (
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <input
                  readOnly
                  value={notice.link}
                  aria-label="Set-password link"
                  onFocus={(e) => e.currentTarget.select()}
                  className="flex-1 min-w-[12rem] px-3 py-2 rounded-lg border border-blue-200 bg-white text-xs text-gray-900"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard?.writeText(notice.link!)}
                  className="px-3 py-2 rounded-lg text-xs font-semibold text-white bg-blue-700 hover:bg-blue-800 border-0 cursor-pointer"
                >
                  Copy link
                </button>
              </div>
            )}
          </div>
        )}

        {/* Stats */}
        <div className="flex gap-3 mb-6 flex-wrap">
          {[
            {
              label: "Total Members",
              value: counts.total,
              color: accent,
              bg: `${accent}15`,
            },
            {
              label: "Active",
              value: counts.active,
              color: "#3B6D11",
              bg: "#EAF3DE",
            },
            {
              label: "Admins",
              value: counts.admins,
              color: "#854F0B",
              bg: "#FAEEDA",
            },
            {
              label: "Residents",
              value: counts.residents,
              color: "#533AB7",
              bg: "#EEEDFE",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl px-4 py-3 flex-1 min-w-[90px]"
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

        {/* Filters */}
        <div className="flex gap-3 mb-4 flex-wrap">
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 min-w-[200px] px-4 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-blue-400 bg-white"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-white cursor-pointer outline-none"
          >
            <option value="all">All Roles</option>
            <option value="resident">Residents</option>
            <option value="admin">Admins</option>
          </select>
        </div>

        {/* Table */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Table header */}
          <div className="flex items-center gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-600 uppercase tracking-wide">
            <div className="w-9 flex-shrink-0" />
            <div className="flex-1">Member</div>
            <div className="hidden sm:block w-24">Role</div>
            {role === "superadmin" && (
              <div className="hidden lg:block w-32">Community</div>
            )}
            <div className="hidden md:block w-24 text-right">Joined</div>
            <div className="w-32 flex-shrink-0" />
          </div>

          {loading && (
            <p className="px-5 py-10 text-center text-sm text-gray-600 m-0" role="status">
              Loading members…
            </p>
          )}
          {!loading && filtered.length === 0 && (
            <p className="px-5 py-10 text-center text-sm text-gray-600 m-0">
              {users.length === 0
                ? "No members yet. Invite the first one."
                : "No members match your search."}
            </p>
          )}

          {!loading &&
            filtered.length > 0 &&
            filtered.map((u) => (
              <UserRow
                key={u.id}
                user={u}
                currentUserId={currentUser.id}
                currentUserRole={role}
                onEdit={(u) => {
                  setEditing(u);
                  setShowModal(true);
                }}
                onToggleActive={handleToggleActive}
                onSendLink={handleSendLink}
              />
            ))}
        </div>
      </div>

      {showModal && (
        <UserFormModal
          initial={editing ?? undefined}
          hoas={hoas}
          currentUserRole={role}
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
