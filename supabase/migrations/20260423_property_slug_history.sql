-- Tracks prior slugs for a property so that marketing URLs remain stable
-- (and redirect) when an admin explicitly renames the slug.
create table if not exists public.property_slug_history (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  old_slug text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists property_slug_history_old_slug_key
  on public.property_slug_history (old_slug);

create index if not exists property_slug_history_property_id_idx
  on public.property_slug_history (property_id);

alter table public.property_slug_history enable row level security;

-- Public read so the marketing site's anon client can resolve historical slugs.
drop policy if exists "property_slug_history_public_read" on public.property_slug_history;
create policy "property_slug_history_public_read"
  on public.property_slug_history
  for select
  using (true);
