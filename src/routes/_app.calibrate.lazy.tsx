import { createLazyFileRoute } from "@tanstack/react-router";
import { useState, useRef, useCallback, useEffect } from "react";
import { useAllLeaves, type AnyLeaf, type CategoryKey } from "@/hooks/useAllLeaves";
import { useSaveVoiceEntry, useVoiceMap } from "@/hooks/useVoiceMap";
import { findTopMatches } from "@/lib/hinglish-match";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Mic, MicOff, CheckCircle2, RotateCcw, SkipForward, ChevronRight, XCircle } from "lucide-react";

export const Route = createLazyFileRoute("/_app/calibrate")({
  component: CalibratePage,
});

const CAT_COLOR: Record<CategoryKey, string> = {
  PLY: "bg-amber-100 text-amber-800 border-amber-300",
  MICA: "bg-teal-100 text-teal-800 border-teal-300",
  HARDWARE: "bg-indigo-100 text-indigo-800 border-indigo-300",
  DOOR: "bg-sky-100 text-sky-800 border-sky-300",
};

type Attempt = { raw: string; matchedName: string | null; score: number; saved?: boolean };

function CalibratePage() {
  const { data: leaves = [], isLoading } = useAllLeaves();
  const { data: existing = [] } = useVoiceMap();
  const save = useSaveVoiceEntry();

  const [catFilter, setCatFilter] = useState<CategoryKey | "ALL">("ALL");
  const [idx, setIdx] = useState(0);

  // mic
  const [micOn, setMicOn] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [finalText, setFinalText] = useState("");
  const recRef = useRef<any>(null);
  // stable refs so mic closure always sees latest values
  const currentRef = useRef<AnyLeaf | undefined>(undefined);
  const saveFn = useRef<(entry: { item_name: string; category: string; raw_text: string }) => void>(() => {});

  // match result from final text
  const [attempts, setAttempts] = useState<Attempt[]>([]);

  const filtered = catFilter === "ALL" ? leaves : leaves.filter((l) => l.category === catFilter);
  const current: AnyLeaf | undefined = filtered[idx];
  const trainedNames = new Set(existing.map((e) => e.item_name));
  // keep refs in sync
  currentRef.current = current;
  saveFn.current = (entry) => save.mutate(entry);

  // reset on item change
  useEffect(() => {
    setLiveText("");
    setFinalText("");
    setAttempts([]);
    stopMic();
  }, [idx, catFilter]);

  function stopMic() {
    recRef.current?.stop();
    recRef.current = null;
    setMicOn(false);
  }

  const startMic = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Speech recognition not supported"); return; }
    const r: any = new SR();
    r.lang = "en-IN";
    r.interimResults = true;
    r.continuous = false;
    r.maxAlternatives = 3;
    recRef.current = r;
    setMicOn(true);
    setLiveText("");
    setFinalText("");

    r.onresult = (e: any) => {
      let full = "";
      for (let i = 0; i < e.results.length; i++) full += e.results[i][0].transcript;
      setLiveText(full);
      if (e.results[e.results.length - 1].isFinal) {
        const text = full.trim();
        setFinalText(text);
        setMicOn(false);
        if (text && leaves.length && currentRef.current) {
          const flatLeaves = leaves.map((l) => ({ path: l.path, fullName: l.fullName }));
          const top = findTopMatches(text, flatLeaves, 1);
          const matchedName = top[0]?.fullName ?? null;
          const score = top[0]?.score ?? 0;
          const isMatch = matchedName === currentRef.current.fullName;
          // auto-save every correct match — builds pronunciation dataset
          if (isMatch) {
            saveFn.current({ item_name: currentRef.current.fullName, category: currentRef.current.category, raw_text: text });
          }
          setAttempts((prev) => [...prev, { raw: text, matchedName, score, saved: isMatch }]);
        }
      }
    };
    r.onerror = () => setMicOn(false);
    r.onend = () => setMicOn(false);
    r.start();
  }, [leaves]);

  function handleSaveAttempt(attempt: Attempt) {
    if (!current) return;
    save.mutate(
      { item_name: current.fullName, category: current.category, raw_text: attempt.raw },
      {
        onSuccess: () => {
          toast.success("Saved pronunciation!");
          setAttempts((prev) =>
            prev.map((a) => a.raw === attempt.raw ? { ...a, saved: true } : a)
          );
        },
        onError: () => toast.error("Save failed"),
      }
    );
  }

  function advance() {
    if (idx < filtered.length - 1) setIdx((i) => i + 1);
    else toast.success("All items trained in this category!");
  }

  if (isLoading) return <div className="p-8 text-muted-foreground">Loading inventory…</div>;

  const done = filtered.filter((l) => trainedNames.has(l.fullName)).length;
  const pct = filtered.length ? Math.round((done / filtered.length) * 100) : 0;

  return (
    <div className="max-w-xl mx-auto p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Voice Training</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Click mic → say the item → see if it matches → save when correct.
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

      {current ? (
        <div className="rounded-2xl border bg-card shadow-sm p-5 space-y-5">

          {/* Target item */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`text-xs border ${CAT_COLOR[current.category]}`} variant="outline">
                {current.category}
              </Badge>
              {trainedNames.has(current.fullName) && (
                <span className="text-xs text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> trained
                </span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {idx + 1} / {filtered.length}
              </span>
            </div>
            <div className="text-3xl font-extrabold leading-tight">{current.fullName}</div>
            <div className="text-sm text-muted-foreground">Say this item name in your language</div>
          </div>

          {/* Mic button */}
          <div className="flex items-center gap-4">
            <button
              onClick={micOn ? stopMic : startMic}
              className={`w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 text-sm font-medium transition-all shadow-md shrink-0 ${
                micOn
                  ? "bg-red-500 text-white animate-pulse scale-110"
                  : "bg-primary text-primary-foreground hover:scale-105"
              }`}
            >
              {micOn ? <MicOff className="h-7 w-7" /> : <Mic className="h-7 w-7" />}
              <span className="text-xs">{micOn ? "Stop" : "Speak"}</span>
            </button>

            {/* Live text box */}
            <div className="flex-1 min-h-[4rem] rounded-xl border bg-muted/50 px-4 py-3 flex items-center">
              {micOn && liveText ? (
                <span className="text-base italic text-foreground">{liveText}</span>
              ) : micOn ? (
                <span className="text-sm text-muted-foreground animate-pulse">Listening…</span>
              ) : finalText ? (
                <span className="text-base font-medium text-foreground">"{finalText}"</span>
              ) : (
                <span className="text-sm text-muted-foreground">Press mic and speak</span>
              )}
            </div>
          </div>

          {/* Match result for latest attempt */}
          {attempts.length > 0 && (() => {
            const latest = attempts[attempts.length - 1];
            const isMatch = latest.matchedName === current.fullName;
            const pctScore = Math.round(latest.score * 100);
            return (
              <div className={`rounded-xl px-4 py-3 border ${
                isMatch
                  ? "bg-emerald-50 border-emerald-300 dark:bg-emerald-950/30"
                  : "bg-orange-50 border-orange-200 dark:bg-orange-950/30"
              }`}>
                <div className="flex items-center justify-between gap-2">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="text-xs text-muted-foreground">Matched →</div>
                    <div className="font-semibold text-sm truncate">{latest.matchedName ?? "No match"}</div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`text-lg font-bold ${
                      pctScore >= 80 ? "text-emerald-600" : pctScore >= 50 ? "text-amber-600" : "text-red-500"
                    }`}>{pctScore}%</span>
                    {isMatch
                      ? <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                      : <XCircle className="h-5 w-5 text-orange-400" />
                    }
                  </div>
                </div>
                {isMatch && latest.saved && (
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Auto-saved pronunciation
                  </div>
                )}
                {!isMatch && (
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-xs text-muted-foreground">
                      Wrong match — try again, or force-save if you know it's right.
                    </p>
                    <Button size="sm" variant="outline" onClick={() => handleSaveAttempt(latest)} disabled={save.isPending} className="shrink-0 text-xs h-7">
                      Force save
                    </Button>
                  </div>
                )}
              </div>
            );
          })()}

          {/* Attempt history */}
          {attempts.length > 0 && (() => {
            const savedCount = attempts.filter((a) => a.saved).length;
            const totalSaved = existing.filter((e) => e.item_name === current.fullName).length + savedCount;
            return (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Attempts ({attempts.length})
                  </div>
                  <div className="text-xs text-emerald-700 font-semibold">
                    {totalSaved} pronunciation{totalSaved !== 1 ? "s" : ""} saved
                  </div>
                </div>
                <div className="space-y-1 max-h-44 overflow-y-auto">
                  {[...attempts].reverse().map((a, i) => {
                    const isMatch = a.matchedName === current.fullName;
                    return (
                      <div
                        key={i}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm border ${
                          a.saved
                            ? "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20"
                            : isMatch
                            ? "bg-emerald-50/50 border-emerald-100"
                            : "bg-muted border-transparent"
                        }`}
                      >
                        <span className="truncate flex-1 font-medium">"{a.raw}"</span>
                        <span className="text-xs text-muted-foreground shrink-0">
                          {Math.round(a.score * 100)}%
                        </span>
                        {a.saved ? (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                        ) : (
                          <button
                            onClick={() => handleSaveAttempt(a)}
                            className="shrink-0 text-xs text-muted-foreground hover:text-foreground border rounded px-1.5 py-0.5"
                          >
                            Save
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Nav */}
          <div className="flex gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => setAttempts([])}>
              <RotateCcw className="h-3.5 w-3.5 mr-1" /> Clear
            </Button>
            <Button variant="outline" size="sm" className="ml-auto" onClick={advance}>
              <SkipForward className="h-3.5 w-3.5 mr-1" /> Next item
            </Button>
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">No items in this category.</div>
      )}

      {/* Item list */}
      <div className="space-y-0.5 max-h-56 overflow-y-auto rounded-xl border p-2">
        {filtered.map((leaf, i) => (
          <button
            key={leaf.fullName}
            onClick={() => setIdx(i)}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
              i === idx ? "bg-primary/10 font-semibold" : "hover:bg-muted"
            }`}
          >
            <span className="truncate">{leaf.fullName}</span>
            <span className="shrink-0 flex items-center gap-1 ml-2">
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
