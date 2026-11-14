const tones: Record<string, string> = {
  draft: "border-rule text-muted",
  sent: "border-rule text-ink-soft",
  viewed: "border-ink/30 text-ink-soft",
  claimed: "border-dashed border-accent/50 text-accent",
  paid: "border-accent text-accent",
  overdue: "border-stamp text-stamp",
  void: "border-rule text-muted line-through",
};

export default function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.14em] ${
        tones[status] ?? "border-rule text-muted"
      }`}
    >
      {status}
    </span>
  );
}
