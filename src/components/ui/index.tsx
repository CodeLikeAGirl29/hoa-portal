import type { ReactNode, ButtonHTMLAttributes } from "react";
import type { UserRole, DocumentCategory, ChecklistPriority } from "@/types";
import { CATEGORY_META } from "@/lib/redaction";

// ─── Role Badge ────────────────────────────────────────────────────────────
const ROLE_STYLES: Record<
  UserRole,
  { bg: string; color: string; label: string }
> = {
  public: { bg: "#F1EFE8", color: "#5F5E5A", label: "Public View" },
  resident: { bg: "#E6F1FB", color: "#185FA5", label: "Resident" },
  admin: { bg: "#EAF3DE", color: "#3B6D11", label: "Administrator" },
  superadmin: { bg: "#EEEDFE", color: "#533AB7", label: "Super Admin" },
};

export function RoleBadge({
  role,
  accentColor,
}: {
  role: UserRole;
  accentColor?: string;
}) {
  const accent = accentColor ?? "#185FA5";

  const styles: Record<UserRole, { bg: string; color: string; label: string }> =
    {
      public: { bg: "#F1EFE8", color: "#5F5E5A", label: "Public View" },
      resident: { bg: `${accent}18`, color: accent, label: "Resident" },
      admin: { bg: "#EAF3DE", color: "#3B6D11", label: "Administrator" },
      superadmin: { bg: "#EEEDFE", color: "#533AB7", label: "Super Admin" },
    };

  const s = styles[role] ?? styles.public;

  return (
    <span
      className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {s.label}
    </span>
  );
}

// ─── Category Badge ────────────────────────────────────────────────────────
export function CategoryBadge({ category }: { category: DocumentCategory }) {
  const m = CATEGORY_META[category];
  return (
    <span
      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
      style={{ background: m.bg, color: m.color }}
    >
      {m.icon} {m.label}
    </span>
  );
}

// ─── Access Badge ──────────────────────────────────────────────────────────
export function AccessBadge({
  isPublic,
  isResident,
}: {
  isPublic: boolean;
  isResident: boolean;
}) {
  if (isPublic)
    return (
      <span className="text-[11px] font-medium text-green-700">🔓 Public</span>
    );
  if (isResident)
    return (
      <span className="text-[11px] font-medium text-blue-700">🔐 Resident</span>
    );
  return (
    <span className="text-[11px] font-medium text-red-700">🔒 Admin Only</span>
  );
}

// ─── Priority Badge ────────────────────────────────────────────────────────
const PRIORITY_STYLES: Record<
  ChecklistPriority,
  { bg: string; color: string }
> = {
  high: { bg: "#FAECE7", color: "#712B13" },
  medium: { bg: "#FAEEDA", color: "#854F0B" },
  low: { bg: "#EAF3DE", color: "#3B6D11" },
};

export function PriorityBadge({ priority }: { priority: ChecklistPriority }) {
  const s = PRIORITY_STYLES[priority];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
      style={{ background: s.bg, color: s.color }}
    >
      {priority}
    </span>
  );
}

// ─── Button ────────────────────────────────────────────────────────────────
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
  children: ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50";

  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 active:scale-[0.98]",
    secondary:
      "bg-gray-100 text-gray-600 hover:bg-gray-200 active:scale-[0.98]",
    ghost:
      "bg-transparent border border-gray-200 text-gray-600 hover:bg-gray-50",
  };

  const sizes = {
    sm: "text-xs px-3 py-1.5",
    md: "text-sm px-4 py-2",
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ─── Card ──────────────────────────────────────────────────────────────────
export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-white border border-gray-200 rounded-xl p-5 ${className}`}
    >
      {children}
    </div>
  );
}

// ─── Alert Banner ──────────────────────────────────────────────────────────
type AlertVariant = "info" | "warning" | "success" | "admin";

const ALERT_STYLES: Record<
  AlertVariant,
  { bg: string; border: string; color: string; icon: string }
> = {
  info: { bg: "#E6F1FB", border: "#B5D4F4", color: "#0C447C", icon: "ℹ️" },
  warning: { bg: "#FAEEDA", border: "#FAC775", color: "#633806", icon: "⚠️" },
  success: { bg: "#EAF3DE", border: "#C0DD97", color: "#27500A", icon: "✓" },
  admin: { bg: "#EAF3DE", border: "#C0DD97", color: "#27500A", icon: "🛡️" },
};

export function AlertBanner({
  variant,
  children,
}: {
  variant: AlertVariant;
  children: ReactNode;
}) {
  const s = ALERT_STYLES[variant];
  return (
    <div
      className="flex items-start gap-3 rounded-xl px-5 py-4 mb-6 text-sm"
      style={{
        background: s.bg,
        border: `1px solid ${s.border}`,
        color: s.color,
      }}
    >
      <span className="text-lg leading-none mt-0.5">{s.icon}</span>
      <div>{children}</div>
    </div>
  );
}

// ─── Stat Card ─────────────────────────────────────────────────────────────
export function StatCard({
  label,
  value,
  color,
  bg,
}: {
  label: string;
  value: number;
  color: string;
  bg: string;
}) {
  return (
    <div
      className="rounded-xl p-4 flex-1 min-w-[80px]"
      style={{ background: bg }}
    >
      <div className="text-2xl font-bold" style={{ color }}>
        {value}
      </div>
      <div className="text-[11px] mt-1 opacity-80" style={{ color }}>
        {label}
      </div>
    </div>
  );
}
