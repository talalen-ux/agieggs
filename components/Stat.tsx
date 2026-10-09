export function Stat({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
}) {
  return (
    <div className="card p-5">
      <div className="eyebrow-mute">{label}</div>
      <div className="display text-[clamp(26px,3vw,40px)] font-semibold tracking-tightest mt-2">
        {value}
      </div>
      {sub && <div className="eyebrow-mute mt-1">{sub}</div>}
    </div>
  );
}

export function Bar({ value, label }: { value: number; label?: string }) {
  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-[13px] text-ink-mute">
          <span>{label}</span>
          <span className="mono text-ink">{Math.round(value * 100)}%</span>
        </div>
      )}
      <div className="meter">
        <span style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%` }} />
      </div>
    </div>
  );
}
