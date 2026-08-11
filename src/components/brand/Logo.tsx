import { cn } from "@/lib/cn";

/** CommandIQ mark — a precise, illuminated command glyph. */
export function LogoMark({ className, size = 28 }: { className?: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <rect x="1.25" y="1.25" width="29.5" height="29.5" rx="8" fill="rgb(var(--surface-2))" stroke="rgb(var(--border-strong))" strokeWidth="1.5" />
      <path d="M9 20.5V11.5L16 8L23 11.5V20.5L16 24L9 20.5Z" stroke="rgb(var(--accent-500))" strokeWidth="1.5" strokeLinejoin="round" />
      <circle cx="16" cy="16" r="2.75" fill="rgb(var(--accent-500))" />
      <path d="M16 8V13.25M16 18.75V24M9 11.5L13.5 14M23 11.5L18.5 14" stroke="rgb(var(--accent-400))" strokeWidth="1.25" strokeOpacity="0.55" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({
  className,
  showEndorsement = true,
}: {
  className?: string;
  showEndorsement?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark />
      <div className="leading-none">
        <div className="text-[15px] font-semibold tracking-tight text-ink">
          Command<span className="text-accent-500">IQ</span>
        </div>
        {showEndorsement && (
          <div className="mt-0.5 text-2xs font-medium uppercase tracking-[0.14em] text-ink-subtle">
            by Revenue Labs
          </div>
        )}
      </div>
    </div>
  );
}
