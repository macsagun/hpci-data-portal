import { money, num } from "./format";
import type { Stats, Week } from "./types";

// Mirrors the design tokens in styles/tokens.css — kept as plain hex here too
// since these are consumed as inline SVG fill/stroke attributes, not CSS.
export const COLORS = {
  positive: "#0f7a56",
  negative: "#b42318",
  flat: "#98a2b3",
  accent: "#2f6ae0",
};

export function stats(weeks: Week[]): Stats {
  const n = weeks.length;
  if (n === 0) return { n: 0, avgAtt: 0, avgReg: 0, totalVip: 0, giving: 0 };
  const avgAtt = Math.round(weeks.reduce((a, b) => a + b.regulars + b.vip, 0) / n);
  const avgReg = Math.round(weeks.reduce((a, b) => a + b.regulars, 0) / n);
  const totalVip = weeks.reduce((a, b) => a + b.vip, 0);
  const giving = weeks.reduce((a, b) => a + b.giving, 0);
  return { n, avgAtt, avgReg, totalVip, giving };
}

export type Delta = { str: string; color: string };

export function deltaNum(oldV: number | null, newV: number): Delta {
  if (oldV == null) return { str: "New", color: COLORS.accent };
  const d = newV - oldV;
  return {
    str: (d > 0 ? "+" : "") + num(d),
    color: d > 0 ? COLORS.positive : d < 0 ? COLORS.negative : COLORS.flat,
  };
}

export function deltaMoney(oldV: number | null, newV: number): Delta {
  if (oldV == null) return { str: "New", color: COLORS.accent };
  const d = newV - oldV;
  return {
    str: (d > 0 ? "+" : d < 0 ? "−" : "") + money(Math.abs(d)),
    color: d > 0 ? COLORS.positive : d < 0 ? COLORS.negative : COLORS.flat,
  };
}

export function niceMax(v: number): number {
  if (v <= 0) return 1;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  let m: number;
  if (n <= 1) m = 1;
  else if (n <= 2) m = 2;
  else if (n <= 2.5) m = 2.5;
  else if (n <= 5) m = 5;
  else m = 10;
  return m * p;
}
