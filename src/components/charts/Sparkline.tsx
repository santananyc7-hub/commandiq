/** Minimal inline sparkline (SVG). Server-safe, token-driven. */
export function Sparkline({
  data,
  width = 96,
  height = 28,
  tone = "accent",
  strokeWidth = 1.75,
}: {
  data: number[];
  width?: number;
  height?: number;
  tone?: "accent" | "positive" | "negative" | "muted";
  strokeWidth?: number;
}) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const stepX = width / (data.length - 1);
  const pad = strokeWidth;
  const usableH = height - pad * 2;

  const pts = data.map((v, i) => {
    const x = i * stepX;
    const y = pad + usableH - ((v - min) / span) * usableH;
    return [x, y] as const;
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
  const areaD = `${d} L${width},${height} L0,${height} Z`;

  const colorVar =
    tone === "positive"
      ? "--positive"
      : tone === "negative"
        ? "--negative"
        : tone === "muted"
          ? "--ink-subtle"
          : "--accent-500";
  const gid = `spark-${tone}-${data.length}-${Math.round(max)}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={`rgb(var(${colorVar}))`} stopOpacity={0.22} />
          <stop offset="100%" stopColor={`rgb(var(${colorVar}))`} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={areaD} fill={`url(#${gid})`} />
      <path
        d={d}
        fill="none"
        stroke={`rgb(var(${colorVar}))`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
