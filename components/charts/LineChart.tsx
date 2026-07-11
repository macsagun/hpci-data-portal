import { niceMax } from "@/lib/stats";
import { num } from "@/lib/format";

type Series = { label: string; value: number };

export default function LineChart({
  series,
  color = "#2f6ae0",
  width = 520,
  height = 210,
  yFmt = (v: number) => num(Math.round(v)),
}: {
  series: Series[];
  color?: string;
  width?: number;
  height?: number;
  yFmt?: (v: number) => string;
}) {
  const pad = { l: 52, r: 18, t: 14, b: 30 };
  const iw = width - pad.l - pad.r;
  const ih = height - pad.t - pad.b;
  const vals = series.map((s) => s.value);
  const max = niceMax(Math.max(...vals, 1));
  const n = series.length;
  const X = (i: number) => (n <= 1 ? pad.l + iw / 2 : pad.l + (iw * i) / (n - 1));
  const Y = (v: number) => pad.t + ih - (v / max) * ih;

  const gridLines = [];
  for (let g = 0; g <= 4; g++) {
    const v = (max * g) / 4;
    const yy = Y(v);
    gridLines.push(
      <line key={`g${g}`} x1={pad.l} x2={width - pad.r} y1={yy} y2={yy} stroke="#eceef2" strokeWidth={1} />
    );
    gridLines.push(
      <text key={`yl${g}`} x={pad.l - 8} y={yy + 4} textAnchor="end" fontSize={10} fill="#98a2b3" fontFamily="inherit">
        {yFmt(v)}
      </text>
    );
  }

  let linePath: React.ReactNode = null;
  if (n > 1) {
    let dl = `M ${X(0)} ${Y(vals[0])}`;
    for (let i = 1; i < n; i++) dl += ` L ${X(i)} ${Y(vals[i])}`;
    const area = `${dl} L ${X(n - 1)} ${pad.t + ih} L ${X(0)} ${pad.t + ih} Z`;
    linePath = (
      <>
        <path d={area} fill={color} opacity={0.09} />
        <path d={dl} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      </>
    );
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" style={{ display: "block", height: "auto" }}>
      {gridLines}
      {linePath}
      {series.map((s, i) => (
        <g key={i}>
          <circle cx={X(i)} cy={Y(s.value)} r={3.6} fill="#fff" stroke={color} strokeWidth={2} />
          <text x={X(i)} y={height - 9} textAnchor="middle" fontSize={10.5} fill="#667085" fontFamily="inherit">
            {s.label}
          </text>
        </g>
      ))}
    </svg>
  );
}
