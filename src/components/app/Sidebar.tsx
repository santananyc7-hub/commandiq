"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { NAV, SETTINGS_ITEM } from "@/lib/nav";
import { Logo } from "@/components/brand/Logo";
import { cn } from "@/lib/cn";

export function Sidebar({
  onNavigate,
  onAsk,
}: {
  onNavigate?: () => void;
  onAsk?: () => void;
}) {
  const pathname = usePathname();

  const item = (nav: (typeof NAV)[number], key: string) => {
    const active = pathname === nav.href || pathname.startsWith(nav.href + "/");
    const Icon = nav.icon;
    return (
      <Link
        key={key}
        href={nav.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          active
            ? "bg-surface-2 text-ink"
            : "text-ink-muted hover:bg-surface-2/60 hover:text-ink"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0",
            active ? "text-accent-500" : "text-ink-subtle group-hover:text-ink-muted"
          )}
        />
        <span className="truncate font-medium">{nav.label}</span>
        {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent-500" />}
      </Link>
    );
  };

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 items-center border-b border-border px-5">
        <Link href="/dashboard" onClick={onNavigate}>
          <Logo />
        </Link>
      </div>

      <div className="px-3 pt-4">
        <button
          onClick={onAsk}
          className="flex w-full items-center gap-2.5 rounded-lg border border-accent-500/30 bg-accent-50/50 px-3 py-2.5 text-left text-sm font-medium text-accent-700 shadow-glow transition-colors hover:bg-accent-50"
        >
          <Sparkles className="h-[18px] w-[18px] text-accent-500" />
          Ask CommandIQ
          <kbd className="ml-auto rounded border border-accent-300/40 bg-surface px-1.5 py-0.5 text-2xs font-semibold text-ink-subtle">
            ⌘K
          </kbd>
        </button>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-1 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
          Command
        </p>
        {NAV.map((n) => item(n, n.href))}
      </nav>

      <div className="space-y-1 border-t border-border px-3 py-3">
        {item(SETTINGS_ITEM, SETTINGS_ITEM.href)}
      </div>
    </div>
  );
}
