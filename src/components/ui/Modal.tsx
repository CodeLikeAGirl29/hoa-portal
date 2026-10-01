"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface OverlayProps {
  onClose: () => void;
  /** Read out by screen readers when the dialog opens. */
  label?: string;
  /** Id of the element that titles the dialog, instead of `label`. */
  labelledBy?: string;
  children: ReactNode;
}

/**
 * The dimmed backdrop every dialog sits on. Gives a dialog the behaviour
 * people expect: Escape closes it, clicking outside closes it, the page
 * behind stops scrolling, and keyboard focus moves in and then back to
 * wherever it was.
 */
export function Overlay({ onClose, label, labelledBy, children }: OverlayProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Keep the latest onClose without re-running the effect on every render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onCloseRef.current();
        return;
      }
      // Keep Tab inside the dialog.
      if (e.key !== "Tab" || !ref.current) return;
      const focusable = ref.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === first || active === ref.current)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, []);

  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={labelledBy ? undefined : label}
      aria-labelledby={labelledBy}
      className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4 outline-none"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      {children}
    </div>
  );
}

const WIDTHS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
};

interface ModalProps {
  title: string;
  description?: ReactNode;
  onClose: () => void;
  size?: keyof typeof WIDTHS;
  /** Shown beside the title, e.g. a category badge. */
  titleAside?: ReactNode;
  /** Pinned to the bottom of the dialog, below the scrolling content. */
  footer?: ReactNode;
  children: ReactNode;
}

/**
 * A titled dialog. On phones it slides up as a sheet filling the width; on
 * larger screens it's a centred panel.
 */
export function Modal({
  title,
  description,
  onClose,
  size = "md",
  titleAside,
  footer,
  children,
}: ModalProps) {
  const titleId = useId();

  return (
    <Overlay onClose={onClose} labelledBy={titleId}>
      <div
        className={`bg-white w-full ${WIDTHS[size]} max-h-[92vh] flex flex-col shadow-2xl rounded-t-2xl sm:rounded-2xl`}
      >
        <div className="flex items-start justify-between gap-3 px-5 sm:px-6 py-4 border-b border-gray-200">
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h2
                id={titleId}
                className="m-0 text-lg font-semibold text-gray-900 font-serif"
              >
                {title}
              </h2>
              {titleAside}
            </div>
            {description && (
              <p className="text-sm text-gray-600 m-0 mt-0.5">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="text-gray-500 hover:text-gray-900 text-2xl leading-none w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 cursor-pointer border-0 bg-transparent flex-shrink-0"
          >
            <span aria-hidden="true">×</span>
          </button>
        </div>

        <div className="overflow-y-auto flex-1">{children}</div>

        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-none sm:rounded-b-2xl flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </Overlay>
  );
}

/** Shared look for form labels and fields, so every form matches. */
export const LABEL_CLASS = "block text-sm font-medium text-gray-800 mb-1.5";
export const INPUT_CLASS =
  "w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white placeholder:text-gray-500 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-colors";

/** An error (or success) message inside a form. Announced when it appears. */
export function FormMessage({
  tone = "error",
  children,
}: {
  tone?: "error" | "success" | "info";
  children: ReactNode;
}) {
  const tones = {
    error: "bg-red-50 border-red-200 text-red-800",
    success: "bg-green-50 border-green-200 text-green-800",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`px-4 py-3 border rounded-lg text-sm ${tones[tone]}`}
    >
      {children}
    </div>
  );
}
