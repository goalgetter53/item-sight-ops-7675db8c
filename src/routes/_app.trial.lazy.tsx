import { createLazyFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, RotateCcw, Trash2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NumPad } from "@/components/ui/NumPad";
import { useAllLeaves, type AnyLeaf, type CategoryKey } from "@/hooks/useAllLeaves";
import { findTopMatches } from "@/lib/hinglish-match";
import { parseSentence, stripFillers } from "@/lib/sentenceParser";

export const Route = createLazyFileRoute("/_app/trial")({
  component: TrialPage,
});

// ── Shared helpers ──────────────────────────────────────────────────────────

type MatchResult = AnyLeaf & { score: number };

const CAT_COLOR: Record<CategoryKey, string> = {
  PLY: "#b26a2b",
  MICA: "#0f766e",
  HARDWARE: "#4f46e5",
  DOOR: "#0369a1",
};
const CAT_LABEL: Record<CategoryKey, string> = {
  PLY: "Ply",
  MICA: "Mica",
  HARDWARE: "Hardware",
  DOOR: "Door",
};

function CategoryBadge({ cat }: { cat: CategoryKey }) {
  return (
    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold text-white"
      style={{ backgroundColor: CAT_COLOR[cat] }}>
      {CAT_LABEL[cat]}
    </span>
  );
}

// ── Voice hook ──────────────────────────────────────────────────────────────

type VoiceMode = "idle" | "listening" | "done";

function useVoice(onFinal: (text: string) => void, silenceMs = 1800) {
  const [mode, setMode] = useState<VoiceMode>("idle");
  const [interim, setInterim] = useState("");
  const recogRef = useRef<SpeechRecognition | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const getSR = () => {
    const w = window as unknown as Record<string, typeof SpeechRecognition | undefined>;
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  };

  const start = () => {
    const SR = getSR();
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }
    const r = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = true;
    recogRef.current = r;

    r.onstart = () => { setMode("listening"); setInterim(""); };
    r.onend = () => setMode("done");

    r.onresult = (e) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      const cleaned = stripFillers(full);
      setInterim(cleaned);

      // Reset silence timer on every new speech event
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        r.stop();
        onFinal(cleaned);
      }, silenceMs);
    };

    r.start();
  };

  const stop = () => { clearTimeout(timerRef.current); recogRef.current?.stop(); };
  const reset = () => { stop(); setMode("idle"); setInterim(""); };

  useEffect(() => () => stop(), []);

  return { mode, interim, start, stop, reset };
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROACH A — Full sentence, one shot
// ═══════════════════════════════════════════════════════════════════════════

type ParsedRow = {
  id: string;
  qty: number;
  itemText: string;
  raw: string;
  match: MatchResult | null;
};

function ApproachA({ leaves }: { leaves: AnyLeaf[] }) {
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [phase, setPhase] = useState<"idle" | "listening" | "review">("idle");

  const onFinal = (text: string) => {
    const parsed = parseSentence(text);
    const result: ParsedRow[] = parsed.map((p, i) => {
      const matches = p.itemText.trim()
        ? findTopMatches(p.itemText, leaves.map((l) => ({ path: l.path, fullName: l.fullName })), 1)
        : [];
      const anyLeafMatch = matches[0]
        ? (leaves.find((l) => l.fullName === matches[0].fullName && l.path[0]?.id === matches[0].path[0]?.id) ?? null)
        : null;
      return {
        id: String(i),
        qty: p.qty,
        itemText: p.itemText,
        raw: p.raw,
        match: anyLeafMatch ? { ...anyLeafMatch, score: matches[0]?.score ?? 0 } : null,
      };
    });
    setRows(result);
    setPhase("review");
  };

  const { mode, interim, start, reset } = useVoice(onFinal, 1800);

  const startListening = () => { reset(); setRows([]); setPhase("listening"); start(); };
  const tryAgain = () => { reset(); setRows([]); setPhase("idle"); };

  const removeRow = (id: string) => setRows((r) => r.filter((x) => x.id !== id));

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-indigo-50 p-4 text-sm text-indigo-800 leading-relaxed">
        <strong>How to use:</strong> Press mic → say everything in one sentence like<br />
        <em>"teen BWR ply, do mica SS-01, char keel"</em><br />
        Wait 1–2 seconds after speaking — it will auto-parse.
      </div>

      {/* Mic */}
      {phase !== "review" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            {mode === "listening" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-indigo-400 opacity-30" />
            )}
            <button
              type="button"
              onClick={mode === "listening" ? undefined : startListening}
              className="relative grid h-28 w-28 place-items-center rounded-full shadow-xl transition-transform active:scale-95"
              style={{ backgroundColor: mode === "listening" ? "#4f46e5" : "#6366f1" }}
            >
              {mode === "listening"
                ? <Mic className="h-12 w-12 text-white" />
                : <MicOff className="h-12 w-12 text-white opacity-70" />}
            </button>
          </div>

          {/* Live transcript */}
          <div className="min-h-[3.5rem] w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm">
            {interim
              ? <p className="text-base font-semibold text-slate-800">{interim}</p>
              : mode === "listening"
                ? <p className="text-sm text-slate-400">Listening… bolo</p>
                : <p className="text-sm text-slate-400">Mic band hai — press karein</p>}
          </div>

          {mode === "listening" && (
            <p className="text-xs text-slate-400">
              Ruko 2 second bolne ke baad — auto-parse ho jayega
            </p>
          )}
        </div>
      )}

      {/* Review table */}
      {phase === "review" && rows.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-slate-600">{rows.length} item{rows.length > 1 ? "s" : ""} mila</p>
          {rows.map((row) => (
            <div key={row.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex-1 min-w-0 space-y-1">
                {/* Matched item */}
                {row.match ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryBadge cat={row.match.category} />
                    <span className="font-bold text-slate-800 text-sm">
                      {row.match.path.map((p) => p.name).join(" / ")}
                    </span>
                    <span className="text-xs text-slate-400">{Math.round(row.match.score * 100)}% match</span>
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-red-500">No match — "{row.itemText}"</p>
                )}
                <p className="text-xs text-slate-500">
                  Qty: <strong>{row.qty}</strong> · heard: "{row.raw}"
                </p>
              </div>
              <button type="button" onClick={() => removeRow(row.id)}
                className="shrink-0 rounded-full p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}

          <div className="flex gap-3 pt-2">
            <Button variant="outline" className="flex-1" onClick={tryAgain}>
              <RotateCcw className="mr-1.5 h-4 w-4" /> Try again
            </Button>
            <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={tryAgain}>
              ✓ Confirm ({rows.filter((r) => r.match).length} items)
            </Button>
          </div>
        </div>
      )}

      {phase === "review" && rows.length === 0 && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm text-red-700 text-center">
          Kuch nahi mila. Dobara try karein.
          <br />
          <button type="button" className="mt-2 font-bold underline" onClick={tryAgain}>Try again</button>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// APPROACH B — One item at a time
// ═══════════════════════════════════════════════════════════════════════════

type CartItem = {
  id: string;
  leaf: AnyLeaf;
  qty: number;
  rate: number;
};

type BPhase = "voice" | "matches" | "rate";

function ApproachB({ leaves }: { leaves: AnyLeaf[] }) {
  const [bPhase, setBPhase] = useState<BPhase>("voice");
  const [matches, setMatches] = useState<MatchResult[]>([]);
  const [chosen, setChosen] = useState<AnyLeaf | null>(null);
  const [rate, setRate] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);

  const accent = chosen ? CAT_COLOR[chosen.category] : "#4f46e5";

  const onFinal = (text: string) => {
    if (!text.trim()) return;
    const top = findTopMatches(text, leaves.map((l) => ({ path: l.path, fullName: l.fullName })), 6);
    if (top.length === 0) return;

    // Enrich with category
    const enriched: MatchResult[] = top.map((m) => {
      const leaf = leaves.find((l) => l.fullName === m.fullName && l.path[0]?.id === m.path[0]?.id);
      return { ...(leaf ?? { path: m.path, fullName: m.fullName, category: "HARDWARE" as CategoryKey }), score: m.score };
    });

    if (enriched.length === 1) {
      setChosen(enriched[0]);
      setRate("");
      setBPhase("rate");
    } else {
      setMatches(enriched);
      setBPhase("matches");
    }
  };

  const { mode, interim, start, reset } = useVoice(onFinal, 1200);

  const startListening = () => { reset(); setBPhase("voice"); start(); };

  const pickMatch = (m: MatchResult) => {
    setChosen(m);
    setRate("");
    setBPhase("rate");
    reset();
  };

  const addToCart = () => {
    if (!chosen) return;
    const rateN = Number(rate) || 0;
    setCart((c) => [...c, { id: crypto.randomUUID(), leaf: chosen, qty: 1, rate: rateN }]);
    setChosen(null);
    setRate("");
    reset();
    setBPhase("voice");
  };

  const removeFromCart = (id: string) => setCart((c) => c.filter((x) => x.id !== id));

  const total = cart.reduce((s, x) => s + x.qty * x.rate, 0);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl bg-teal-50 p-4 text-sm text-teal-800 leading-relaxed">
        <strong>How to use:</strong> Press mic → say ONE item name → select from list → enter rate → add.
        Repeat for each item.
      </div>

      {/* Voice phase */}
      {bPhase === "voice" && (
        <div className="flex flex-col items-center gap-4 py-4">
          <div className="relative">
            {mode === "listening" && (
              <span className="absolute inset-0 animate-ping rounded-full bg-teal-400 opacity-30" />
            )}
            <button
              type="button"
              onClick={mode === "listening" ? undefined : startListening}
              className="relative grid h-28 w-28 place-items-center rounded-full shadow-xl transition-transform active:scale-95"
              style={{ backgroundColor: mode === "listening" ? "#0d9488" : "#14b8a6" }}
            >
              {mode === "listening"
                ? <Mic className="h-12 w-12 text-white" />
                : <MicOff className="h-12 w-12 text-white opacity-70" />}
            </button>
          </div>

          <div className="min-h-[3.5rem] w-full rounded-2xl border border-slate-200 bg-white px-5 py-3 text-center shadow-sm">
            {interim
              ? <p className="text-base font-semibold text-slate-800">{interim}</p>
              : mode === "listening"
                ? <p className="text-sm text-slate-400">Bol do — ek item ka naam</p>
                : <p className="text-sm text-slate-400">Mic band — press karein</p>}
          </div>
        </div>
      )}

      {/* Matches list */}
      {bPhase === "matches" && (
        <div className="space-y-2">
          <p className="text-sm font-bold text-slate-600">Kaunsa item?</p>
          {matches.map((m, i) => (
            <button key={i} type="button" onClick={() => pickMatch(m)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm transition-all active:scale-[0.98] hover:border-slate-400">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge cat={m.category} />
                <span className="font-bold text-slate-800 text-sm">
                  {m.path.map((p) => p.name).join(" / ")}
                </span>
                <span className="text-xs text-slate-400">{Math.round(m.score * 100)}%</span>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-slate-300" />
            </button>
          ))}
          <button type="button" onClick={startListening}
            className="w-full rounded-2xl border border-dashed border-slate-300 py-3 text-sm text-slate-400 hover:text-slate-600">
            Dobara bolo
          </button>
        </div>
      )}

      {/* Rate entry */}
      {bPhase === "rate" && chosen && (
        <div className="space-y-4">
          <div className="rounded-2xl border p-4 shadow-sm"
            style={{ borderColor: accent, backgroundColor: `${accent}10` }}>
            <div className="flex items-center gap-2">
              <CategoryBadge cat={chosen.category} />
              <span className="font-bold text-slate-800">
                {chosen.path.map((p) => p.name).join(" / ")}
              </span>
            </div>
          </div>

          <NumPad
            value={rate}
            onChange={setRate}
            onDone={addToCart}
            prefix="₹"
            label="rate"
            decimal
            accent={accent}
          />
        </div>
      )}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="space-y-2 border-t border-slate-200 pt-4">
          <p className="text-sm font-bold text-slate-600">Cart ({cart.length} items)</p>
          {cart.map((item) => (
            <div key={item.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 bg-white px-4 py-3">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <CategoryBadge cat={item.leaf.category} />
                <span className="font-semibold text-slate-700 text-sm truncate">
                  {item.leaf.path.map((p) => p.name).join(" / ")}
                </span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-bold tabular-nums text-slate-800">
                  ₹{item.rate}
                </span>
                <button type="button" onClick={() => removeFromCart(item.id)}
                  className="rounded-full p-1 text-slate-400 hover:text-red-500">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
          <div className="flex items-baseline justify-between rounded-xl bg-slate-50 px-4 py-3">
            <span className="font-bold text-slate-600">Total</span>
            <span className="text-xl font-extrabold tabular-nums text-slate-900">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRIAL PAGE
// ═══════════════════════════════════════════════════════════════════════════

function TrialPage() {
  const [tab, setTab] = useState<"A" | "B">("A");
  const { data: leaves = [], isLoading } = useAllLeaves();

  return (
    <div className="mx-auto max-w-lg px-4 py-6">
      <div className="mb-5">
        <h1 className="text-2xl font-extrabold text-slate-900">🧪 Trial: Universal Sales</h1>
        <p className="text-sm text-slate-500 mt-1">
          Test two approaches — {leaves.length} items loaded across all categories
          {isLoading && " (loading…)"}
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1 mb-6">
        {(["A", "B"] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors"
            style={tab === t ? { backgroundColor: t === "A" ? "#4f46e5" : "#0d9488", color: "#fff" } : { color: "#64748b" }}>
            {t === "A" ? "A — Full Sentence" : "B — One by One"}
          </button>
        ))}
      </div>

      {tab === "A" && <ApproachA leaves={leaves} />}
      {tab === "B" && <ApproachB leaves={leaves} />}
    </div>
  );
}
