import { Boxes, FolderOpen } from "lucide-react";
import { stockUnder, classifyCombo, type ComboStockRow, type ComboCategory } from "@/lib/comboStock";

type Crumb = { id: string | null; name: string };
const COMBO: ComboCategory[] = ["PLY", "MICA", "HARDWARE"];
const isComboCat = (c?: string): c is ComboCategory => !!c && COMBO.includes(c as ComboCategory);

function catAndLabels(path: Crumb[], nodeName: string): { cat?: string; labels: string[] } {
  if (path.length === 1) return { cat: nodeName, labels: [] };
  return { cat: path[1]?.name, labels: [...path.slice(2).map((p) => p.name), nodeName] };
}

// Stock qty badge for a drill tile.
export function StockBadge({ comboStock, path, nodeName }: { comboStock: ComboStockRow[]; path: Crumb[]; nodeName: string }) {
  const { cat, labels } = catAndLabels(path, nodeName);
  if (!isComboCat(cat)) return null;
  const qty = stockUnder(comboStock, cat, labels);
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-bold ${qty > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}>
      <Boxes className="h-3 w-3" /> {qty}
    </span>
  );
}

// Empty-state detail: MICA shows per-mica-number stock; PLY/HARDWARE leaf shows the total.
export function StockDetail({ comboStock, path }: { comboStock: ComboStockRow[]; path: Crumb[] }) {
  const rootCat = path[1]?.name;
  const curLabels = path.slice(2).map((p) => p.name);

  if (rootCat === "MICA") {
    const micaCat = path[path.length - 1]?.name;
    const items = comboStock
      .map((r) => ({ c: classifyCombo(r.name), name: r.name, qty: r.qty }))
      .filter((x) => x.c?.cat === "MICA" && x.c.below[0] === micaCat)
      .map((x) => ({ num: x.name.replace(/\s*\([^)]*\)\s*$/, "").trim(), qty: x.qty }))
      .sort((a, b) => a.num.localeCompare(b.num));
    if (items.length === 0) {
      return <div className="mt-3 flex items-center gap-2 text-sm text-slate-400"><Boxes className="h-4 w-4" /> No stock yet for {micaCat}.</div>;
    }
    return (
      <div className="mt-3 overflow-hidden rounded-2xl border border-[#e8ecf1] bg-white shadow-sm">
        <div className="border-b bg-slate-50 px-4 py-2 text-[11px] font-bold uppercase tracking-wide text-slate-500">{micaCat} — stock by mica number</div>
        {items.map((it) => (
          <div key={it.num} className="flex items-center justify-between border-b border-slate-50 px-4 py-2.5 text-sm last:border-0">
            <span className="font-medium text-slate-700">{it.num}</span>
            <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${it.qty > 0 ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-400"}`}><Boxes className="h-3 w-3" /> {it.qty}</span>
          </div>
        ))}
      </div>
    );
  }

  if (isComboCat(rootCat)) {
    const qty = stockUnder(comboStock, rootCat, curLabels);
    return <div className="mt-3 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2 text-sm font-bold text-emerald-700"><Boxes className="h-4 w-4" /> In stock: {qty}</div>;
  }

  return <div className="mt-3 flex items-center gap-2 text-sm text-slate-400"><FolderOpen className="h-4 w-4" /> Nothing here yet — tap Add to create one.</div>;
}
