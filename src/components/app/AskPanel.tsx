"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, CornerDownLeft, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { reason, type AiAnswer } from "@/lib/ai/reasoner";

type AskResult = AiAnswer;

const SUGGESTIONS = [
  "Can we afford a $60,000 inventory purchase this week?",
  "Why is gross margin down?",
  "Which vendors should we prioritize?",
  "Are we on pace to hit $1 million this month?",
  "How much AP is more than 60 days overdue?",
  "Where could we cut $20,000 per month?",
];

export function AskPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AskResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 60);
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  function ask(question: string) {
    const text = question.trim();
    if (!text) return;
    setQ(text);
    setLoading(true);
    setError(null);
    setResult(null);
    // The reasoner is pure and deterministic — it runs entirely in the browser
    // against the same computed financial state, so the demo needs no server.
    setTimeout(() => {
      try {
        setResult(reason(text));
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong.");
      } finally {
        setLoading(false);
      }
    }, 320);
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] transition",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute inset-y-0 right-0 flex w-full max-w-lg flex-col border-l border-border bg-surface shadow-pop transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <header className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-50 shadow-glow">
            <Sparkles className="h-[18px] w-[18px] text-accent-500" />
          </span>
          <div>
            <div className="text-sm font-semibold text-ink">Ask CommandIQ</div>
            <div className="text-2xs text-ink-subtle">Grounded in your financial data</div>
          </div>
          <button
            onClick={onClose}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-2"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="border-b border-border p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(q);
            }}
            className="relative"
          >
            <input
              ref={inputRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ask about cash, vendors, margin, pace…"
              className="field pr-11"
            />
            <button
              type="submit"
              disabled={loading || !q.trim()}
              className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-md bg-accent-600 text-white disabled:opacity-40"
              aria-label="Send"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CornerDownLeft className="h-4 w-4" />}
            </button>
          </form>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {!result && !loading && !error && (
            <div className="space-y-2">
              <p className="px-1 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
                Try asking
              </p>
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  className="block w-full rounded-lg border border-border bg-surface-2/50 px-3.5 py-2.5 text-left text-[13px] text-ink-muted transition-colors hover:border-accent-500/40 hover:text-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-2 px-1 py-8 text-sm text-ink-subtle">
              <Loader2 className="h-4 w-4 animate-spin text-accent-500" />
              Analyzing your financials…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-critical/30 bg-critical/10 px-4 py-3 text-sm text-negative-strong">
              {error}
            </div>
          )}

          {result && !loading && (
            <div className="animate-fade-up space-y-4">
              <Section label="Conclusion" accent>
                <p className="text-[15px] font-medium leading-relaxed text-ink">{result.conclusion}</p>
              </Section>
              {result.evidence.length > 0 && (
                <Section label="Evidence">
                  <ul className="space-y-1.5">
                    {result.evidence.map((e, i) => (
                      <li key={i} className="flex gap-2 text-[13px] text-ink-muted">
                        <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent-500" />
                        <span className="tabular">{e}</span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {result.impact && (
                <Section label="Impact">
                  <p className="text-[13px] leading-relaxed text-ink-muted">{result.impact}</p>
                </Section>
              )}
              <Section label="Recommendation">
                <p className="text-[13px] leading-relaxed text-ink-muted">{result.recommendation}</p>
              </Section>
              <p className="pt-1 text-2xs text-ink-subtle">
                {result.grounded ? "Grounded in current metrics" : "Insufficient data for a grounded answer"} · {result.provider}
              </p>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}

function Section({
  label,
  children,
  accent = false,
}: {
  label: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-4",
        accent ? "border-accent-500/30 bg-accent-50/40" : "border-border bg-surface-2/40"
      )}
    >
      <div className="mb-1.5 text-2xs font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
      </div>
      {children}
    </div>
  );
}
