import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAllLeaves, type AnyLeaf, type CategoryKey } from "@/hooks/useAllLeaves";
import { useSaveVoiceEntry, useVoiceMap } from "@/hooks/useVoiceMap";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Mic, MicOff, CheckCircle2, RotateCcw, SkipForward, ChevronRight } from "lucide-react";

export const Route = createLazyFileRoute("/_app/calibrate")({
  component: CalibratePage,
});

const CAT_COLOR: Record<CategoryKey, string> = {
  PLY: "bg-amber-100 text-amber-800 border-amber-300",
  MICA: "bg-teal-100 text-teal-800 border-teal-300",
  HARDWARE: "bg-indigo-100 text-indigo-800 border-indigo-300",
  DOOR: "bg-sky-100 text-sky-800 border-sky-300",
};

type MicState = "idle" | "listening" | "done";

function useMic(onResult: (text: string) => void) {
  const [state, setState] = useState<MicState>("idle");
  const [interim, setInterim] = useState("");
  const recRef = useRef<any>(null);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported"); return; }
    const r: any = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 1;
    recRef.current = r;
    setState("listening");
    setInterim("");
    r.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setInterim(full);
      if (e.results[e.results.length - 1].isFinal) {
        setState("done");
        onResult(full.trim());
      }
    };
    r.onerror = () => setState("idle");
    r.onend = () => { if (state !== "done") setState("idle"); };
    r.start();
  }, [onResult, state]);

  const stop = useCallback(() => {
    recRef.current?.stop();
    setState("idle");
  }, []);

  return { state, interim, start, stop };
}

function CalibratePage() {
  const { data: leaves = [], isLoading } = useAllLeaves();
  const { data: existing = [] } = useVoiceMap();
  const save = useSaveVoiceEntry();

  const [catFilter, setCatFilter] = useState<CategoryKey | "ALL">("ALL");
  const [idx, setIdx] = useState(0);
  const [heard, setHeard] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const filtered = catFilter === "ALL" ? leaves : leaves.filter((l) => l.category === catFilter);
  const current: AnyLeaf | undefined = filtered[idx];

  // set of fullNames already trained (by this user)
  const trainedNames = new Set(existing.map((e) => e.item_name));

  const { state: micState, interim, start, stop } = useMic((text) => {
    setHeard(text);
    setSaved(false);
  });

  // reset heard when item changes
  useEffect(() => { setHeard(null); setSaved(false); }, [idx, catFilter]);

  function handleSave() {
    if (!heard || !current) return;
    save.mutate(
      { item_name: current.fullName, category: current.category, raw_text: heard },
      {
        onSuccess: () => {
          setSaved(true);
          toast.success("Saved! Moving to next item…");
          setTimeout(() => advance(), 800);
        },
        onError: () => toast.error("Save failed"),
      }
    );
  }

  function advance() {
    if (idx < filtered.length - 1) setIdx((i) => i + 1);
    else toast.success("All items in this category trained!");
  }

  function skip() {
    setHeard(null);
    advance();
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading inventory…</div>;

  const done = filtered.filter((l) => trainedNames.has(l.fullName)).length;
  const pct = filtered.length ? Math.round((done / filtered.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Voice Calibration</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Say each item name aloud so the app learns your pronunciation.
        </p>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap">
        {(["ALL", "PLY", "MICA", "HARDWARE", "DOOR"] as const).map((c) => (
          <button
            key={c}
            onClick={() => { setCatFilter(c); setIdx(0); }}
            className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors ${
              catFilter === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:bg-muted"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{done} / {filtered.length} trained</span>
          <span>{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
      </div>

      {/* Item navigator */}
      {current ? (
        <div className="rounded-2xl border bg-card shadow-sm p-6 space-y-6">
          {/* Item display */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs border ${CAT_COLOR[current.category]}`} variant="outline">
                {current.category}
              </Badge>
              {trainedNames.has(current.fullName) && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> trained
                </span>
              )}
            </div>
            <div className="text-3xl font-bold leading-tight">{current.fullName}</div>
            <div className="text-xs text-muted-foreground">
              Item {idx + 1} of {filtered.length}
            </div>
          </div>

          {/* Instruction */}
          <p className="text-sm text-muted-foreground">
            Press the mic and say the item name in your language.
          </p>

          {/* Mic button */}
          <div className="flex justify-center">
            <button
              onClick={micState === "listening" ? stop : start}
              className={`w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 text-sm font-medium transition-all shadow-md ${
                micState === "listening"
                  ? "bg-red-500 text-white animate-pulse scale-110"
                  : "bg-primary text-primary-foreground hover:scale-105"
              }`}
            >
              {micState === "listening" ? (
                <><MicOff className="h-8 w-8" /><span>Stop</span></>
              ) : (
                <><Mic className="h-8 w-8" /><span>Speak</span></>
              )}
            </button>
          </div>

          {/* Live interim */}
          {micState === "listening" && interim && (
            <div className="text-center text-sm italic text-muted-foreground">
              "{interim}"
            </div>
          )}

          {/* Heard result */}
          {heard && micState !== "listening" && (
            <div className="rounded-xl bg-muted px-4 py-3 space-y-1">
              <div className="text-xs text-muted-foreground">I heard:</div>
              <div className="text-lg font-semibold">"{heard}"</div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {heard && !saved && (
              <>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={save.isPending}
                >
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  {save.isPending ? "Saving…" : "Yes, save this"}
                </Button>
                <Button variant="outline" onClick={() => setHeard(null)}>
                  <RotateCcw className="h-4 w-4 mr-1" /> Retry
                </Button>
              </>
            )}
            {(!heard || saved) && (
              <Button variant="outline" className="flex-1" onClick={skip}>
                <SkipForward className="h-4 w-4 mr-2" />
                {saved ? "Next item" : "Skip"}
              </Button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          No items in this category.
        </div>
      )}

      {/* Item list (mini) */}
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {filtered.map((leaf, i) => (
          <button
            key={leaf.fullName}
            onClick={() => setIdx(i)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              i === idx ? "bg-primary/10 font-medium" : "hover:bg-muted"
            }`}
          >
            <span className="truncate">{leaf.fullName}</span>
            <span className="ml-2 shrink-0 flex items-center gap-1">
              {trainedNames.has(leaf.fullName) && (
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {i === idx && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
