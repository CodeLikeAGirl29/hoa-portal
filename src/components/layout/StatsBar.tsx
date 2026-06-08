"use client";

import { useMemo } from "react";
import type { DocumentCategory } from "@/types";
import { MOCK_DOCUMENTS } from "@/lib/data";
import { canAccess } from "@/lib/redaction";
import { useAuth } from "@/hooks/useAuth";
import { StatCard } from "@/components/ui";

export function StatsBar() {
  const { role } = useAuth();

  const stats = useMemo(() => {
    const visible = MOCK_DOCUMENTS.filter((d) => canAccess(d, role));
    const countBy = (cat: DocumentCategory) =>
      visible.filter((d) => d.category === cat).length;

    return [
      { label: "Total Accessible", value: visible.length,      color: "#185FA5", bg: "#E6F1FB" },
      { label: "Governing",        value: countBy("governing"), color: "#5F5E5A", bg: "#F1EFE8" },
      { label: "Financial",        value: countBy("financial"), color: "#3B6D11", bg: "#EAF3DE" },
      { label: "Meetings",         value: countBy("meetings"),  color: "#854F0B", bg: "#FAEEDA" },
      { label: "Contracts",        value: countBy("contracts"), color: "#712B13", bg: "#FAECE7" },
    ];
  }, [role]);

  return (
    <div className="flex gap-3 flex-wrap mb-7">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
