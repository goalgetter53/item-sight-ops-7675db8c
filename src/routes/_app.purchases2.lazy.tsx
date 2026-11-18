import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PageHeader } from "@/components/erp/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { inr } from "@/lib/codes";
import { useAuth } from "@/lib/auth-store";
import { PurchaseItemDialog, type PurchaseItem } from "@/components/erp/PurchaseItemDialog";
import { adjustComboStock, type ComboCategory } from "@/lib/comboStock";
import { plyDefault, micaDefault, hardwareDefault } from "@/lib/tile-images";
import { Plus, Trash2, Check, ArrowLeft } from "lucide-react";
import { VoiceSearchPicker } from "@/components/erp/VoiceSearchPicker";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/_app/purchases2")({ component: Purchase2 });

type Line = { key: string; name: string; category: ComboCategory; qty: number; rate: number; gst_rate: number };
const TILES: ComboCategory[] = ["PLY", "MICA", "HARDWARE"];
const todayLocal = () => new Date().toISOString().slice(0, 10);

function Purchase2() {
  const nav = useNavigate();
  const user = useAuth((s) => s.user);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [supplierId, setSupplierId] = useState("");
  const [supplierName, setSupplierName] = useState("");
  const [billNo, setBillNo] = useState("");
  const [billDate, setBillDate] = useState(todayLocal());
  const [billType, setBillType] = useState<"gst" | "non_gst">("gst");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [lines, setLines] = useState<Line[]>([]);
  const [wizard, setWizard] = useState<ComboCategory | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.from("suppliers").select("*").order("name").then(({ data }) => setSuppliers(data ?? []));
  }, []);


  const createSupplier = async (name: string) => {
    const { data, error } = await supabase.from("suppliers").insert({ name }).select().single();
    if (error) { toast.error(error.message); return; }
    setSuppliers((p) => [...p, data]);
    setSupplierId(data.id);
    setSupplierName(data.name);
  };

  const addItem = (it: PurchaseItem) =>
    setLines((p) => [...p, { key: crypto.randomUUID(), name: it.name, category: it.category, qty: it.qty, rate: it.rate, gst_rate: 18 }]);
  const upd = (i: number, patch: Partial<Line>) => setLines(lines.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const rm = (i: number) => setLines(lines.filter((_, idx) => idx !== i));

  const subtotal = lines.reduce((a, l) => a + l.qty * l.rate, 0);
  const tax = billType === "gst" ? lines.reduce((a, l) => a + (l.qty * l.rate * l.gst_rate) / 100, 0) : 0;
  const total = Math.max(0, subtotal - discount) + tax;

  const save = async () => {
    if (lines.length === 0) return toast.error("Add at least one item");
    if (!supplierId) return toast.error("Pick or create a supplier");
    if (!billNo.trim()) return toast.error("Invoice number is required");
    if (!billDate) return toast.error("Invoice date is required");
    setBusy(true);
    try {
      const { data: pur, error: pErr } = await supabase.from("purchases").insert({
        supplier_id: supplierId, bill_no: billNo, bill_date: billDate,
        notes: notes.trim() || (billType === "gst" ? "GST bill" : "Non-GST bill"),
        subtotal, tax_total: tax, grand_total: total, created_by: user?.id,
      }).select().single();
      if (pErr) throw pErr;

      for (const l of lines) {
        // Resolve/create the combo product and add its stock (+qty) in one call.
        const pid = await adjustComboStock(l.name, l.category, l.qty);
        const { error: piErr } = await supabase.from("purchase_items").insert({
          purchase_id: pur.id, product_id: pid, qty: l.qty, rate: l.rate,
          gst_rate: billType === "gst" ? l.gst_rate : 0, line_total: l.qty * l.rate,
        });
        if (piErr) throw piErr;
      }
      toast.success("Purchase saved & stock updated");
      nav({ to: "/purchases/$id", params: { id: pur.id } });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        title="New Purchase 2"
        subtitle="Pick items by tile (PLY / MICA / HARDWARE), enter quantity & rate. Stock updates on save."
        actions={
          <>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => nav({ to: "/purchases" })}>
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button size="sm" disabled={busy} onClick={save} className="gap-2">
              <Check className="h-4 w-4" /> {busy ? "Saving…" : "Save Purchase"}
            </Button>
          </>
        }
      />
      <div className="mx-auto max-w-5xl px-4 sm:px-6 pb-28 space-y-5">
        {/* Header */}
        <div className="rounded-2xl border border-[#e8ecf1] bg-white p-4 shadow-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-1">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Supplier</label>
              <VoiceSearchPicker
                options={suppliers.map((s) => ({ id: s.id, label: s.name }))}
                value={supplierId}
                onChange={(id, label) => { setSupplierId(id); setSupplierName(label); }}
                placeholder="Search or add supplier…"
                onCreate={createSupplier}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Invoice No.</label>
              <Input value={billNo} onChange={(e) => setBillNo(e.target.value)} placeholder="Bill number" />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Invoice Date</label>
              <Input type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Bill type</label>
              <div className="flex rounded-lg border border-[#e8ecf1] bg-[#fafbfc] p-1">
                {([["gst", "GST"], ["non_gst", "Non-GST"]] as const).map(([v, lbl]) => (
                  <button key={v} type="button" onClick={() => setBillType(v)}
                    className={`px-3 py-1.5 text-xs font-bold rounded transition-all ${billType === v ? "bg-white shadow-sm text-[#3b82f6]" : "text-slate-500"}`}>
                    {lbl}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Discount (₹)</label>
              <Input type="number" min={0} value={discount} onChange={(e) => setDiscount(Number(e.target.value || 0))} className="w-32" />
            </div>
            <div className="flex-1 min-w-[180px]">
              <label className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-500">Notes</label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" />
            </div>
          </div>
        </div>

        {/* Tiles */}
        <div className="grid grid-cols-3 gap-3">
          {TILES.map((t) => (
            <button key={t} type="button" onClick={() => setWizard(t)}
              className="group overflow-hidden flex flex-col items-center rounded-2xl border border-[#e8ecf1] bg-white shadow-sm transition-all hover:border-[#3b82f6] hover:shadow-md active:scale-[0.98]">
              <img src={t === "PLY" ? plyDefault : t === "MICA" ? micaDefault : hardwareDefault} alt={t} className="w-full h-24 object-cover" />
              <span className="py-2 text-sm font-extrabold tracking-wide text-slate-700 group-hover:text-[#3b82f6]">{t}</span>
            </button>
          ))}
        </div>

        {/* Lines */}
        {lines.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-[#e8ecf1] bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="p-3 text-left">Item</th>
                    <th className="p-3 text-right w-24">Qty</th>
                    <th className="p-3 text-right w-28">Rate</th>
                    {billType === "gst" && <th className="p-3 text-right w-20">GST%</th>}
                    <th className="p-3 text-right w-28">Amount</th>
                    <th className="p-3 w-10" />
                  </tr>
                </thead>
                <tbody>
                  {lines.map((l, i) => (
                    <tr key={l.key} className="border-t border-slate-100">
                      <td className="p-3 font-medium text-slate-700">{l.name}</td>
                      <td className="p-2 text-right">
                        <Input type="number" min={1} value={l.qty} onChange={(e) => upd(i, { qty: Math.max(1, Number(e.target.value || 1)) })} className="h-9 w-20 text-right" />
                      </td>
                      <td className="p-2 text-right">
                        <Input type="number" min={0} value={l.rate} onChange={(e) => upd(i, { rate: Number(e.target.value || 0) })} className="h-9 w-24 text-right" />
                      </td>
                      {billType === "gst" && <td className="p-3 text-right tabular-nums">{l.gst_rate}%</td>}
                      <td className="p-3 text-right font-bold tabular-nums">{inr(l.qty * l.rate)}</td>
                      <td className="p-2 text-right">
                        <button type="button" aria-label="Remove" onClick={() => rm(i)} className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-500">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 text-sm">
                  <tr className="border-t border-slate-200"><td colSpan={billType === "gst" ? 4 : 3} className="p-3 text-right font-semibold">Subtotal</td><td className="p-3 text-right font-bold tabular-nums">{inr(subtotal)}</td><td /></tr>
                  {billType === "gst" && <tr><td colSpan={4} className="p-3 text-right font-semibold">Tax</td><td className="p-3 text-right font-bold tabular-nums">{inr(tax)}</td><td /></tr>}
                  {discount > 0 && <tr><td colSpan={billType === "gst" ? 4 : 3} className="p-3 text-right font-semibold">Discount</td><td className="p-3 text-right font-bold tabular-nums text-amber-600">- {inr(discount)}</td><td /></tr>}
                  <tr className="border-t border-slate-200"><td colSpan={billType === "gst" ? 4 : 3} className="p-3 text-right font-extrabold text-lg">Total</td><td className="p-3 text-right font-extrabold text-lg tabular-nums">{inr(total)}</td><td /></tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
        {lines.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white/50 p-8 text-center text-sm text-slate-400">
            <Plus className="mx-auto mb-2 h-6 w-6" /> Tap a tile above to add items.
          </div>
        )}
      </div>

      <PurchaseItemDialog category={wizard} open={wizard !== null} onOpenChange={(v) => !v && setWizard(null)} onAdd={addItem} />
    </>
  );
}
