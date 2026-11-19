import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { inr, fmtDateTime } from "@/lib/codes";
import { Printer, Wifi, WifiOff, CheckCircle2, Clock, LogOut } from "lucide-react";
import { toast } from "sonner";

export const Route = createLazyFileRoute("/print-queue")({ component: PrintQueue });

type Bill = {
  id: string;
  invoice_no: string;
  invoice_date: string;
  grand_total: number;
  payment_mode: string;
  customers: { name: string } | null;
  printed: boolean;
};

const PRINTED_KEY = "printed_bill_ids";

function getLocalPrinted(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(PRINTED_KEY) ?? "[]")); }
  catch { return new Set(); }
}
function markLocalPrinted(id: string) {
  const s = getLocalPrinted(); s.add(id);
  localStorage.setItem(PRINTED_KEY, JSON.stringify([...s]));
}

function openPrintWindow(id: string) {
  const url = `/print-bill/${id}`;
  window.open(url, `print_${id}`, "width=640,height=820,menubar=no,toolbar=no,location=no");
  markLocalPrinted(id);
}

export default function PrintQueue() {
  return <PrintQueueInner />;
}

function PrintQueueInner() {
  const user = useAuth((s) => s.user);
  const logout = useAuth((s) => s.logout);
  const nav = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [online, setOnline] = useState(true);
  const printedRef = useRef(getLocalPrinted());

  useEffect(() => {
    if (user && user.role !== "printer") nav({ to: "/login" });
    if (!user) nav({ to: "/login" });
  }, [user, nav]);

  const loadBills = async () => {
    const printed = getLocalPrinted();
    printedRef.current = printed;
    const { data, error } = await supabase
      .from("sales")
      .select("id, invoice_no, invoice_date, grand_total, payment_mode, customers(name)")
      .is("deleted_at", null)
      .order("invoice_date", { ascending: false })
      .limit(200);
    if (error) { toast.error("Failed to load bills"); return; }
    setBills((data ?? []).map((r: any) => ({ ...r, printed: printed.has(r.id) })));
  };

  useEffect(() => { loadBills(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel("print-queue-sales")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, async (payload) => {
        setOnline(true);
        const row = payload.new as any;
        let customerName = "Walk-in customer";
        if (row.customer_id) {
          const { data } = await supabase.from("customers").select("name").eq("id", row.customer_id).single();
          if (data) customerName = data.name;
        }
        const newBill: Bill = {
          id: row.id,
          invoice_no: row.invoice_no,
          invoice_date: row.invoice_date,
          grand_total: Number(row.grand_total),
          payment_mode: row.payment_mode,
          customers: { name: customerName },
          printed: false,
        };
        setBills((prev) => [newBill, ...prev]);
        setTimeout(() => { openPrintWindow(row.id); setBills((prev) => prev.map((b) => b.id === row.id ? { ...b, printed: true } : b)); }, 300);
        toast.success(`New bill ${row.invoice_no} — auto-printing`);
      })
      .subscribe((status) => {
        setOnline(status === "SUBSCRIBED");
      });
    return () => { void supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    const on = () => { setOnline(true); loadBills(); };
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); };
  }, []);

  const handlePrint = (bill: Bill) => {
    openPrintWindow(bill.id);
    setBills((prev) => prev.map((b) => b.id === bill.id ? { ...b, printed: true } : b));
  };

  const pending = bills.filter((b) => !b.printed);
  const printed = bills.filter((b) => b.printed);

  return (
    <div className="min-h-dvh bg-[#f4f6f9] flex flex-col" style={{ fontFamily: "system-ui, sans-serif" }}>

      {/* Top bar */}
      <header className="bg-white border-b border-[#e8ecf1] shadow-sm px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-[#3b82f6]/10">
            <Printer className="h-5 w-5 text-[#3b82f6]" />
          </div>
          <div>
            <div className="font-extrabold text-slate-900 text-base leading-tight">Print Station</div>
            <div className="text-xs text-slate-400 leading-tight">Auto-prints new bills in real time</div>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border ${online ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-600 border-red-200"}`}>
            {online
              ? <><Wifi className="h-3.5 w-3.5" />Live</>
              : <><WifiOff className="h-3.5 w-3.5" />Offline</>}
          </div>
          <button
            onClick={() => { logout(); nav({ to: "/login" }); }}
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-red-500 border border-[#e8ecf1] hover:border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-full transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </button>
        </div>
      </header>

      {/* Summary strip */}
      <div className="px-5 py-3 flex items-center gap-4">
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-xl text-sm font-bold">
          <Clock className="h-4 w-4" />
          {pending.length} pending
        </div>
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-2 rounded-xl text-sm font-bold">
          <CheckCircle2 className="h-4 w-4" />
          {printed.length} printed today
        </div>
      </div>

      {/* Two-column queue */}
      <div className="flex-1 grid grid-cols-2 gap-4 px-5 pb-6 overflow-hidden">

        {/* Pending column */}
        <div className="flex flex-col rounded-2xl border border-[#e8ecf1] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8ecf1] bg-amber-50">
            <Clock className="h-4 w-4 text-amber-600" />
            <span className="font-extrabold text-amber-700 text-sm">Pending</span>
            <span className="ml-auto bg-amber-100 text-amber-700 border border-amber-200 rounded-full px-2.5 py-0.5 text-xs font-bold">{pending.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {pending.length === 0 && (
              <div className="flex flex-col items-center justify-center h-32 text-slate-400 text-sm gap-2">
                <CheckCircle2 className="h-7 w-7 text-slate-300" />
                All caught up!
              </div>
            )}
            {pending.map((b) => (
              <BillCard key={b.id} bill={b} onPrint={handlePrint} />
            ))}
          </div>
        </div>

        {/* Printed column */}
        <div className="flex flex-col rounded-2xl border border-[#e8ecf1] bg-white shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8ecf1] bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <span className="font-extrabold text-green-700 text-sm">Printed</span>
            <span className="ml-auto bg-green-100 text-green-700 border border-green-200 rounded-full px-2.5 py-0.5 text-xs font-bold">{printed.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {printed.length === 0 && (
              <div className="text-center text-slate-400 text-sm mt-10">No printed bills yet</div>
            )}
            {printed.map((b) => (
              <BillCard key={b.id} bill={b} onPrint={handlePrint} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BillCard({ bill, onPrint }: { bill: Bill; onPrint: (b: Bill) => void }) {
  return (
    <div className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition-all ${
      bill.printed
        ? "bg-slate-50 border-[#e8ecf1]"
        : "bg-white border-[#3b82f6]/30 shadow-sm"
    }`}>
      <div className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-lg ${
        bill.printed ? "bg-slate-100" : "bg-[#3b82f6]/10"
      }`}>
        <Printer className={`h-4 w-4 ${bill.printed ? "text-slate-400" : "text-[#3b82f6]"}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className={`font-extrabold text-sm truncate ${bill.printed ? "text-slate-400" : "text-slate-900"}`}>
          {bill.invoice_no}
        </div>
        <div className="text-xs text-slate-400 truncate mt-0.5">
          {bill.customers?.name ?? "Walk-in"} · {bill.payment_mode?.toUpperCase()}
        </div>
        <div className="text-[11px] text-slate-300 mt-0.5">{fmtDateTime(bill.invoice_date)}</div>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <div className={`font-extrabold text-sm tabular-nums ${bill.printed ? "text-slate-400" : "text-slate-900"}`}>
          {inr(bill.grand_total)}
        </div>
        <button
          onClick={() => onPrint(bill)}
          className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-lg border transition-colors ${
            bill.printed
              ? "bg-white text-slate-500 border-[#e8ecf1] hover:bg-slate-100"
              : "bg-[#3b82f6] text-white border-[#3b82f6] hover:bg-blue-600"
          }`}
        >
          <Printer className="h-3 w-3" />
          {bill.printed ? "Reprint" : "Print"}
        </button>
      </div>
    </div>
  );
}
