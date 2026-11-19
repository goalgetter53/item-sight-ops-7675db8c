import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { NumPad } from "@/components/ui/NumPad";
import { ArrowLeft, Check, ChevronRight, Mic, MicOff } from "lucide-react";
import { DiscountStep, QuantityStep, type DiscountMode } from "@/components/erp/WizardSteps";
import { useRootNodeId, useChildren, type InvNode } from "@/lib/inventoryNodes";
import { useAllHardwareLeaves } from "@/hooks/useAllHardwareLeaves";
import { findTopMatches, type HardwareLeaf } from "@/lib/hinglish-match";

type Added = { name: string; amount: number; qty: number };

const ACCENT = "#4f46e5";

function effectiveAmount(amount: number, mode: DiscountMode, disc: number): number {
  if (disc <= 0) return amount;
  return Math.max(0, mode === "pct" ? amount * (1 - disc / 100) : amount - disc);
}

// ── Voice search hook ──────────────────────────────────────────────────────────
function useVoiceSearch(
  active: boolean,
  onResult: (transcript: string) => void,
) {
  const [transcript, setTranscript] = useState("");
  const [listening, setListening] = useState(false);
  const recogRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!active) {
      recogRef.current?.stop();
      recogRef.current = null;
      setTranscript("");
      setListening(false);
      return;
    }
    const SR = (window as unknown as { SpeechRecognition?: typeof SpeechRecognition; webkitSpeechRecognition?: typeof SpeechRecognition }).SpeechRecognition
      ?? (window as unknown as { webkitSpeechRecognition?: typeof SpeechRecognition }).webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setTranscript(full);
      if (e.results[e.results.length - 1].isFinal) onResult(full);
    };
    recogRef.current = r;
    r.start();
    return () => { r.stop(); };
  }, [active]);

  const restart = () => {
    recogRef.current?.stop();
    setTranscript("");
    setTimeout(() => recogRef.current?.start(), 200);
  };

  return { transcript, listening, restart };
}

export function HardwareWizardDialog({
  open,
  onOpenChange,
  onAdd,
  initialPath,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAdd: (item: Added) => void;
  initialPath?: InvNode[];
}) {
  const [path, setPath] = useState<InvNode[]>([]);
  const [phase, setPhase] = useState<"voice" | "browse" | "matches" | "dims" | "amount" | "qty" | "disc">("voice");
  const [matches, setMatches] = useState<Array<HardwareLeaf & { score: number }>>([]);
  const [length, setLength] = useState("");
  const [breadth, setBreadth] = useState("");
  const [amount, setAmount] = useState("");
  const [qty, setQty] = useState("1");
  const [discMode, setDiscMode] = useState<DiscountMode>("pct");
  const [disc, setDisc] = useState("");

  const { data: leaves = [] } = useAllHardwareLeaves();
  const { data: hwRoot } = useRootNodeId("HARDWARE");
  const parentId = path.length ? path[path.length - 1].id : hwRoot;
  const { data: children = [], isLoading } = useChildren(parentId);

  const pickLeaf = (leaf: HardwareLeaf) => {
    setPath(leaf.path);
    setPhase("dims");
    setMatches([]);
  };

  const handleVoiceResult = (text: string) => {
    if (!text.trim() || leaves.length === 0) return;
    const top = findTopMatches(text, leaves, 5);
    if (top.length === 0) return;
    if (top.length === 1) { pickLeaf(top[0]); return; }
    setMatches(top);
    setPhase("matches");
  };

  const voiceActive = open && phase === "voice";
  const { transcript, listening, restart } = useVoiceSearch(voiceActive, handleVoiceResult);

  const reset = () => {
    if (initialPath?.length) {
      setPath(initialPath); setPhase("dims");
    } else {
      setPath([]); setPhase("voice");
    }
    setMatches([]);
    setLength(""); setBreadth(""); setAmount(""); setQty("1"); setDiscMode("pct"); setDisc("");
  };
  const close = () => { onOpenChange(false); reset(); };

  useEffect(() => { if (open) reset(); }, [open]);

  const amountN = Number(amount) || 0;
  const qtyN = Math.max(1, Number(qty) || 1);
  const discN = Number(disc) || 0;
  const amountEff = effectiveAmount(amountN, discMode, discN);
  const net = qtyN * amountEff;

  const pick = (n: InvNode) => setPath((p) => [...p, n]);
  const back = () => {
    if (phase === "matches") { setPhase("voice"); return; }
    if (phase === "browse" && path.length === 0) { setPhase("voice"); return; }
    if (phase === "dims") { setPath((p) => p.slice(0, -1)); setPhase("browse"); return; }
    if (phase === "amount") { setPhase("dims"); return; }
    if (phase === "qty") { setPhase("amount"); return; }
    if (phase === "disc") { setPhase("qty"); return; }
    setPath((p) => p.slice(0, -1));
  };

  useEffect(() => {
    if (phase === "browse" && path.length > 0 && !isLoading && children.length === 0) setPhase("dims");
  }, [phase, path.length, isLoading, children.length]);

  const dimsSuffix = (() => {
    const l = length.trim(), b = breadth.trim();
    if (l && b) return ` ${l}×${b}`;
    if (l) return ` ${l}`;
    return "";
  })();
  const leafName = path.length ? path.map((p) => p.name).join(" / ") : "";
  const displayName = `${leafName}${dimsSuffix}`;

  const title =
    phase === "voice" ? "Speak hardware name" :
    phase === "matches" ? "Select item" :
    phase === "dims" ? "Length & Breadth" :
    phase === "amount" ? "Enter amount" :
    phase === "qty" ? "Quantity" :
    phase === "disc" ? "Discount" :
    path.length ? path[path.length - 1].name : "Choose hardware";

  const canGoBack = phase !== "voice";

  const addToCart = () => {
    if (amountN <= 0) return;
    onAdd({ name: `${displayName} (HARDWARE)`, amount: amountEff, qty: qtyN });
    close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent
        style={{ ["--accent" as string]: ACCENT }}
        className="flex max-h-[90vh] w-[calc(100vw-1rem)] max-w-md flex-col gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-lg"
      >
        {/* Header */}
        <div className="shrink-0 px-5 pt-5 pb-4">
          <div className="flex items-center gap-2">
            {canGoBack ? (
              <button type="button" aria-label="Back" onClick={back}
                className="-ml-1 rounded-full p-1.5 text-slate-500 hover:bg-slate-100 active:scale-95">
                <ArrowLeft className="h-5 w-5" />
              </button>
            ) : (
              <span className="grid h-8 w-8 place-items-center rounded-full text-sm font-extrabold text-white" style={{ backgroundColor: ACCENT }}>H</span>
            )}
            <DialogTitle className="text-lg font-extrabold tracking-tight text-slate-900">{title}</DialogTitle>
          </div>
          {path.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-1 text-xs">
              {path.map((p, i) => (
                <span key={p.id} className="flex items-center gap-1">
                  {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300" />}
                  <span className="rounded-full bg-[#eef2ff] px-2 py-0.5 font-semibold text-[color:var(--accent)]">{p.name}</span>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-[#f6f7fe] px-5 py-5">

          {/* ── Voice phase ── */}
          {phase === "voice" && (
            <div className="flex flex-col items-center gap-6 py-4">
              {/* Mic button with pulse ring */}
              <div className="relative">
                {listening && (
                  <span className="absolute inset-0 animate-ping rounded-full opacity-30" style={{ backgroundColor: ACCENT }} />
                )}
                <button
                  type="button"
                  onClick={restart}
                  aria-label={listening ? "Listening…" : "Start listening"}
                  className="relative grid h-24 w-24 place-items-center rounded-full shadow-lg transition-transform active:scale-95"
                  style={{ backgroundColor: ACCENT }}
                >
                  {listening
                    ? <Mic className="h-10 w-10 text-white" />
                    : <MicOff className="h-10 w-10 text-white opacity-70" />}
                </button>
              </div>

              {/* Live transcript */}
              <div className="min-h-[3rem] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-center text-base font-semibold text-slate-700 shadow-sm">
                {transcript
                  ? transcript
                  : <span className="text-slate-400 font-normal text-sm">Bol dо — hardware ka naam…</span>}
              </div>

              {/* Manual browse fallback */}
              <button type="button" onClick={() => setPhase("browse")}
                className="text-sm text-slate-400 hover:text-slate-600">
                Browse manually instead
              </button>
            </div>
          )}

          {/* ── Matches phase ── */}
          {phase === "matches" && (
            <div className="space-y-3">
              {matches.map((m, i) => (
                <button key={i} type="button" onClick={() => pickLeaf(m)}
                  className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-[color:var(--accent)]">
                  <div>
                    <p className="font-bold text-slate-800 text-sm">{m.path.map((p) => p.name).join(" / ")}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{Math.round(m.score * 100)}% match</p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* ── Browse phase ── */}
          {phase === "browse" && (
            <div className="grid grid-cols-2 gap-3">
              {isLoading ? (
                <p className="col-span-2 py-6 text-center text-sm text-slate-400">Loading…</p>
              ) : children.length === 0 ? (
                <p className="col-span-2 py-6 text-center text-sm text-slate-400">Nothing here — add items in Inventory 2 → HARDWARE.</p>
              ) : children.map((n) => (
                <button key={n.id} type="button" onClick={() => pick(n)}
                  className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-5 text-left text-base font-bold text-slate-700 shadow-sm transition-all min-h-[64px] active:scale-[0.97] hover:border-[color:var(--accent)] hover:text-[color:var(--accent)]">
                  <span className="truncate">{n.name}</span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
                </button>
              ))}
            </div>
          )}

          {/* ── Dims phase ── */}
          {phase === "dims" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{leafName}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Length</span>
                  <input type="text" inputMode="decimal" autoFocus value={length}
                    onChange={(e) => setLength(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setPhase("amount"); }}
                    placeholder='e.g. 4"'
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 focus:border-[color:var(--accent)] focus:outline-none" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-semibold text-slate-700">Breadth</span>
                  <input type="text" inputMode="decimal" value={breadth}
                    onChange={(e) => setBreadth(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setPhase("amount"); }}
                    placeholder='e.g. 3"'
                    className="w-full rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-lg font-bold text-slate-900 focus:border-[color:var(--accent)] focus:outline-none" />
                </label>
              </div>
              <Button type="button" className="h-14 w-full rounded-2xl text-base font-bold text-white"
                style={{ backgroundColor: ACCENT }} onClick={() => setPhase("amount")}>
                Next
              </Button>
              <button type="button" onClick={() => setPhase("amount")}
                className="w-full text-center text-sm text-slate-400 hover:text-slate-600">
                Skip (no dimensions)
              </button>
            </div>
          )}

          {/* ── Amount phase ── */}
          {phase === "amount" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm font-bold text-slate-800">{displayName}</p>
              </div>
              <NumPad
                value={amount}
                onChange={setAmount}
                onDone={() => { if (amountN > 0) setPhase("qty"); }}
                prefix="₹"
                label="per piece"
                decimal
                accent={ACCENT}
              />
            </div>
          )}

          {phase === "qty" && (
            <QuantityStep accent={ACCENT} perUnitLabel="Per piece" perUnit={amountN} qty={qty} setQty={setQty} onNext={() => setPhase("disc")} />
          )}

          {phase === "disc" && (
            <DiscountStep accent={ACCENT} gross={qtyN * amountN} net={net} qty={qtyN}
              mode={discMode} setMode={setDiscMode} value={disc} setValue={setDisc} />
          )}
        </div>

        {/* Footer */}
        {phase === "disc" && (
          <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4">
            <Button type="button" className="h-14 w-full rounded-2xl text-base font-bold text-white shadow-sm disabled:opacity-40"
              style={{ backgroundColor: ACCENT }} disabled={!(amountN > 0)} onClick={addToCart}>
              <Check className="mr-1.5 h-5 w-5" /> Add to cart
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
