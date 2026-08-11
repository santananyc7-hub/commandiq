"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  CalendarPlus,
  type LucideIcon,
} from "lucide-react";
import { NAV, SETTINGS_ITEM } from "@/lib/nav";
import { cn } from "@/lib/cn";

interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: LucideIcon;
  run: () => void;
  group: string;
}

export function CommandPalette({
  open,
  onClose,
  onAsk,
}: {
  open: boolean;
  onClose: () => void;
  onAsk: () => void;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const commands = useMemo<Command[]>(() => {
    const go = (href: string) => () => {
      router.push(href);
      onClose();
    };
    const nav: Command[] = [...NAV, SETTINGS_ITEM].map((n) => ({
      id: `nav-${n.href}`,
      label: `Go to ${n.label}`,
      hint: n.description,
      icon: n.icon,
      run: go(n.href),
      group: "Navigate",
    }));
    const actions: Command[] = [
      { id: "ask", label: "Ask CommandIQ", hint: "AI CFO", icon: Sparkles, run: () => { onAsk(); onClose(); }, group: "Actions" },
      { id: "add-obligation", label: "Add obligation", hint: "Cash & Obligations", icon: CalendarPlus, run: go("/cash?new=1"), group: "Actions" },
      { id: "create-action", label: "Create action", hint: "Action Board", icon: Plus, run: go("/actions?new=1"), group: "Actions" },
      { id: "planner", label: "Open vendor payment planner", hint: "Vendors & AP", icon: Search, run: go("/vendors?planner=1"), group: "Actions" },
      { id: "sync", label: "Sync QuickBooks", hint: "Settings › Integrations", icon: RefreshCw, run: go("/settings?sync=1"), group: "Actions" },
    ];
    return [...actions, ...nav];
  }, [router, onClose, onAsk]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.hint?.toLowerCase().includes(q)
    );
  }, [query, commands]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      return;
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowDown") {
        e.preventDefault();
        setActive((a) => Math.min(a + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActive((a) => Math.max(a - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        filtered[active]?.run();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, filtered, active, onClose]);

  if (!open) return null;

  let lastGroup = "";

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute left-1/2 top-[15%] w-full max-w-xl -translate-x-1/2 px-4">
        <div className="animate-fade-up overflow-hidden rounded-xl border border-border-strong bg-overlay shadow-pop">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <Search className="h-4 w-4 text-ink-subtle" />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search commands…"
              className="h-12 w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-subtle"
            />
            <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 text-2xs text-ink-subtle">
              ESC
            </kbd>
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 && (
              <div className="px-3 py-8 text-center text-sm text-ink-subtle">No matching commands</div>
            )}
            {filtered.map((c, i) => {
              const showGroup = c.group !== lastGroup;
              lastGroup = c.group;
              const Icon = c.icon;
              return (
                <div key={c.id}>
                  {showGroup && (
                    <p className="px-3 pb-1 pt-2 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                      {c.group}
                    </p>
                  )}
                  <button
                    onMouseEnter={() => setActive(i)}
                    onClick={c.run}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                      i === active ? "bg-surface-2 text-ink" : "text-ink-muted"
                    )}
                  >
                    <Icon className={cn("h-[18px] w-[18px]", i === active ? "text-accent-500" : "text-ink-subtle")} />
                    <span className="font-medium">{c.label}</span>
                    {c.hint && <span className="ml-auto text-2xs text-ink-subtle">{c.hint}</span>}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
