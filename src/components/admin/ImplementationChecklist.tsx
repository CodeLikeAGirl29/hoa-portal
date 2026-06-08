"use client";

import { useState } from "react";
import type { ChecklistItem } from "@/types";
import { CHECKLIST_ITEMS } from "@/lib/data";
import { PriorityBadge } from "@/components/ui";

export function ImplementationChecklist() {
  const [items, setItems] = useState<ChecklistItem[]>(CHECKLIST_ITEMS);

  const toggle = (id: number) =>
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );

  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / items.length) * 100);

  return (
    <div>
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between mb-2 text-sm">
          <span className="font-semibold text-gray-700">
            F.S. 720 Implementation Progress
          </span>
          <span className="font-bold" style={{ color: "#185FA5" }}>
            {done}/{items.length} ({pct}%)
          </span>
        </div>
        <div className="bg-gray-100 rounded-full h-2 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${pct}%`,
              background: pct === 100 ? "#3B6D11" : "#185FA5",
            }}
          />
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            onClick={() => toggle(item.id)}
            className="flex items-start gap-3 px-4 py-3 rounded-xl border cursor-pointer transition-all duration-150 select-none"
            style={{
              background: item.done ? "#fafaf9" : "#fff",
              border: `1px solid ${item.done ? "#e8e5e0" : "#ddd"}`,
              opacity: item.done ? 0.7 : 1,
            }}
            role="checkbox"
            aria-checked={item.done}
            tabIndex={0}
            onKeyDown={(e) => e.key === " " && toggle(item.id)}
          >
            {/* Checkbox */}
            <div
              className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 mt-0.5 transition-colors"
              style={{
                border: item.done ? "none" : "2px solid #ccc",
                background: item.done ? "#3B6D11" : "transparent",
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {item.done && "✓"}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p
                className="text-sm m-0"
                style={{
                  color: item.done ? "#999" : "#222",
                  textDecoration: item.done ? "line-through" : "none",
                }}
              >
                {item.label}
              </p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-0.5 m-0">{item.description}</p>
              )}
              {item.statute && (
                <p className="text-[11px] font-mono mt-1 m-0" style={{ color: "#185FA5" }}>
                  {item.statute}
                </p>
              )}
            </div>

            <PriorityBadge priority={item.priority} />
          </div>
        ))}
      </div>
    </div>
  );
}
