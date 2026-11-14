type DocProps = {
  className?: string;
  style?: React.CSSProperties;
  number: string;
  client: string;
  item: string;
  amount: string;
  due: string;
  stamp: string;
  stampTone: "paid" | "overdue" | "none";
  lines: string[];
};

function Doc({
  className = "",
  style,
  number,
  client,
  item,
  amount,
  due,
  stamp,
  stampTone,
  lines,
}: DocProps) {
  return (
    <div
      className={`doc-shadow absolute border border-rule bg-card ${className}`}
      style={style}
    >
      <div className="flex items-start justify-between border-b border-rule px-5 py-3.5">
        <div>
          <p className="font-mono text-[8px] uppercase tracking-[0.2em] text-muted">
            Invoice
          </p>
          <p className="mt-1 font-mono text-[12px] font-medium tabular-nums text-ink">
            {number}
          </p>
        </div>
        <div className="flex gap-[3px] pt-1">
          <span className="h-[3px] w-[3px] bg-ink" />
          <span className="h-[3px] w-[3px] bg-ink" />
          <span className="h-[3px] w-[3px] bg-ink" />
        </div>
      </div>

      <div className="px-5 py-3.5">
        <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
          Billed to
        </p>
        <p className="mt-1 text-[13px] font-medium text-ink">{client}</p>

        <div className="mt-3 border-t border-rule pt-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-[12px] text-ink-soft">{item}</span>
            <span className="font-mono text-[12px] tabular-nums text-ink">{amount}</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between gap-3">
            <span className="text-[11px] text-muted">Due {due}</span>
            <span className="font-mono text-[11px] tabular-nums text-muted">INR</span>
          </div>
        </div>

        <div className="mt-3 flex items-end justify-between border-t border-rule pt-3">
          <div>
            <p className="font-mono text-[8px] uppercase tracking-[0.18em] text-muted">
              Total
            </p>
            <p className="mt-0.5 font-mono text-[18px] font-medium tabular-nums text-ink">
              {amount}
            </p>
          </div>
          <div className="hidden gap-[3px] pb-1 sm:flex">
            {lines.map((l, i) => (
              <span key={`${l}-${i}`} className="font-mono text-[8px] tabular-nums text-rule">
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {stampTone !== "none" && (
        <div
          className={`absolute -right-2 bottom-7 rotate-[-9deg] border-2 px-2 py-1 font-mono text-[9px] font-semibold uppercase tracking-[0.22em] ${
            stampTone === "paid"
              ? "border-accent text-accent"
              : "border-stamp text-stamp"
          }`}
        >
          {stamp}
        </div>
      )}
    </div>
  );
}

export default function HeroStack() {
  return (
    <div
      className="scene relative mx-auto w-full max-w-[600px] select-none"
      aria-hidden="true"
    >
      <div className="scene-plane relative mx-auto aspect-[5/4] w-full">
        <Doc
          className="left-[0%] top-[2%] w-[72%] opacity-80"
          style={{ transform: "translate3d(-18%, -10%, -90px) rotate(-7deg)" }}
          number="INV-202610-1003"
          client="Harbor & Pine"
          item="Logo package"
          amount="₹9,400.00"
          due="15 Oct"
          stamp="Paid"
          stampTone="paid"
          lines={["01", "02"]}
        />

        <Doc
          className="left-[20%] top-[14%] w-[74%]"
          style={{ transform: "translate3d(6%, 0, -30px) rotate(4deg)" }}
          number="INV-202611-1002"
          client="Kestrel Labs"
          item="Monthly retainer"
          amount="₹30,800.00"
          due="28 Nov"
          stamp=""
          stampTone="none"
          lines={["01"]}
        />

        <Doc
          className="left-[0%] top-[34%] w-[76%]"
          style={{ transform: "translate3d(2%, 2%, 55px) rotate(-1.5deg)" }}
          number="INV-202611-1001"
          client="Harbor & Pine"
          item="Website redesign"
          amount="₹12,000.00"
          due="3 Nov"
          stamp="Overdue"
          stampTone="overdue"
          lines={["01", "02"]}
        />
      </div>
    </div>
  );
}
