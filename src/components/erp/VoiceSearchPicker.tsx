import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { toast } from "sonner";

export type VoiceOption = { id: string; label: string; sub?: string };

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, "").trim();
}

function score(query: string, label: string): number {
  const q = normalize(query);
  const o = normalize(label);
  if (!q) return 0;
  if (o === q) return 1.0;
  if (o.startsWith(q)) return 0.9;
  const words = q.split(/\s+/);
  if (words.every((w) => o.includes(w))) return 0.8;
  const matched = words.filter((w) => o.includes(w)).length;
  if (matched > 0) return 0.5 + (matched / words.length) * 0.2;
  if (o.includes(q.slice(0, Math.max(2, Math.floor(q.length * 0.5))))) return 0.3;
  return 0;
}

export function VoiceSearchPicker({
  options,
  value,
  onChange,
  placeholder = "Search…",
  required = false,
  onCreate,
}: {
  options: VoiceOption[];
  value: string;
  onChange: (id: string, label: string) => void;
  placeholder?: string;
  required?: boolean;
  onCreate?: (name: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [listening, setListening] = useState(false);

  const selectedLabel = options.find((o) => o.id === value)?.label ?? "";
  const [display, setDisplay] = useState(selectedLabel);

  useEffect(() => {
    if (!open) setDisplay(selectedLabel);
  }, [value, open, selectedLabel]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = !query.trim()
    ? options.slice(0, 8)
    : options
        .map((o) => ({ ...o, _score: score(query, o.label) }))
        .filter((o) => o._score > 0)
        .sort((a, b) => b._score - a._score)
        .slice(0, 8);

  const tryAutoSelect = (transcript: string) => {
    const scored = options
      .map((o) => ({ ...o, _score: score(transcript, o.label) }))
      .filter((o) => o._score > 0)
      .sort((a, b) => b._score - a._score);
    if (scored.length > 0 && scored[0]._score >= 0.9) {
      onChange(scored[0].id, scored[0].label);
      setDisplay(scored[0].label);
      setQuery("");
      setOpen(false);
      return true;
    }
    return false;
  };

  const startVoice = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice search not supported in this browser");
      return;
    }
    const r = new SpeechRecognition();
    r.lang = "en-IN";
    r.interimResults = false;
    r.maxAlternatives = 3;
    recognitionRef.current = r;
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => setListening(false);
    r.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript.trim();
      if (!tryAutoSelect(transcript)) {
        setQuery(transcript);
        setDisplay(transcript);
        setOpen(true);
      }
    };
    r.start();
  };

  const stopVoice = () => {
    recognitionRef.current?.stop();
    setListening(false);
  };

  const pick = (o: VoiceOption) => {
    onChange(o.id, o.label);
    setDisplay(o.label);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("", "");
    setDisplay("");
    setQuery("");
    setOpen(false);
  };

  const showCreate = !!onCreate && query.trim() &&
    !options.some((o) => o.label.toLowerCase() === query.trim().toLowerCase());

  return (
    <div ref={containerRef} className="relative w-full">
      <div
        className={`flex items-center gap-1.5 h-11 px-3 rounded-xl border ${
          listening
            ? "border-[#3b82f6] ring-2 ring-[#3b82f6]/20"
            : "border-[#e8ecf1]"
        } bg-[#fafbfc]`}
      >
        <input
          type="text"
          className="flex-1 min-w-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
          placeholder={placeholder}
          value={open ? query : display}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => { setQuery(""); setOpen(true); }}
        />
        {(value || display) && !listening && (
          <button type="button" onClick={clear} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          type="button"
          onClick={listening ? stopVoice : startVoice}
          className={`flex items-center justify-center rounded-lg p-2 transition-colors ${
            listening
              ? "bg-red-500 text-white animate-pulse"
              : "bg-[#3b82f6] text-white hover:bg-[#2563eb]"
          }`}
          aria-label={listening ? "Stop listening" : "Voice search"}
        >
          {listening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
        </button>
      </div>

      {open && (filtered.length > 0 || showCreate) && (
        <div className="absolute z-30 mt-1 w-full rounded-xl border border-[#e8ecf1] bg-white shadow-xl overflow-hidden">
          {filtered.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => pick(o)}
              className="flex flex-col w-full text-left px-4 py-3 hover:bg-[#f0f7ff] active:bg-[#dbeafe] border-b border-slate-100 last:border-b-0"
            >
              <span className="text-sm font-semibold text-slate-800">{o.label}</span>
              {o.sub && <span className="text-xs text-slate-400 mt-0.5">{o.sub}</span>}
            </button>
          ))}
          {showCreate && (
            <button
              type="button"
              onClick={() => { onCreate!(query.trim()); setOpen(false); }}
              className="flex w-full text-left px-4 py-3 border-t border-slate-100 text-sm font-semibold text-[#3b82f6] hover:bg-slate-50"
            >
              + Add "{query.trim()}"
            </button>
          )}
        </div>
      )}
    </div>
  );
}
