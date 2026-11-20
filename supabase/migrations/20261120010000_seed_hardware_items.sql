-- Seed common hardware items under the HARDWARE root node.
-- Skips gracefully if the HARDWARE root doesn't exist or items are already present.
do $$
declare
  hw_root uuid;
  cat_id  uuid;
  sub_id  uuid;
begin
  -- Find HARDWARE root
  select id into hw_root
  from public.inventory_nodes
  where parent_id is null and name = 'HARDWARE';

  if hw_root is null then
    raise notice 'HARDWARE root not found – skipping hardware seed';
    return;
  end if;

  -- ── Hinges ──────────────────────────────────────────────────────────
  -- (may already exist; insert only if the category has no children yet)
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Hinges', hw_root, 1
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Hinges'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Hinges';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Butt Hinge 2"',   cat_id, 1),
      ('Butt Hinge 3"',   cat_id, 2),
      ('Butt Hinge 4"',   cat_id, 3),
      ('Concealed Hinge 35mm', cat_id, 4),
      ('Concealed Hinge 40mm', cat_id, 5),
      ('Piano Hinge',     cat_id, 6),
      ('Flush Hinge',     cat_id, 7),
      ('Spring Hinge',    cat_id, 8);
  end if;

  -- ── Handles ─────────────────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Handles', hw_root, 2
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Handles'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Handles';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Cabinet Handle 96mm',  cat_id, 1),
      ('Cabinet Handle 128mm', cat_id, 2),
      ('Cabinet Handle 160mm', cat_id, 3),
      ('Cabinet Handle 192mm', cat_id, 4),
      ('Cabinet Handle 224mm', cat_id, 5),
      ('Cabinet Handle 256mm', cat_id, 6),
      ('Pull Handle 6"',       cat_id, 7),
      ('Pull Handle 8"',       cat_id, 8),
      ('Pull Handle 10"',      cat_id, 9),
      ('Pull Handle 12"',      cat_id, 10),
      ('Flush Handle',         cat_id, 11),
      ('Ring Handle',          cat_id, 12);
  end if;

  -- ── Locks ────────────────────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Locks', hw_root, 3
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Locks'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Locks';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Mortise Lock',        cat_id, 1),
      ('Rim Lock',            cat_id, 2),
      ('Deadbolt Lock',       cat_id, 3),
      ('Pad Lock 25mm',       cat_id, 4),
      ('Pad Lock 40mm',       cat_id, 5),
      ('Pad Lock 50mm',       cat_id, 6),
      ('Almirah Lock',        cat_id, 7),
      ('Drawer Lock',         cat_id, 8),
      ('Glass Door Lock',     cat_id, 9),
      ('Hasp & Staple',       cat_id, 10);
  end if;

  -- ── Drawer Systems ───────────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Drawer Systems', hw_root, 4
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Drawer Systems'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Drawer Systems';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    -- Ball bearing channels sub-category
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Ball Bearing Channel', cat_id, 1),
      ('Undermount Drawer',    cat_id, 2),
      ('Soft Close Channel',   cat_id, 3);

    select id into sub_id from public.inventory_nodes where parent_id = cat_id and name = 'Ball Bearing Channel';
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Ball Bearing 10"',  sub_id, 1),
      ('Ball Bearing 12"',  sub_id, 2),
      ('Ball Bearing 14"',  sub_id, 3),
      ('Ball Bearing 16"',  sub_id, 4),
      ('Ball Bearing 18"',  sub_id, 5),
      ('Ball Bearing 20"',  sub_id, 6),
      ('Ball Bearing 24"',  sub_id, 7);

    select id into sub_id from public.inventory_nodes where parent_id = cat_id and name = 'Soft Close Channel';
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Soft Close 10"',  sub_id, 1),
      ('Soft Close 12"',  sub_id, 2),
      ('Soft Close 14"',  sub_id, 3),
      ('Soft Close 16"',  sub_id, 4),
      ('Soft Close 18"',  sub_id, 5),
      ('Soft Close 20"',  sub_id, 6),
      ('Soft Close 24"',  sub_id, 7);
  end if;

  -- ── Screws & Fasteners ───────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Screws & Fasteners', hw_root, 5
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Screws & Fasteners'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Screws & Fasteners';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Wood Screw 1"',      cat_id, 1),
      ('Wood Screw 1.5"',    cat_id, 2),
      ('Wood Screw 2"',      cat_id, 3),
      ('Wood Screw 2.5"',    cat_id, 4),
      ('Wood Screw 3"',      cat_id, 5),
      ('Particle Board Screw 3.5x16', cat_id, 6),
      ('Particle Board Screw 3.5x25', cat_id, 7),
      ('Confirmat Screw',    cat_id, 8),
      ('Dowel Pin 8x35',     cat_id, 9),
      ('Cam Lock Nut',       cat_id, 10),
      ('Minifix Connector',  cat_id, 11);
  end if;

  -- ── Cabinet Fittings ─────────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Cabinet Fittings', hw_root, 6
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Cabinet Fittings'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Cabinet Fittings';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Soft Close Damper',   cat_id, 1),
      ('Door Stopper',        cat_id, 2),
      ('Magnetic Catch',      cat_id, 3),
      ('Bullet Catch',        cat_id, 4),
      ('Shelf Pin',           cat_id, 5),
      ('Shelf Support Clip',  cat_id, 6),
      ('Corner Bracket',      cat_id, 7),
      ('L-Bracket',           cat_id, 8),
      ('T-Bracket',           cat_id, 9),
      ('Connecting Bolt',     cat_id, 10),
      ('Lazy Susan Bearing',  cat_id, 11),
      ('Wire Basket',         cat_id, 12),
      ('Pull-out Tray',       cat_id, 13);
  end if;

  -- ── Glass & Mirror Fittings ──────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Glass Fittings', hw_root, 7
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Glass Fittings'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Glass Fittings';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Glass Hinge',         cat_id, 1),
      ('Glass Clip',          cat_id, 2),
      ('Glass Channel',       cat_id, 3),
      ('Glass Door Handle',   cat_id, 4),
      ('Mirror Clip',         cat_id, 5),
      ('Pivot Hinge',         cat_id, 6);
  end if;

  -- ── Wardrobe Fittings ────────────────────────────────────────────────
  insert into public.inventory_nodes(name, parent_id, sort)
    select 'Wardrobe Fittings', hw_root, 8
    where not exists (
      select 1 from public.inventory_nodes where parent_id = hw_root and name = 'Wardrobe Fittings'
    );

  select id into cat_id from public.inventory_nodes where parent_id = hw_root and name = 'Wardrobe Fittings';

  if not exists (select 1 from public.inventory_nodes where parent_id = cat_id) then
    insert into public.inventory_nodes(name, parent_id, sort) values
      ('Cloth Rail',          cat_id, 1),
      ('Cloth Rail Bracket',  cat_id, 2),
      ('Trouser Rack',        cat_id, 3),
      ('Tie Rack',            cat_id, 4),
      ('Shoe Rack',           cat_id, 5),
      ('Trouser Pull Out',    cat_id, 6),
      ('Magic Corner',        cat_id, 7),
      ('Pantograph Lift',     cat_id, 8);
  end if;

end $$;
