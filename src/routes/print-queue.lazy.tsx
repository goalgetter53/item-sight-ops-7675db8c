import { createLazyFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-store";
import { inr, fmtDateTime } from "@/lib/codes";
import { Printer, Wifi, WifiOff, LogOut, Clock, CheckCheck } from "lucide-react";
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
        let customerName = "Walk-in";
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
        setTimeout(() => {
          openPrintWindow(row.id);
          setBills((prev) => prev.map((b) => b.id === row.id ? { ...b, printed: true } : b));
        }, 300);
        toast.success(`New bill ${row.invoice_no} — auto-printing`);
      })
      .subscribe((status) => { setOnline(status === "SUBSCRIBED"); });
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
    <div className="min-h-dvh flex flex-col bg-zinc-50" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>

      {/* Top bar */}
      <header className="bg-zinc-900 px-6 py-0 h-14 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-7 h-7 rounded bg-white/10">
            <Printer className="h-4 w-4 text-white" />
          </div>
          <div>
            <span className="text-white font-semibold text-sm tracking-tight">Print Station</span>
            <span className="text-zinc-500 text-xs ml-3 hidden sm:inline">ScanFlow ERP</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
            online ? "bg-emerald-500/15 text-emerald-400" : "bg-red-500/15 text-red-400"
          }`}>
            {online
              ? <><Wifi className="h-3 w-3" />Live</>
              : <><WifiOff className="h-3 w-3" />Offline</>}
          </div>
          <button
            onClick={() => { logout(); nav({ to: "/login" }); }}
            className="flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign out
          </button>
        </div>
      </header>

      {/* Stats strip */}
      <div className="border-b border-zinc-200 bg-white px-6 py-2.5 flex items-center gap-6 shrink-0">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold tabular-nums">
            {pending.length > 99 ? "99+" : pending.length}
          </span>
          <span className="text-sm text-zinc-600">pending</span>
        </div>
        <div className="w-px h-4 bg-zinc-200" />
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold tabular-nums">
            {printed.length > 99 ? "99+" : printed.length}
          </span>
          <span className="text-sm text-zinc-600">printed today</span>
        </div>
      </div>

      {/* Two-column queue */}
      <div className="flex-1 grid grid-cols-2 overflow-hidden">

        {/* Pending column */}
        <div className="flex flex-col border-r border-zinc-200 overflow-hidden">
          <div className="border-l-4 border-l-red-500 bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <Clock className="h-3.5 w-3.5 text-red-500" />
              <span className="text-sm font-semibold text-zinc-800">Queue</span>
            </div>
            <span className="text-xs text-zinc-400 tabular-nums">{pending.length} bills</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {pending.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400 gap-2">
                <CheckCheck className="h-6 w-6 text-zinc-300" />
                <span className="text-sm">All caught up</span>
              </div>
            )}
            {pending.map((b, i) => (
              <BillRow key={b.id} bill={b} onPrint={handlePrint} variant="pending" zebra={i % 2 === 1} />
            ))}
          </div>
        </div>

        {/* Printed column */}
        <div className="flex flex-col overflow-hidden">
          <div className="border-l-4 border-l-emerald-500 bg-white px-4 py-3 border-b border-zinc-200 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <CheckCheck className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-sm font-semibold text-zinc-800">Printed</span>
            </div>
            <span className="text-xs text-zinc-400 tabular-nums">{printed.length} bills</span>
          </div>
          <div className="flex-1 overflow-y-auto bg-white">
            {printed.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 text-zinc-400 gap-2">
                <Printer className="h-6 w-6 text-zinc-300" />
                <span className="text-sm">No printed bills yet</span>
              </div>
            )}
            {printed.map((b, i) => (
              <BillRow key={b.id} bill={b} onPrint={handlePrint} variant="printed" zebra={i % 2 === 1} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

function BillRow({
  bill, onPrint, variant, zebra,
}: {
  bill: Bill;
  onPrint: (b: Bill) => void;
  variant: "pending" | "printed";
  zebra: boolean;
}) {
  const isPending = variant === "pending";
  return (
    <div className={`flex items-center gap-3 px-4 h-[52px] border-b border-zinc-100 group transition-colors ${
      zebra ? "bg-zinc-50/60" : "bg-white"
    } hover:bg-blue-50/40`}>
      {/* Invoice number */}
      <span className={`font-mono text-[13px] font-semibold tabular-nums w-28 shrink-0 ${
        isPending ? "text-zinc-900" : "text-zinc-400"
      }`}>
        {bill.invoice_no}
      </span>

      {/* Customer + mode */}
      <div className="flex-1 min-w-0">
        <div className={`text-xs truncate ${isPending ? "text-zinc-700" : "text-zinc-400"}`}>
          {bill.customers?.name ?? "Walk-in"}
        </div>
        <div className="text-[10px] text-zinc-400 uppercase tracking-wide">
          {bill.payment_mode}
        </div>
      </div>

      {/* Amount */}
      <span className={`font-semibold tabular-nums text-sm shrink-0 ${
        isPending ? "text-zinc-900" : "text-zinc-400"
      }`}>
        {inr(bill.grand_total)}
      </span>

      {/* Print button */}
      <button
        onClick={() => onPrint(bill)}
        title={isPending ? "Print" : "Reprint"}
        className={`shrink-0 flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded transition-all ${
          isPending
            ? "bg-zinc-900 text-white hover:bg-zinc-700 opacity-100"
            : "bg-transparent text-zinc-400 border border-zinc-200 hover:border-zinc-400 hover:text-zinc-600 opacity-0 group-hover:opacity-100"
        }`}
      >
        <Printer className="h-3 w-3" />
        {isPending ? "Print" : "Reprint"}
      </button>
    </div>
  );
}
