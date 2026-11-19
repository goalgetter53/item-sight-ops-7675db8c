import { useEffect } from "react";
import { Delete } from "lucide-react";

interface NumPadProps {
  value: string;
  onChange: (v: string) => void;
  onDone: () => void;
  label?: string;
  prefix?: string;   // e.g. "₹"
  decimal?: boolean; // allow decimal point
  accent?: string;
}

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];

export function NumPad({
  value,
  onChange,
  onDone,
  label,
  prefix = "",
  decimal = true,
  accent = "#4f46e5",
}: NumPadProps) {
  const press = (k: string) => {
    if (k === ".") {
      if (!decimal || value.includes(".")) return;
      onChange(value === "" ? "0." : value + ".");
      return;
    }
    if (k === "0" && value === "0") return;
    onChange(value === "0" ? k : value + k);
  };

  const del = () => onChange(value.slice(0, -1));

  // Keyboard support when numpad is mounted
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key >= "0" && e.key <= "9") press(e.key);
      else if (e.key === "." && decimal) press(".");
      else if (e.key === "Backspace") del();
      else if (e.key === "Enter") onDone();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [value]);

  return (
    <div className="flex flex-col gap-3">
      {/* Display */}
      <div className="flex items-baseline gap-2 rounded-2xl border-2 bg-white px-5 py-4"
        style={{ borderColor: accent }}>
        {prefix && <span className="text-2xl font-bold text-slate-400">{prefix}</span>}
        <span className="flex-1 text-3xl font-extrabold tabular-nums text-slate-900 tracking-tight min-h-[2.5rem]">
          {value || <span className="text-slate-300">0</span>}
        </span>
        {label && <span className="text-xs font-semibold text-slate-400 self-end pb-1">{label}</span>}
      </div>

      {/* Grid 3×4 */}
      <div className="grid grid-cols-3 gap-2">
        {KEYS.map((k) => (
          <Key key={k} label={k} onPress={() => press(k)} />
        ))}
        {/* Row 4 */}
        {decimal
          ? <Key label="." onPress={() => press(".")} dim />
          : <span />}
        <Key label="0" onPress={() => press("0")} />
        <Key label={<Delete className="h-5 w-5" />} onPress={del} dim />
      </div>

      {/* Done */}
      <button
        type="button"
        onClick={onDone}
        className="mt-1 h-14 w-full rounded-2xl text-base font-extrabold text-white active:scale-[0.98] transition-transform"
        style={{ backgroundColor: accent }}
      >
        Done ✓
      </button>
    </div>
  );
}

function Key({ label, onPress, dim }: { label: React.ReactNode; onPress: () => void; dim?: boolean }) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`h-14 rounded-2xl text-xl font-bold transition-all active:scale-95 select-none
        ${dim ? "bg-slate-100 text-slate-500" : "bg-white text-slate-800 shadow-sm border border-slate-200"}`}
    >
      {label}
    </button>
  );
}
