/**
 * Simple offline write-queue backed by localStorage.
 * Each entry is { id, table, op, payload } where op is "insert" | "update" | "delete".
 * Call `enqueue` when offline. Call `flush` when back online.
 */
import { supabase } from "@/integrations/supabase/client";

export type QueueEntry = {
  id: string;
  table: string;
  op: "insert" | "update" | "upsert";
  payload: Record<string, unknown>;
  matchCol?: string;   // column to match for update
  matchVal?: unknown;
};

const KEY = "item_sight_offline_queue";

export function readQueue(): QueueEntry[] {
  try { return JSON.parse(localStorage.getItem(KEY) ?? "[]"); } catch { return []; }
}

function writeQueue(q: QueueEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(q));
}

export function enqueue(entry: Omit<QueueEntry, "id">) {
  const q = readQueue();
  q.push({ ...entry, id: crypto.randomUUID() });
  writeQueue(q);
}

export function queueSize() { return readQueue().length; }

/** Attempt to flush all queued entries. Removes successfully processed ones. */
export async function flush(): Promise<{ ok: number; failed: number }> {
  const q = readQueue();
  if (q.length === 0) return { ok: 0, failed: 0 };

  const remaining: QueueEntry[] = [];
  let ok = 0;
  for (const entry of q) {
    try {
      let err: { message: string } | null = null;
      if (entry.op === "insert") {
        ({ error: err } = await (supabase.from(entry.table as never) as unknown as { insert: (p: unknown) => Promise<{ error: { message: string } | null }> }).insert(entry.payload));
      } else if (entry.op === "upsert") {
        ({ error: err } = await (supabase.from(entry.table as never) as unknown as { upsert: (p: unknown) => Promise<{ error: { message: string } | null }> }).upsert(entry.payload));
      } else if (entry.op === "update" && entry.matchCol) {
        ({ error: err } = await (supabase.from(entry.table as never) as unknown as { update: (p: unknown) => { eq: (c: string, v: unknown) => Promise<{ error: { message: string } | null }> } }).update(entry.payload).eq(entry.matchCol, entry.matchVal));
      }
      if (err) { remaining.push(entry); } else { ok++; }
    } catch { remaining.push(entry); }
  }
  writeQueue(remaining);
  return { ok, failed: remaining.length };
}
