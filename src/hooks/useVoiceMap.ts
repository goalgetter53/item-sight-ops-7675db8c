import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { preprocess } from "@/lib/hinglish-match";

export type VoiceMapEntry = {
  item_name: string;
  category: string;
  heard_text: string;
  raw_text: string;
};

export function useVoiceMap() {
  const userId = useAuth((s) => s.user?.id);
  return useQuery<VoiceMapEntry[]>({
    queryKey: ["voice_map", userId],
    enabled: !!userId,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("voice_map")
        .select("item_name, category, heard_text, raw_text")
        .eq("user_id", userId!);
      if (error) throw error;
      return (data ?? []) as VoiceMapEntry[];
    },
  });
}

export function useSaveVoiceEntry() {
  const userId = useAuth((s) => s.user?.id);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<VoiceMapEntry, "heard_text"> & { raw_text: string }) => {
      if (!userId) throw new Error("not signed in");
      const heard_text = preprocess(entry.raw_text);
      const { error } = await (supabase as any).from("voice_map").upsert(
        { user_id: userId, ...entry, heard_text },
        { onConflict: "user_id,heard_text" }
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["voice_map", userId] }),
  });
}

/** Lookup: given preprocessed query, return matching item_name or null */
export function voiceMapLookup(
  preprocessedQuery: string,
  entries: VoiceMapEntry[]
): VoiceMapEntry | null {
  const q = preprocessedQuery.toLowerCase().trim();
  // exact match first
  const exact = entries.find((e) => e.heard_text === q);
  if (exact) return exact;
  // partial: query contains a learned phrase or vice versa
  const partial = entries.find(
    (e) => q.includes(e.heard_text) || e.heard_text.includes(q)
  );
  return partial ?? null;
}
