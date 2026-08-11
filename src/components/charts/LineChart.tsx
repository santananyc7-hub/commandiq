import { money, moneyCompact } from "@/lib/format";

export interface LinePoint {
  label: string;
  value: number;
}

/**
 * Area line chart for trends (§23). Server-safe SVG with an optional reference
 * (goal) line and light gridlines. Tells one story — no legends, no clutter.
 */
export function LineChart({
  points,
  height = 220,
  tone = "accent",
  goal,
  goalLabel,
  valueFormat = (n) => moneyCompact(n),
  yTicks = 4,
}: {
  points: LinePoint[];
  height?: number;
  tone?: "accent" | "positive" | "negative";
  goal?: number;
  goalLabel?: string;
  valueFormat?: (n: number) => string;
  yTicks?: number;
}) {
  const width = 720;
  const padL = 52;
  const padR = 16;
  const padT = 12;
  const padB = 28;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const values = points.map((p) => p.value);
  const rawMax = Math.max(...values, goal ?? 0);
  const rawMin = Math.min(...values, goal ?? Infinity);
  const max = rawMax * 1.08;
  const min = Math.max(0, rawMin * 0.9);
  const span = max - min || 1;

  const x = (i: number) => padL + (i / (points.length - 1)) * plotW;
  const y = (v: number) => padT + plotH - ((v - min) / span) * plotH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${line} L${x(points.length - 1).toFixed(1)},${(padT + plotH).toFixed(1)} L${padL},${(padT + plotH).toFixed(1)} Z`;

  const colorVar =
    tone === "positive" ? "--positive" : tone === "negative" ? "--negative" : "--accent-500";

  const ticks = Array.from({ length: yTicks + 1 }, (_, i) => min + (span * i) / yTicks);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      preserveAspectRatio="xMidYMid meet"
      role="img"
    >
      <defs>
        <linearGradient id={`lc-${tone}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(var(${colorVar}))`} stopOpacity={0.24} />
          <stop offset="100%" stopColor={`rgb(var(${colorVar}))`} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* Gridlines + y labels */}
      {ticks.map((t, i) => (
        <g key={i}>
          <line
            x1={padL}
            x2={width - padR}
            y1={y(t)}
            y2={y(t)}
            stroke="rgb(var(--border))"
            strokeOpacity={0.5}
            strokeDasharray={i === 0 ? "0" : "3 4"}
          />
          <text x={padL - 8} y={y(t) + 3} textAnchor="end" fontSize={10} fill="rgb(var(--ink-subtle))" className="tabular">
            {valueFormat(t)}
          </text>
        </g>
      ))}

      {/* Goal line */}
      {goal !== undefined && (
        <g>
          <line
            x1={padL}
            x2={width - padR}
            y1={y(goal)}
            y2={y(goal)}
            stroke="rgb(var(--accent-500))"
            strokeOpacity={0.7}
            strokeDasharray="5 4"
          />
          {goalLabel && (
            <text x={width - padR} y={y(goal) - 5} textAnchor="end" fontSize={10} fontWeight={600} fill="rgb(var(--accent-500))">
              {goalLabel}
            </text>
          )}
        </g>
      )}

      <path d={area} fill={`url(#lc-${tone})`} />
      <path
        d={line}
        fill="none"
        stroke={`rgb(var(${colorVar}))`}
        strokeWidth={2.25}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <circle key={i} cx={x(i)} cy={y(p.value)} r={i === points.length - 1 ? 3.5 : 0} fill={`rgb(var(${colorVar}))`}>
          <title>{`${p.label}: ${money(p.value)}`}</title>
        </circle>
      ))}

      {/* X labels — thin out to avoid crowding */}
      {points.map((p, i) => {
        const every = Math.ceil(points.length / 7);
        if (i % every !== 0 && i !== points.length - 1) return null;
        return (
          <text key={i} x={x(i)} y={height - 8} textAnchor="middle" fontSize={10} fill="rgb(var(--ink-subtle))">
            {p.label}
          </text>
        );
      })}
    </svg>
  );
}
