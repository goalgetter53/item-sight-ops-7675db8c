import { Button } from "@/components/ui/button";
import { NumPad } from "@/components/ui/NumPad";
import { inr } from "@/lib/codes";

export type DiscountMode = "pct" | "pp";

/** Quantity (pieces) step shared by the PLY/MICA wizards. */
export function QuantityStep({
  accent,
  perUnitLabel,
  perUnit,
  qty,
  setQty,
  onNext,
}: {
  accent: string;
  perUnitLabel: string;
  perUnit: number;
  qty: string;
  setQty: (v: string) => void;
  onNext: () => void;
}) {
  const qtyN = Math.max(1, Number(qty) || 1);
  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
        <span className="text-sm font-semibold text-slate-600">{perUnitLabel}</span>
        <span className="text-base font-bold tabular-nums text-slate-800">{inr(perUnit)}</span>
      </div>

      <NumPad
        value={qty}
        onChange={setQty}
        onDone={onNext}
        label="pieces"
        decimal={false}
        accent={accent}
      />

      <div className="flex items-baseline justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: `${accent}14` }}>
        <span className="text-sm font-semibold text-slate-600">Line total</span>
        <span className="text-2xl font-extrabold tabular-nums" style={{ color: accent }}>{inr(qtyN * perUnit)}</span>
      </div>
    </div>
  );
}

/** Discount step shared by the PLY/MICA wizards. */
export function DiscountStep({
  accent,
  gross,
  net,
  qty,
  mode,
  setMode,
  value,
  setValue,
}: {
  accent: string;
  gross: number;
  net: number;
  qty: number;
  mode: DiscountMode;
  setMode: (m: DiscountMode) => void;
  value: string;
  setValue: (v: string) => void;
}) {
  const tab = (m: DiscountMode, label: string) => (
    <button
      type="button"
      onClick={() => { setMode(m); setValue(""); }}
      className="flex-1 rounded-xl px-3 py-2 text-sm font-bold transition-colors"
      style={mode === m ? { backgroundColor: accent, color: "#fff" } : { color: "#64748b" }}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-5">
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-white p-1">
        {tab("pct", "Total %")}
        {tab("pp", "Per piece ₹")}
      </div>

      <NumPad
        value={value}
        onChange={setValue}
        onDone={() => {/* parent decides when to advance */}}
        label={mode === "pct" ? "%" : "₹/pc"}
        prefix={mode === "pct" ? "%" : "₹"}
        decimal
        accent={accent}
      />

      <div className="space-y-1.5 rounded-2xl px-4 py-3" style={{ backgroundColor: `${accent}14` }}>
        <Row label={`Gross (${qty} pcs)`} value={inr(gross)} />
        <Row label="Discount" value={`- ${inr(Math.max(0, gross - net))}`} />
        <div className="my-1 h-px bg-slate-200" />
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-bold text-slate-700">Net</span>
          <span className="text-2xl font-extrabold tabular-nums" style={{ color: accent }}>{inr(net)}</span>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between text-sm">
      <span className="font-semibold text-slate-500">{label}</span>
      <span className="font-bold tabular-nums text-slate-700">{value}</span>
    </div>
  );
}
