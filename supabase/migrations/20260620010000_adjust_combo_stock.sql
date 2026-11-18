-- Per-combo tile products (PLY/MICA/HARDWARE) with a single lot row for stock.
-- Purchase 2 adds (+qty), Sales 2 subtracts (-qty), keyed by the item name so both
-- screens resolve the same product. Returns the product id. Allows negative stock.
create or replace function public.adjust_combo_stock(_name text, _category text, _delta int)
returns uuid language plpgsql security definer set search_path = public as $$
declare pid uuid; _sku text; _hsn text;
begin
  _sku := 'COMBO:' || upper(regexp_replace(trim(_name), '\s+', ' ', 'g'));
  _hsn := case upper(_category)
            when 'PLY' then '4412' when 'MICA' then '3920' when 'HARDWARE' then '8302' end;
  select id into pid from products where sku = _sku limit 1;
  if pid is null then
    insert into products(name, sku, category, prefix, hsn, gst_rate, unit, active)
      values (_name, _sku, 'other', left(upper(_category), 4), _hsn, 18, 'pcs', false)
      returning id into pid;
  end if;
  insert into item_instances(id, product_id, is_lot, qty_on_hand, status, barcode_payload, qr_payload)
    values ('LOT-' || pid::text, pid, true, 0, 'available', 'LOT-' || pid::text,
            jsonb_build_object('lot', 'LOT-' || pid::text))
    on conflict (id) do nothing;
  if coalesce(_delta, 0) <> 0 then
    update item_instances set qty_on_hand = coalesce(qty_on_hand, 0) + _delta, updated_at = now()
      where id = 'LOT-' || pid::text;
  end if;
  return pid;
end $$;
grant execute on function public.adjust_combo_stock(text, text, int) to authenticated;
