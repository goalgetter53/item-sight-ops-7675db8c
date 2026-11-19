import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { HardwareLeaf } from "@/lib/hinglish-match";
import type { InvNode } from "@/lib/inventoryNodes";

type RawNode = { id: string; name: string; parent_id: string | null };

export function useAllHardwareLeaves() {
  return useQuery<HardwareLeaf[]>({
    queryKey: ["hw-leaves"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("inventory_nodes")
        .select("id, name, parent_id")
        .order("sort");
      if (error) throw error;
      const nodes = data as unknown as RawNode[];

      const childMap = new Map<string, RawNode[]>();
      for (const n of nodes) {
        const key = n.parent_id ?? "__root__";
        const arr = childMap.get(key) ?? [];
        arr.push(n);
        childMap.set(key, arr);
      }

      const hwRoot = nodes.find((n) => n.parent_id === null && n.name === "HARDWARE");
      if (!hwRoot) return [];

      const leaves: HardwareLeaf[] = [];
      function dfs(id: string, path: InvNode[]) {
        const kids = childMap.get(id) ?? [];
        if (kids.length === 0) {
          leaves.push({ path, fullName: path.map((p) => p.name).join(" ") });
        } else {
          for (const k of kids) dfs(k.id, [...path, { id: k.id, name: k.name }]);
        }
      }
      dfs(hwRoot.id, []);
      return leaves;
    },
  });
}
