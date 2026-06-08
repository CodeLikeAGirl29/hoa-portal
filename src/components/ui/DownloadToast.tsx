"use client";

import { useEffect } from "react";
import type { HOADocument } from "@/types";

interface DownloadToastProps {
  document: HOADocument;
  onClose: () => void;
}

export function DownloadToast({ document: doc, onClose }: DownloadToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3500);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-4 rounded-xl text-sm shadow-2xl"
      style={{
        background: "#1a1a1a",
        color: "#fff",
        animation: "slideUp 0.3s ease",
      }}
      role="status"
      aria-live="polite"
    >
      <span className="text-lg">📥</span>
      <div>
        <div className="font-semibold">Preparing download…</div>
        <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
          {doc.title} — watermarked "OFFICIAL RECORD"
        </div>
      </div>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}
