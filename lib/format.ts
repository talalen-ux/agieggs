export const fmtUsd = (n: number) =>
  n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  });

export const fmtAgi = (n: number) =>
  n.toLocaleString("en-US", { maximumFractionDigits: 2 }) + " AGI";

export const fmtInt = (n: number) =>
  Math.floor(n).toLocaleString("en-US");

export const fmtPct = (n: number) => `${Math.round(n * 100)}%`;

export function timeAgo(ts: number): string {
  const s = Math.max(1, Math.floor((Date.now() - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
