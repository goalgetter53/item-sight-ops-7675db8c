/**
 * Returns all leaf nodes across PLY, MICA, HARDWARE from inventory_nodes,
 * plus door_types as "DOOR" leaves.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { InvNode } from "@/lib/inventoryNodes";

export type CategoryKey = "PLY" | "MICA" | "HARDWARE" | "DOOR";

export type AnyLeaf = {
  path: InvNode[];
  fullName: string;
  category: CategoryKey;
};

type RawNode = { id: string; name: string; parent_id: string | null };
const INV_CATS: CategoryKey[] = ["PLY", "MICA", "HARDWARE"];

const CAT_MAP: Record<string, CategoryKey> = {
  ply: "PLY", PLY: "PLY",
  mica: "MICA", MICA: "MICA",
  hardware: "HARDWARE", Hardware: "HARDWARE", HARDWARE: "HARDWARE",
  door: "DOOR", Door: "DOOR", DOOR: "DOOR",
};

export function useAllLeaves() {
  return useQuery<AnyLeaf[]>({
    queryKey: ["all-leaves"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [nodesRes, doorsRes, prodsRes, subcatsRes] = await Promise.all([
        (supabase as any).from("inventory_nodes").select("id, name, parent_id").order("sort"),
        supabase.from("door_types").select("id, name").eq("active", true),
        supabase.from("products").select("id, name, category, item_group, subcategory_id").eq("active", true).order("name"),
        supabase.from("product_subcategories").select("id, name, category").eq("active", true),
      ]);
      if (nodesRes.error) throw nodesRes.error;

      const nodes = nodesRes.data as unknown as RawNode[];
      const childMap = new Map<string, RawNode[]>();
      for (const n of nodes) {
        const key = n.parent_id ?? "__root__";
        const arr = childMap.get(key) ?? [];
        arr.push(n);
        childMap.set(key, arr);
      }

      const leaves: AnyLeaf[] = [];

      // Inventory tree leaves for PLY, MICA, HARDWARE
      for (const cat of INV_CATS) {
        const root = nodes.find((n) => n.parent_id === null && n.name === cat);
        if (!root) continue;
        function dfs(id: string, path: InvNode[]) {
          const kids = childMap.get(id) ?? [];
          if (kids.length === 0) {
            leaves.push({ path, fullName: path.map((p) => p.name).join(" "), category: cat });
          } else {
            for (const k of kids) dfs(k.id, [...path, { id: k.id, name: k.name }]);
          }
        }
        dfs(root.id, []);
      }

      // Door types as flat leaves
      if (!doorsRes.error && doorsRes.data) {
        for (const dt of doorsRes.data as { id: string; name: string }[]) {
          leaves.push({
            path: [{ id: dt.id, name: dt.name }],
            fullName: dt.name,
            category: "DOOR",
          });
        }
      }

      // Products table — adds all flat inventory items (hardware, mica, ply, etc.)
      // Build subcategory name map for prefix
      const subMap = new Map<string, { name: string; category: string }>(
        (subcatsRes.data ?? []).map((s: any) => [s.id, { name: s.name, category: s.category }])
      );
      const seenProducts = new Set<string>();
      for (const p of (prodsRes.data ?? []) as any[]) {
        const cat: CategoryKey = CAT_MAP[p.category] ?? "HARDWARE";
        const itemName: string = (p.item_group || p.name) as string;
        const sub = p.subcategory_id ? subMap.get(p.subcategory_id) : null;
        // fullName = "SubcatName ItemName" or just ItemName
        const fullName = sub ? `${sub.name} ${itemName}`.trim() : itemName;
        if (seenProducts.has(fullName)) continue;
        seenProducts.add(fullName);
        leaves.push({
          path: [{ id: p.id, name: fullName }],
          fullName,
          category: cat,
        });
      }

      return leaves;
    },
  });
}
