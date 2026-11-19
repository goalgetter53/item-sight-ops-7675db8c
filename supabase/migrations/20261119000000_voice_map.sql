-- Voice calibration map: stores what STT heard for each item per user
create table if not exists voice_map (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade not null,
  item_name   text not null,   -- canonical inventory item fullName
  category    text not null,
  heard_text  text not null,   -- preprocessed STT text (what the mic heard)
  raw_text    text not null,   -- raw STT transcript before preprocessing
  created_at  timestamptz default now(),
  unique (user_id, heard_text)  -- one mapping per unique heard phrase per user
);

alter table voice_map enable row level security;

create policy "users own their voice map"
  on voice_map for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index on voice_map (user_id, heard_text);
