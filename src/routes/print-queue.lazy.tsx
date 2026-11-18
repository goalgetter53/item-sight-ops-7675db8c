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

  // Guard — only printer role
  useEffect(() => {
    if (user && user.role !== "printer") nav({ to: "/login" });
    if (!user) nav({ to: "/login" });
  }, [user, nav]);

  // Load all bills
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

  // Realtime subscription
  useEffect(() => {
    const channel = supabase
      .channel("print-queue-sales")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "sales" }, async (payload) => {
        setOnline(true);
        const row = payload.new as any;
        // Fetch customer name
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
        // Auto-print
        setTimeout(() => { openPrintWindow(row.id); setBills((prev) => prev.map((b) => b.id === row.id ? { ...b, printed: true } : b)); }, 300);
        toast.success(`New bill ${row.invoice_no} — auto-printing`);
      })
      .subscribe((status) => {
        setOnline(status === "SUBSCRIBED");
      });
    return () => { void supabase.removeChannel(channel); };
  }, []);

  // Track online/offline
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
    <div style={{ minHeight: "100dvh", background: "#0f172a", color: "#f8fafc", fontFamily: "system-ui, sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Top bar */}
      <div style={{ background: "#1e293b", padding: "12px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #334155" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Printer size={22} color="#60a5fa" />
          <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.3px" }}>National Hardware — Print Station</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}>
            {online
              ? <><Wifi size={14} color="#4ade80" /><span style={{ color: "#4ade80" }}>Live</span></>
              : <><WifiOff size={14} color="#f87171" /><span style={{ color: "#f87171" }}>Offline</span></>}
          </div>
          <button
            onClick={() => { logout(); nav({ to: "/login" }); }}
            style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "1px solid #475569", color: "#94a3b8", padding: "5px 10px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}
          >
            <LogOut size={12} /> Sign out
          </button>
        </div>
      </div>

      {/* Queue columns */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, overflow: "hidden" }}>
        {/* Pending */}
        <div style={{ borderRight: "1px solid #1e293b", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#1e293b", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #334155" }}>
            <Clock size={15} color="#facc15" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#facc15" }}>Pending</span>
            <span style={{ marginLeft: "auto", background: "#854d0e", color: "#fef08a", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{pending.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {pending.length === 0 && (
              <div style={{ textAlign: "center", color: "#475569", marginTop: 40, fontSize: 13 }}>No pending bills</div>
            )}
            {pending.map((b) => (
              <BillCard key={b.id} bill={b} onPrint={handlePrint} />
            ))}
          </div>
        </div>

        {/* Printed */}
        <div style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 16px", background: "#1e293b", display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #334155" }}>
            <CheckCircle2 size={15} color="#4ade80" />
            <span style={{ fontWeight: 700, fontSize: 13, color: "#4ade80" }}>Printed</span>
            <span style={{ marginLeft: "auto", background: "#14532d", color: "#86efac", borderRadius: 20, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{printed.length}</span>
          </div>
          <div style={{ flex: 1, overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
            {printed.length === 0 && (
              <div style={{ textAlign: "center", color: "#475569", marginTop: 40, fontSize: 13 }}>No printed bills yet</div>
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
    <div style={{
      background: bill.printed ? "#1e293b" : "#1a3a5c",
      border: `1px solid ${bill.printed ? "#334155" : "#2563eb"}`,
      borderRadius: 8,
      padding: "10px 12px",
      display: "flex",
      alignItems: "center",
      gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: bill.printed ? "#94a3b8" : "#f8fafc" }}>
          {bill.invoice_no}
        </div>
        <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
          {bill.customers?.name ?? "Walk-in"} · {bill.payment_mode?.toUpperCase()}
        </div>
        <div style={{ fontSize: 10, color: "#475569", marginTop: 1 }}>{fmtDateTime(bill.invoice_date)}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0 }}>
        <div style={{ fontWeight: 800, fontSize: 14, color: bill.printed ? "#64748b" : "#60a5fa", fontVariantNumeric: "tabular-nums" }}>
          {inr(bill.grand_total)}
        </div>
        <button
          onClick={() => onPrint(bill)}
          style={{
            marginTop: 5,
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: bill.printed ? "#334155" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: 5,
            padding: "4px 10px",
            cursor: "pointer",
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          <Printer size={11} /> {bill.printed ? "Reprint" : "Print"}
        </button>
      </div>
    </div>
  );
}
