"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, Menu, Sparkles, X, RefreshCw, Command } from "lucide-react";
import { Sidebar } from "@/components/app/Sidebar";
import { AskPanel } from "@/components/app/AskPanel";
import { CommandPalette } from "@/components/app/CommandPalette";
import { ThemeToggle } from "@/components/theme";
import { cn } from "@/lib/cn";

export interface ShellInfo {
  orgName: string;
  orgInitials: string;
  legalName: string;
  userName: string;
  userInitials: string;
  role: string;
  lastSync: string;
}

export function AppShell({
  children,
  info,
}: {
  children: React.ReactNode;
  info: ShellInfo;
}) {
  const [drawer, setDrawer] = useState(false);
  const [ask, setAsk] = useState(false);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPalette((p) => !p);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-canvas">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-border lg:block">
        <Sidebar onAsk={() => setAsk(true)} />
      </aside>

      {/* Mobile drawer */}
      {drawer && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 w-72 border-r border-border shadow-pop">
            <button
              onClick={() => setDrawer(false)}
              className="absolute right-3 top-4 z-10 flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              onNavigate={() => setDrawer(false)}
              onAsk={() => {
                setDrawer(false);
                setAsk(true);
              }}
            />
          </div>
        </div>
      )}

      <div className="lg:pl-64">
        <TopBar
          info={info}
          onOpenMenu={() => setDrawer(true)}
          onAsk={() => setAsk(true)}
          onPalette={() => setPalette(true)}
        />
        <main className="mx-auto w-full max-w-[1240px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>

      <AskPanel open={ask} onClose={() => setAsk(false)} />
      <CommandPalette open={palette} onClose={() => setPalette(false)} onAsk={() => setAsk(true)} />
    </div>
  );
}

function TopBar({
  info,
  onOpenMenu,
  onAsk,
  onPalette,
}: {
  info: ShellInfo;
  onOpenMenu: () => void;
  onAsk: () => void;
  onPalette: () => void;
}) {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/80 px-4 backdrop-blur-md sm:px-6 lg:px-8">
      <button
        onClick={onOpenMenu}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2 lg:hidden"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      <button className="hidden items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-sm font-medium text-ink transition-colors hover:bg-surface-2 sm:flex">
        <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-600 text-2xs font-bold text-white">
          {info.orgInitials}
        </span>
        {info.orgName}
        <ChevronDown className="h-4 w-4 text-ink-subtle" />
      </button>

      {/* Command palette trigger */}
      <button
        onClick={onPalette}
        className="ml-auto hidden items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 py-1.5 text-[13px] text-ink-subtle transition-colors hover:border-border-strong hover:text-ink-muted md:flex"
      >
        <Command className="h-3.5 w-3.5" />
        Search & commands
        <kbd className="rounded border border-border bg-surface px-1.5 py-0.5 text-2xs font-semibold">⌘K</kbd>
      </button>

      <div className="ml-auto flex items-center gap-2 md:ml-3">
        <span className="hidden items-center gap-1.5 rounded-lg border border-border bg-surface-2 px-2.5 py-1.5 text-2xs text-ink-subtle lg:flex">
          <RefreshCw className="h-3 w-3" />
          Synced {info.lastSync}
        </span>

        <button
          onClick={onAsk}
          className="flex h-9 items-center gap-1.5 rounded-lg border border-accent-500/30 bg-accent-50/60 px-3 text-[13px] font-medium text-accent-700 shadow-glow transition-colors hover:bg-accent-50"
        >
          <Sparkles className="h-4 w-4 text-accent-500" />
          <span className="hidden sm:inline">Ask CommandIQ</span>
        </button>

        <ThemeToggle />

        <Link
          href="/settings"
          className="ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-400 to-accent-700 text-[13px] font-semibold text-white"
          aria-label="Account"
          title={`${info.userName} · ${info.role}`}
        >
          {info.userInitials}
        </Link>
      </div>
    </header>
  );
}
