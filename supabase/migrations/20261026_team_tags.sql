-- One row per team tag. team_members.tags stays the source of who has a tag;
-- this table decides which tags the marketing site shows as /team tabs.
-- New tags default to hidden, so a tab only appears after an admin turns it on.
create table if not exists public.team_tags (
  -- Stored lowercase, like team_members.tags. "all" is the site's built-in tab.
  name text primary key
    check (name <> '' and name <> 'all' and name = lower(btrim(name))),
  -- Display spelling when the creator typed capitals ("ESG"); null means
  -- the site title-cases the name ("real estate" -> "Real Estate").
  label text
    check (label is null or lower(regexp_replace(btrim(label), '\s+', ' ', 'g')) = name),
  show_on_site boolean not null default false,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.team_tags enable row level security;

-- Public read so the marketing site's anon client can build the tab list.
-- No write policy: the CMS writes through the service-role client after its
-- own role check.
drop policy if exists "team_tags_public_read" on public.team_tags;
create policy "team_tags_public_read"
  on public.team_tags
  for select
  using (true);

-- Today's site tabs, in today's order, plus the one internal tag in use.
insert into public.team_tags (name, label, show_on_site, sort_order) values
  ('consulting', 'Consulting', true, 1),
  ('capital', 'Capital', true, 2),
  ('real estate', 'Real Estate', true, 3),
  ('asset management', 'Asset Management', false, 100)
on conflict (name) do nothing;
