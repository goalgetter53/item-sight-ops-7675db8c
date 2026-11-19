import { useState, useRef, useCallback } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useAllHardwareLeaves } from "@/hooks/useAllHardwareLeaves";
import { findTopMatches } from "@/lib/hinglish-match";
import type { InvNode } from "@/lib/inventoryNodes";

type Props = {
  imgSrc: string;
  label: string;
  onNormalClick: () => void;
  onVoicePick: (path: InvNode[]) => void;
};

type Candidate = { path: InvNode[]; fullName: string; score: number };

export function VoiceHardwareTile({ imgSrc, label, onNormalClick, onVoicePick }: Props) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recogRef = useRef<any>(null);
  const { data: leaves = [] } = useAllHardwareLeaves();

  const startListening = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition;
    if (!SR) { alert("Speech recognition not supported in this browser."); return; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rec: any = new SR();
    rec.lang = "en-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 5;
    recogRef.current = rec;
    setListening(true);

    rec.onresult = (e: any) => {
      const alts: string[] = Array.from(e.results[0]).map((r: any) => r.transcript);
      // Try each alternative and collect all matches, deduplicated
      const seen = new Set<string>();
      const all: Candidate[] = [];
      for (const alt of alts) {
        for (const m of findTopMatches(alt, leaves, 5)) {
          if (!seen.has(m.fullName)) { seen.add(m.fullName); all.push(m); }
        }
      }
      all.sort((a, b) => b.score - a.score);
      const top = all.slice(0, 5);

      setTranscript(alts[0]);
      setListening(false);

      if (top.length === 0) {
        setTranscript(alts[0]);
        setPickerOpen(true); // show "no results" state
        setCandidates([]);
        return;
      }
      if (top[0].score >= 0.92 && top.length === 1) {
        // High-confidence auto-pick
        onVoicePick(top[0].path);
        return;
      }
      setCandidates(top);
      setPickerOpen(true);
    };

    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  }, [leaves, onVoicePick]);

  const stopListening = () => {
    recogRef.current?.stop();
    setListening(false);
  };

  return (
    <>
      {/* Tile */}
      <div className="relative group">
        <button
          type="button"
          onClick={onNormalClick}
          className="w-full overflow-hidden flex flex-col items-center rounded-2xl border border-[#e8ecf1] bg-white shadow-sm transition-all hover:border-[#3b82f6] hover:shadow-md active:scale-[0.98]"
        >
          <img src={imgSrc} alt={label} className="w-full h-24 object-cover" />
          <span className="py-2 text-sm font-extrabold tracking-wide text-slate-700 group-hover:text-[#3b82f6]">
            {label}
          </span>
        </button>

        {/* Mic overlay button */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); listening ? stopListening() : startListening(); }}
          title="Speak item name"
          className={`absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full shadow-md transition-all ${
            listening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-indigo-600 text-white opacity-0 group-hover:opacity-100 hover:bg-indigo-700"
          }`}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      {/* Candidate picker */}
      <Dialog open={pickerOpen} onOpenChange={(v) => { if (!v) setPickerOpen(false); }}>
        <DialogContent className="w-[calc(100vw-1rem)] max-w-sm rounded-3xl p-0 gap-0 overflow-hidden">
          <div className="px-5 pt-5 pb-3 border-b border-slate-100">
            <DialogTitle className="text-lg font-extrabold text-slate-900">Pick hardware item</DialogTitle>
            {transcript && (
              <p className="mt-1 text-xs text-slate-500">
                Heard: <span className="font-semibold text-slate-700">"{transcript}"</span>
              </p>
            )}
          </div>
          <div className="p-3 space-y-2">
            {candidates.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-400">No matching items found.</p>
            ) : candidates.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => { setPickerOpen(false); onVoicePick(c.path); }}
                className="w-full flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left hover:border-indigo-500 hover:bg-indigo-50 active:scale-[0.97] transition-all"
              >
                <div className="min-w-0">
                  <p className="text-sm font-bold text-slate-800 truncate">{c.fullName}</p>
                  <p className="text-xs text-slate-400 truncate">
                    {c.path.map((p) => p.name).join(" › ")}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-indigo-500">
                  {Math.round(c.score * 100)}%
                </span>
              </button>
            ))}
          </div>
          <div className="px-3 pb-3">
            <button
              type="button"
              onClick={() => setPickerOpen(false)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-slate-200 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50 transition-colors"
            >
              <X className="h-4 w-4" /> Cancel
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
