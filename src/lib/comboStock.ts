import { supabase } from "@/integrations/supabase/client";

export type ComboCategory = "PLY" | "MICA" | "HARDWARE";

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
