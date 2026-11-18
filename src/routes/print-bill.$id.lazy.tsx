import { createLazyFileRoute, getRouteApi } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { inr, fmtDate } from "@/lib/codes";

export const Route = createLazyFileRoute("/print-bill/$id")({ component: PrintBill });

const routeApi = getRouteApi("/print-bill/$id");

function PrintBill() {
  const { id } = routeApi.useParams();
  const [s, setS] = useState<any>(null);
  const [items, setItems] = useState<any[]>([]);
  const [shop, setShop] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const [a, b, c] = await Promise.all([
        supabase.from("sales").select("*, customers(*)").eq("id", id).single(),
        supabase.from("sales_items").select("*, products(name, hsn)").eq("sale_id", id),
        supabase.from("app_settings").select("*").eq("id", true).maybeSingle(),
      ]);
      setS(a.data); setItems(b.data ?? []); setShop(c.data);
    })();
  }, [id]);

  useEffect(() => {
    if (!s) return;
    // Small delay so the browser finishes rendering before the dialog opens
    const t = setTimeout(() => { window.print(); }, 400);
    return () => clearTimeout(t);
  }, [s]);

  if (!s) return <div style={{ padding: 16, fontFamily: "sans-serif", fontSize: 12 }}>Loading…</div>;

  const shopName = shop?.shop_name ?? "National Hardware";
  const subtotal = Number(s.subtotal);
  const discount = Number(s.discount ?? 0);
  const cgst = Number(s.cgst ?? 0);
  const sgst = Number(s.sgst ?? 0);
  const igst = Number(s.igst ?? 0);
  const grandTotal = Number(s.grand_total);

  return (
    <>
      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        body { font-family: Arial, sans-serif; background: #fff; color: #000; }
        @page { size: A5 portrait; margin: 8mm; }
        @media print {
          html, body { width: 148mm; }
          .no-print { display: none !important; }
          .header { background: #1e293b !important; color: #fff !important; }
          .meta-box { background: #f8fafc !important; }
          thead tr { background: #1e293b !important; color: #fff !important; }
          tr:nth-child(even) td { background: #f8fafc !important; }
        }
        .bill { width: 100%; max-width: 148mm; margin: 0 auto; font-size: 10pt; }
        .header { background: #1e293b; color: #fff; padding: 8px 10px; display: flex; justify-content: space-between; align-items: flex-start; }
        .shop-name { font-size: 13pt; font-weight: 800; letter-spacing: -0.3px; }
        .shop-sub { font-size: 7.5pt; opacity: 0.8; margin-top: 2px; }
        .inv-block { text-align: right; }
        .inv-no { font-size: 12pt; font-weight: 800; }
        .inv-label { font-size: 7pt; text-transform: uppercase; letter-spacing: 1px; opacity: 0.7; }
        .inv-date { font-size: 8pt; opacity: 0.85; margin-top: 2px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
        .meta-box { background: #f8fafc; border-radius: 4px; padding: 5px 7px; }
        .meta-label { font-size: 7pt; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.5px; margin-bottom: 2px; }
        .meta-val { font-size: 9pt; font-weight: 700; }
        .meta-sub { font-size: 7.5pt; color: #64748b; margin-top: 1px; }
        table { width: 100%; border-collapse: collapse; margin: 6px 0; font-size: 8.5pt; }
        thead tr { background: #1e293b; color: #fff; }
        th { padding: 4px 5px; font-size: 7.5pt; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; }
        td { padding: 3px 5px; border-bottom: 1px solid #f1f5f9; }
        tr:nth-child(even) td { background: #f8fafc; }
        .tr { text-align: right; }
        .tl { text-align: left; }
        .item-name { font-weight: 600; }
        .item-hsn { font-size: 7pt; color: #94a3b8; }
        .totals { margin: 0 10px 6px; }
        .tot-row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 8.5pt; }
        .tot-row.grand { border-top: 1.5px solid #1e293b; margin-top: 4px; padding-top: 4px; font-size: 10.5pt; font-weight: 800; }
        .tot-label { color: #475569; }
        .tot-val { font-weight: 600; font-variant-numeric: tabular-nums; }
        .discount { color: #dc2626; }
        .footer { border-top: 1px solid #e2e8f0; padding: 5px 10px; display: flex; justify-content: space-between; font-size: 7.5pt; color: #64748b; margin-top: 4px; }
        .px { padding-left: 10px; padding-right: 10px; }
      `}</style>

      <div className="bill">
        {/* Header */}
        <div className="header">
          <div>
            <div className="shop-name">{shopName}</div>
            {shop?.address && <div className="shop-sub">{shop.address}</div>}
            {shop?.gstin && <div className="shop-sub">GSTIN: {shop.gstin}</div>}
          </div>
          <div className="inv-block">
            <div className="inv-label">Tax Invoice</div>
            <div className="inv-no">{s.invoice_no}</div>
            <div className="inv-date">{fmtDate(s.invoice_date)}</div>
          </div>
        </div>

        {/* Bill To + Invoice Details */}
        <div className="meta">
          <div className="meta-box">
            <div className="meta-label">Bill To</div>
            <div className="meta-val">{s.customers?.name ?? "Walk-in customer"}</div>
            {s.customers?.phone && <div className="meta-sub">Ph: {s.customers.phone}</div>}
            {s.customers?.gstin && <div className="meta-sub">GSTIN: {s.customers.gstin}</div>}
          </div>
          <div className="meta-box">
            <div className="meta-label">Invoice Details</div>
            <div className="meta-sub" style={{ marginTop: 2 }}>Date: <b>{fmtDate(s.invoice_date)}</b></div>
            <div className="meta-sub">Payment: <b style={{ textTransform: "uppercase" }}>{s.payment_mode}</b></div>
            <div className="meta-sub">Invoice #: <b>{s.invoice_no}</b></div>
          </div>
        </div>

        {/* Items */}
        <div className="px">
          <table>
            <thead>
              <tr>
                <th className="tl">Item</th>
                <th className="tl">HSN</th>
                <th className="tr">Qty</th>
                <th className="tr">Rate</th>
                <th className="tr">GST%</th>
                <th className="tr">Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id}>
                  <td>
                    <div className="item-name">{it.products?.name ?? "Item"}</div>
                    {it.item_instance_id && <div className="item-hsn">{it.item_instance_id}</div>}
                  </td>
                  <td>{it.products?.hsn ?? "—"}</td>
                  <td className="tr">{it.qty}</td>
                  <td className="tr">{inr(it.rate)}</td>
                  <td className="tr">{it.gst_rate}%</td>
                  <td className="tr" style={{ fontWeight: 600 }}>{inr(it.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="totals">
          <div className="tot-row"><span className="tot-label">Subtotal</span><span className="tot-val">{inr(subtotal)}</span></div>
          {discount > 0 && <div className="tot-row"><span className="tot-label">Discount</span><span className="tot-val discount">− {inr(discount)}</span></div>}
          {cgst > 0 && <div className="tot-row"><span className="tot-label">CGST</span><span className="tot-val">{inr(cgst)}</span></div>}
          {sgst > 0 && <div className="tot-row"><span className="tot-label">SGST</span><span className="tot-val">{inr(sgst)}</span></div>}
          {igst > 0 && <div className="tot-row"><span className="tot-label">IGST</span><span className="tot-val">{inr(igst)}</span></div>}
          <div className="tot-row grand"><span>Grand Total</span><span>{inr(grandTotal)}</span></div>
        </div>

        {/* Footer */}
        <div className="footer">
          <span>Thank you — {shopName}</span>
          <span>System-generated invoice</span>
        </div>
      </div>

      <div className="no-print" style={{ padding: "16px", textAlign: "center" }}>
        <button
          onClick={() => window.print()}
          style={{ padding: "8px 20px", background: "#1e293b", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          🖨 Print Again
        </button>
        <button
          onClick={() => window.close()}
          style={{ marginLeft: 8, padding: "8px 20px", background: "#f1f5f9", color: "#334155", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13 }}
        >
          Close
        </button>
      </div>
    </>
  );
}
