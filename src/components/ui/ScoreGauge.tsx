import type { ScoreStatus } from "@/lib/types";

const STATUS_TOKEN: Record<ScoreStatus, string> = {
  strong: "positive",
  stable: "accent-500",
  attention: "watch",
  critical: "critical",
};

/**
 * Radial CommandIQ Score gauge. Pure SVG so it renders identically on server
 * and client; the arc fills to `score`/100.
 */
export function ScoreGauge({
  score,
  status,
  size = 168,
}: {
  score: number;
  status: ScoreStatus;
  size?: number;
}) {
  const stroke = 12;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  // 270° sweep starting from the lower-left.
  const startAngle = 135;
  const sweep = 270;
  const circumference = 2 * Math.PI * r;
  const arcLen = (sweep / 360) * circumference;
  const filled = (score / 100) * arcLen;
  const token = STATUS_TOKEN[status];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <defs>
        <linearGradient id="score-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={`rgb(var(--${token}))`} stopOpacity={0.7} />
          <stop offset="100%" stopColor={`rgb(var(--${token}))`} />
        </linearGradient>
      </defs>
      {/* Track */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="rgb(var(--border))"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${arcLen} ${circumference}`}
        transform={`rotate(${startAngle} ${cx} ${cy})`}
      />
      {/* Value arc */}
      <circle
        cx={cx}
        cy={cy}
        r={r}
        fill="none"
        stroke="url(#score-grad)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={`${filled} ${circumference}`}
        transform={`rotate(${startAngle} ${cx} ${cy})`}
        style={{ transition: "stroke-dasharray 900ms cubic-bezier(0.16,1,0.3,1)" }}
      />
      <text
        x={cx}
        y={cy - 4}
        textAnchor="middle"
        className="tabular"
        fontSize={size * 0.3}
        fontWeight={700}
        fill="rgb(var(--ink))"
      >
        {score}
      </text>
      <text
        x={cx}
        y={cy + size * 0.16}
        textAnchor="middle"
        fontSize={size * 0.085}
        fontWeight={600}
        letterSpacing={1.5}
        fill="rgb(var(--ink-subtle))"
      >
        / 100
      </text>
    </svg>
  );
}
