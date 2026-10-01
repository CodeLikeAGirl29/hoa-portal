"use client";

import { useMemo } from "react";
import type { DocumentCategory, RedactedDocument } from "@/types";
import { StatCard } from "@/components/ui";

/**
 * Counts of the documents this person can actually open, by category.
 * `docs` is the list the vault loaded, so the numbers always match it.
 */
export function StatsBar({ docs }: { docs: RedactedDocument[] }) {
  const stats = useMemo(() => {
    const countBy = (cat: DocumentCategory) =>
      docs.filter((d) => d.category === cat).length;

    return [
      { label: "Documents you can open", value: docs.length, color: "#185FA5", bg: "#E6F1FB" },
      { label: "Governing", value: countBy("governing"), color: "#5F5E5A", bg: "#F1EFE8" },
      { label: "Financial", value: countBy("financial"), color: "#3B6D11", bg: "#EAF3DE" },
      { label: "Meetings", value: countBy("meetings"), color: "#854F0B", bg: "#FAEEDA" },
      { label: "Contracts", value: countBy("contracts"), color: "#712B13", bg: "#FAECE7" },
    ];
  }, [docs]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
      {stats.map((s) => (
        <StatCard key={s.label} {...s} />
      ))}
    </div>
  );
}
