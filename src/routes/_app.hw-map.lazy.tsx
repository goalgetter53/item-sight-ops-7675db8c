import { createLazyFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronRight, Package, Tag, Plus, SkipForward, CheckCircle2 } from "lucide-react";

export const Route = createLazyFileRoute("/_app/hw-map")({
  component: HwMapPage,
});

type Product = { id: string; name: string; item_group: string | null; subcategory_id: string | null };
type Subcat = { id: string; name: string };

function useHwProducts() {
  return useQuery<Product[]>({
    queryKey: ["hw-products-unmap"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("id, name, item_group, subcategory_id")
        .eq("category", "hardware")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

function useHwSubcats() {
  return useQuery<Subcat[]>({
    queryKey: ["hw-subcats"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("product_subcategories")
        .select("id, name")
        .eq("category", "hardware")
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return (data ?? []) as Subcat[];
    },
  });
}

function HwMapPage() {
  const qc = useQueryClient();
  const { data: products = [], isLoading: loadingP } = useHwProducts();
  const { data: subcats = [], isLoading: loadingSC } = useHwSubcats();

  // which item is open in popup
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  // new subcategory creation
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  // filter: show all or only unmapped
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? products : products.filter((p) => !p.subcategory_id);
  const active = activeIdx !== null ? visible[activeIdx] : null;

  const assignMutation = useMutation({
    mutationFn: async ({ productId, subcatId }: { productId: string; subcatId: string }) => {
      const { error } = await supabase
        .from("products")
        .update({ subcategory_id: subcatId })
        .eq("id", productId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hw-products-unmap"] });
      qc.invalidateQueries({ queryKey: ["all-leaves"] });
      toast.success("Subcategory assigned!");
      // advance to next
      setActiveIdx((i) => {
        if (i === null) return null;
        const next = i; // list shrinks if not showAll, so same index = next item
        if (next >= visible.length - 1) return null;
        return next;
      });
    },
    onError: (e: any) => toast.error(e.message),
  });

  async function handleCreateAndAssign() {
    if (!newName.trim() || !active) return;
    setCreating(true);
    try {
      const { data, error } = await supabase
        .from("product_subcategories")
        .insert({ name: newName.trim(), category: "hardware" })
        .select("id")
        .single();
      if (error) throw error;
      await assignMutation.mutateAsync({ productId: active.id, subcatId: data.id });
      qc.invalidateQueries({ queryKey: ["hw-subcats"] });
      setNewName("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setCreating(false);
    }
  }

  if (loadingP || loadingSC) return (
    <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
      Loading hardware items…
    </div>
  );

  const unmappedCount = products.filter((p) => !p.subcategory_id).length;
  const mappedCount = products.length - unmappedCount;

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Tag className="h-6 w-6" /> Hardware Mapping
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Assign each hardware item to a subcategory.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border bg-card p-3 text-center">
          <div className="text-2xl font-bold">{products.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
        <div className="rounded-xl border bg-emerald-50 dark:bg-emerald-950/20 p-3 text-center">
          <div className="text-2xl font-bold text-emerald-600">{mappedCount}</div>
          <div className="text-xs text-muted-foreground">Mapped</div>
        </div>
        <div className="rounded-xl border bg-orange-50 dark:bg-orange-950/20 p-3 text-center">
          <div className="text-2xl font-bold text-orange-500">{unmappedCount}</div>
          <div className="text-xs text-muted-foreground">Unmapped</div>
        </div>
      </div>

      {/* Filter toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setShowAll(false)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            !showAll ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          }`}
        >
          Unmapped ({unmappedCount})
        </button>
        <button
          onClick={() => setShowAll(true)}
          className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
            showAll ? "bg-primary text-primary-foreground border-primary" : "border-border hover:bg-muted"
          }`}
        >
          All ({products.length})
        </button>
      </div>

      {/* Item list */}
      {visible.length === 0 ? (
        <div className="text-center py-16">
          <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
          <p className="font-semibold text-lg">All items mapped!</p>
          <p className="text-sm text-muted-foreground mt-1">
            Switch to "All" to review or reassign.
          </p>
        </div>
      ) : (
        <div className="space-y-1.5">
          {visible.map((p, i) => {
            const sub = subcats.find((s) => s.id === p.subcategory_id);
            return (
              <button
                key={p.id}
                onClick={() => setActiveIdx(i)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border bg-card hover:bg-muted transition-colors text-left"
              >
                <Package className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{p.item_group || p.name}</div>
                  {sub ? (
                    <Badge variant="outline" className="text-xs mt-0.5 bg-emerald-50 text-emerald-700 border-emerald-200">
                      {sub.name}
                    </Badge>
                  ) : (
                    <span className="text-xs text-orange-500">Not mapped</span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            );
          })}
        </div>
      )}

      {/* Popup / Bottom sheet */}
      {active && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setActiveIdx(null)}>
          <div
            className="bg-background rounded-t-2xl p-5 space-y-4 max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Item info */}
            <div className="space-y-1">
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Assign subcategory for</div>
              <div className="text-xl font-bold">{active.item_group || active.name}</div>
              <div className="text-xs text-muted-foreground">{active.name}</div>
            </div>

            {/* Existing subcategories */}
            <div className="space-y-2">
              <div className="text-sm font-medium text-muted-foreground">Pick existing subcategory</div>
              <div className="grid grid-cols-2 gap-2">
                {subcats.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => assignMutation.mutate({ productId: active.id, subcatId: s.id })}
                    disabled={assignMutation.isPending}
                    className={`px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-colors hover:bg-primary/10 ${
                      active.subcategory_id === s.id
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border"
                    }`}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Create new subcategory */}
            <div className="space-y-2 border-t pt-4">
              <div className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                <Plus className="h-3.5 w-3.5" /> Create new subcategory
              </div>
              <div className="flex gap-2">
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Subcategory name…"
                  className="flex-1 rounded-xl border bg-muted/50 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/30"
                  onKeyDown={(e) => { if (e.key === "Enter") handleCreateAndAssign(); }}
                />
                <Button
                  size="sm"
                  onClick={handleCreateAndAssign}
                  disabled={!newName.trim() || creating}
                >
                  {creating ? "…" : "Create & assign"}
                </Button>
              </div>
            </div>

            {/* Skip */}
            <div className="flex gap-2 border-t pt-3">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => setActiveIdx(null)}>
                Close
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="flex-1 text-muted-foreground"
                onClick={() => {
                  setActiveIdx((i) => (i !== null && i < visible.length - 1 ? i + 1 : null));
                }}
              >
                <SkipForward className="h-3.5 w-3.5 mr-1" /> Skip
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
