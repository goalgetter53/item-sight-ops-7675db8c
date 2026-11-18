import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ComboCategory = "PLY" | "MICA" | "HARDWARE";

export type ComboStockRow = { name: string; qty: number };

// All combo tile items with their current lot stock.
export function useComboStockList() {
  return useQuery({
    queryKey: ["combo-stock"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("item_instances")
        .select("qty_on_hand, products!inner(name, sku)")
        .eq("is_lot", true)
        .like("products.sku", "COMBO:%");
      if (error) throw error;
      return (data ?? []).map((r: any) => ({ name: r.products.name as string, qty: Number(r.qty_on_hand) || 0 })) as ComboStockRow[];
    },
  });
}

// Classify a combo item name back into its category + path labels below the root.
// PLY: "PLY — 18 mm — Applewood — 8*4"; MICA: "SS-01 (National old)"; HARDWARE: "Door Hinges (HARDWARE)".
export function classifyCombo(name: string): { cat: ComboCategory; below: string[] } | null {
  if (name.startsWith("PLY — ")) return { cat: "PLY", below: name.split(" — ").slice(1) };
  if (name.endsWith(" (HARDWARE)")) return { cat: "HARDWARE", below: name.slice(0, -" (HARDWARE)".length).split(" / ") };
  const m = name.match(/\(([^)]+)\)\s*$/);
  if (m) return { cat: "MICA", below: [m[1].trim()] };
  return null;
}

// Sum stock under a category node path (labels = levels below the root, [] = whole category).
export function stockUnder(rows: ComboStockRow[], cat: ComboCategory, labels: string[]): number {
  let s = 0;
  for (const r of rows) {
    const c = classifyCombo(r.name);
    if (!c || c.cat !== cat) continue;
    if (labels.every((l, i) => c.below[i] === l)) s += r.qty;
  }
  return s;
}

// Resolve (create if needed) the tracked product for a tile item and move its
// lot stock by delta (+purchase, -sale). Keyed by the item name so Purchase 2
// and Sales 2 hit the same product. Returns the product id. Allows negative stock.
export async function adjustComboStock(
  name: string,
  category: ComboCategory,
  delta: number,
): Promise<string | null> {
  const nm = name?.trim();
  if (!nm) return null;
  const { data, error } = await supabase.rpc("adjust_combo_stock", {
    _name: nm,
    _category: category,
    _delta: Math.trunc(delta || 0),
  });
  if (error) throw error;
  return (data as string) ?? null;
}

// Resolve/create the product without moving stock (delta 0) — used to get the
// product_id for a purchase line before inserting purchase_items.
export const resolveComboProductId = (name: string, category: ComboCategory) =>
  adjustComboStock(name, category, 0);
