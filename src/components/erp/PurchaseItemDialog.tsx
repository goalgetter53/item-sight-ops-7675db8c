import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Check, ChevronRight } from "lucide-react";
import { useRootNodeId, useChildren, type InvNode } from "@/lib/inventoryNodes";
import type { ComboCategory } from "@/lib/comboStock";
import { inr } from "@/lib/codes";

const ACCENT: Record<ComboCategory, string> = { PLY: "#b26a2b", MICA: "#0f766e", HARDWARE: "#4f46e5" };

export type PurchaseItem = { name: string; category: ComboCategory; qty: number; rate: number };

function buildName(category: ComboCategory, path: InvNode[], micaNo: string, dims?: string): string {
  const labels = path.map((p) => p.name);
  if (category === "PLY") return `PLY — ${labels.join(" — ")}`;
  if (category === "MICA") return `${micaNo.trim()} (${labels[labels.length - 1] ?? ""})`;
  const base = labels.join(" / ");
  return dims ? `${base} ${dims} (HARDWARE)` : `${base} (HARDWARE)`;
}

/**
 * Purchase item picker: drill the category tree to a leaf, then enter quantity
 * and rate (no discount). MICA asks a free-text mica number after the category.
 */
export function PurchaseItemDialog({
  category,
  open,
  onOpenChange,
  onAdd,
  initialPath,
}: {
  category: ComboCategory | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (item: PurchaseItem) => void;
  initialPath?: InvNode[];
}) {
  const [path, setPath] = useState<InvNode[]>([]);
  const [phase, setPhase] = useState<"browse" | "mica" | "dims" | "entry">("browse");
  const [micaNo, setMicaNo] = useState("");
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [qty, setQty] = useState("1");
  const [rate, setRate] = useState("");

  const cat = category ?? "HARDWARE";
  const accent = ACCENT[cat];
  const { data: rootId } = useRootNodeId(cat);
  const parentId = path.length ? path[path.length - 1].id : rootId;
  const { data: children = [], isLoading } = useChildren(parentId);

  const reset = () => {
    if (initialPath?.length && (category ?? "HARDWARE") === "HARDWARE") {
      setPath(initialPath); setPhase("dims");
    } else {
      setPath([]); setPhase("browse");
    }
    setMicaNo(""); setLength(""); setBreadth(""); setQty("1"); setRate("");
  };
  const close = () => { onOpenChange(false); reset(); };
  useEffect(() => { if (open) reset(); }, [open, category, initialPath]);

  useEffect(() => {
    if (phase === "browse" && path.length > 0 && !isLoading && children.length === 0) {
      setPhase(cat === "MICA" ? "mica" : "dims");
    }
  }, [phase, path.length, isLoading, children.length, cat]);

  const qtyN = Math.max(1, Number(qty) || 1);
  const rateN = Number(rate) || 0;
  const lineTotal = qtyN * rateN;
  const dimsSuffix = (() => {
    const l = length.trim(), b = breadth.trim();
    if (l && b) return `${l}×${b}`;
    if (l) return l;
    return "";
  })();
  const name = useMemo(
    () => buildName(cat, path, micaNo, dimsSuffix || undefined),
    [cat, path, micaNo, dimsSuffix]
  );

  const back = () => {
    if (phase === "entry" && cat === "MICA") { setPhase("mica"); return; }
    if (phase === "entry") { setPhase("dims"); return; }
    if (phase === "dims") { setPath((p) => p.slice(0, -1)); setPhase("browse"); return; }
    if (phase === "mica") { setPath((p) => p.slice(0, -1)); setPhase("browse"); return; }
    setPath((p) => p.slice(0, -1));
  };
  const canBack = phase !== "browse" || path.length > 0;

  const add = () => {
    if (rateN <= 0) return;
    if (cat === "MICA" && !micaNo.trim()) return;
    onAdd({ name, category: cat, qty: qtyN, rate: rateN });
    if (cat === "PLY") {
      // After saving PLY, go back to brand chooser (keep size, clear brand)
      setPath((p) => p.slice(0, -1));
      setPhase("browse");
      setQty("1");
      setRate("");
    } else {
      close();
    }
  };

  const title =
    phase === "dims" ? "Length & Breadth" :
    phase === "entry" ? "Quantity & rate" :
    phase === "mica" ? "Mica number" :
    path.length ? path[path.length - 1].name : `Choose ${cat.toLowerCase()}`;

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent style={{ ["--accent" as string]: accent }}
        className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-md flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg">
        <div className="shrink-0 px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            {canBack ? (
              <button type="button" aria-label="Back" onClick={back}
                className="-ml-1 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 active:scale-95">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: accent }}>
                {cat[0]}
              </span>
            )}
            <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900">{title}</DialogTitle>
          </div>
          {path.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
              {path.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                  <span className="rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 font-semibold text-[color:var(--accent)]">{p.name}</span>
                </span>
              ))}
              {micaNo.trim() && <span className="rounded-full bg-[color:var(--accent)]/10 px-2 py-0.5 font-semibold text-[color:var(--accent)]">{micaNo.trim()}</span>}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto bg-[#f6f7f8] px-5 py-5">
          {phase === "browse" && (
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                <p className="col-span-2 py-6 text-center text-sm text-slate-400">Loading…</p>
              ) : children.length === 0 ? (
                <p className="col-span-2 py-6 text-center text-sm text-slate-400">Nothing here — add items in Inventory 2 → {cat}.</p>
              ) : children.map((n) => (
                <button key={n.id} type="button" onClick={() => setPath((p) => [...p, n])}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left text-base font-bold text-slate-700 shadow-sm transition-all min-h-[64px] active:scale-[0.97] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  <span className="truncate">{n.name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {phase === "dims" && cat === "HARDWARE" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{path.map((p) => p.name).join(" / ")}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Length</span>
                  <input type="text" inputMode="decimal" autoFocus value={length}
                    onChange={(e) => setLength(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setPhase("entry"); }}
                    placeholder='e.g. 4"'
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 focus:border-[color:var(--accent)] focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Breadth</span>
                  <input type="text" inputMode="decimal" value={breadth}
                    onChange={(e) => setBreadth(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setPhase("entry"); }}
                    placeholder='e.g. 3"'
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 focus:border-[color:var(--accent)] focus:outline-none" />
                </label>
              </div>
              <Button type="button" className="h-14 w-full rounded-2xl text-base font-bold text-white"
                style={{ backgroundColor: accent }} onClick={() => setPhase("entry")}>
                Next
              </Button>
              <button type="button" onClick={() => setPhase("entry")}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600">
                Skip (no dimensions)
              </button>
            </div>
          )}

          {phase === "mica" && (
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Mica number</span>
                <input type="text" autoFocus value={micaNo}
                  onChange={(e) => setMicaNo(e.target.value.toUpperCase())}
                  onKeyDown={(e) => { if (e.key === "Enter" && micaNo.trim()) setPhase("entry"); }}
                  placeholder="e.g. SS-01-5253"
                  className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold uppercase tracking-wide text-slate-900 focus:border-[color:var(--accent)] focus:outline-none" />
              </label>
              <Button type="button" className="h-14 w-full rounded-2xl text-base font-bold text-white disabled:opacity-40"
                style={{ backgroundColor: accent }} disabled={!micaNo.trim()} onClick={() => setPhase("entry")}>
                Next
              </Button>
            </div>
          )}

          {phase === "entry" && (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{name}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Quantity</span>
                  <Input type="number" inputMode="numeric" min={1} autoFocus value={qty}
                    onChange={(e) => setQty(e.target.value)} placeholder="1" className="h-12 text-lg font-bold" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Rate (per piece)</span>
                  <Input type="number" inputMode="numeric" min={0} value={rate}
                    onChange={(e) => setRate(e.target.value)} placeholder="0" className="h-12 text-lg font-bold" />
                </label>
              </div>
              <div className="flex items-baseline justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: `${accent}14` }}>
                <span className="text-sm font-semibold text-slate-600">Line total</span>
                <span className="text-2xl font-extrabold tabular-nums" style={{ color: accent }}>{inr(lineTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {phase === "entry" && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
            <Button type="button" className="h-14 w-full rounded-2xl text-base font-bold text-white shadow-sm disabled:opacity-40"
              style={{ backgroundColor: accent }} disabled={!(rateN > 0)} onClick={add}>
              <Check className="mr-1.5 h-5 w-5" /> Add item
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
