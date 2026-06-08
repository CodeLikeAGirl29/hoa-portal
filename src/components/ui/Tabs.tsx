"use client";

interface Tab {
  id: string;
  label: string;
  icon: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-0.5 border-b-2 border-gray-100 mb-7">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className="px-4 py-2.5 border-none bg-transparent cursor-pointer text-sm transition-all duration-150 -mb-0.5"
          style={{
            borderBottom: active === t.id ? "2px solid #185FA5" : "2px solid transparent",
            fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? "#185FA5" : "#888",
          }}
        >
          <span className="mr-1.5">{t.icon}</span>
          {t.label}
          {t.count !== undefined && (
            <span
              className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={{
                background: active === t.id ? "#185FA5" : "#e8e5e0",
                color: active === t.id ? "#fff" : "#777",
              }}
            >
              {t.count}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
