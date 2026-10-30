-- The Art Walk map: accounts, friends, notes and "going", plus the extra show fields the map needs.
--
-- Run this once in Supabase: Dashboard → SQL Editor → New query → paste everything → Run.
-- It only ADDS tables and columns. It does not rename, change or delete anything your
-- current app (the-art-walk) or admin page use, so they keep working. Safe to run twice.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Extra fields on your existing tables (all optional; empty is fine)
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.events
  add column if not exists artists      text,               -- "Anjali Rao, Dev Mehta"
  add column if not exists mediums      text[],             -- {Painting,Textile}; falls back to tags
  add column if not exists opening_at   text,               -- "2026-11-07 18:30" (Delhi time)
  add column if not exists open_days    text,               -- "Tue,Wed,Thu,Fri,Sat,Sun" or "Daily"
  add column if not exists open_from    text,               -- "11:00"
  add column if not exists open_to      text,               -- "19:00"
  add column if not exists lat          double precision,   -- only if the venue isn't in galleries
  add column if not exists lng          double precision,
  add column if not exists photos       text[],             -- extra photos; image_url is used first
  add column if not exists photo_credit text,
  add column if not exists show_on_map  boolean not null default true;

alter table public.galleries
  add column if not exists lat           double precision,
  add column if not exists lng           double precision,
  add column if not exists instagram     text,
  add column if not exists website       text,
  add column if not exists default_hours text;              -- "Tue–Sun 11:00–19:00"

-- Curated gallery walks. stops = event ids in walking order.
create table if not exists public.walks (
  id         text primary key,                              -- "lado-sarai"
  title      text not null,
  title_hi   text,
  stops      text[] not null default '{}',
  published  boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.walks enable row level security;
drop policy if exists "walks are public" on public.walks;
create policy "walks are public" on public.walks for select using (published);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Profiles: one per Google sign-in
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  username     text unique check (username ~ '^[a-z0-9_.]{3,24}$'),
  display_name text check (char_length(display_name) <= 40),
  avatar_url   text,
  is_adult     boolean not null default false,              -- confirmed 18+ at sign-up
  created_at   timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Signed-in people can look each other up (to send friend requests). Signed-out visitors can't.
drop policy if exists "profiles visible to signed-in people" on public.profiles;
create policy "profiles visible to signed-in people" on public.profiles
  for select to authenticated using (true);
drop policy if exists "create own profile" on public.profiles;
create policy "create own profile" on public.profiles
  for insert to authenticated with check (id = auth.uid());
drop policy if exists "edit own profile" on public.profiles;
create policy "edit own profile" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- Create the profile automatically the first time someone signs in with Google.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    left(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', ''), 40),
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Friendships: a request that the other person must accept (Facebook style)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.friendships (
  id           bigint generated always as identity primary key,
  requester    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  addressee    uuid not null references public.profiles (id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester <> addressee)
);
-- Only one row per pair of people, whichever way round.
create unique index if not exists friendships_one_per_pair
  on public.friendships (least(requester, addressee), greatest(requester, addressee));
alter table public.friendships enable row level security;

-- You see requests you sent or received. A declined request stays hidden from the person who
-- declined it, and looks like "Requested" to the sender, so nobody is told they were declined.
drop policy if exists "see own friendships" on public.friendships;
create policy "see own friendships" on public.friendships for select to authenticated
  using (requester = auth.uid() or (addressee = auth.uid() and status <> 'declined'));
drop policy if exists "send friend requests" on public.friendships;
create policy "send friend requests" on public.friendships for insert to authenticated
  with check (requester = auth.uid() and status = 'pending' and responded_at is null);
-- Cancel a request you sent, or unfriend. (Declining goes through respond_friend_request.)
drop policy if exists "remove friendships" on public.friendships;
create policy "remove friendships" on public.friendships for delete to authenticated
  using (requester = auth.uid() or (addressee = auth.uid() and status = 'accepted'));
-- No update policy: accepting or declining goes through the function below.

create or replace function public.respond_friend_request(request_id bigint, accept boolean)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.friendships
     set status = case when accept then 'accepted' else 'declined' end,
         responded_at = now()
   where id = request_id and addressee = auth.uid() and status = 'pending';
  if not found then raise exception 'No pending request with that id for you'; end if;
end $$;
revoke all on function public.respond_friend_request(bigint, boolean) from public, anon;
grant execute on function public.respond_friend_request(bigint, boolean) to authenticated;

create or replace function public.are_friends(a uuid, b uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.friendships
     where status = 'accepted'
       and ((requester = a and addressee = b) or (requester = b and addressee = a))
  );
$$;
revoke all on function public.are_friends(uuid, uuid) from public, anon;
grant execute on function public.are_friends(uuid, uuid) to authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. Notes on shows and "going" to openings: visible to you and your friends only
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.notes (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  show_id    text not null,                               -- events.id
  body       text not null check (char_length(btrim(body)) between 1 and 280),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, show_id)                               -- one note per person per show
);
create index if not exists notes_show on public.notes (show_id);
alter table public.notes enable row level security;
drop policy if exists "read own and friends' notes" on public.notes;
create policy "read own and friends' notes" on public.notes for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
drop policy if exists "write own notes" on public.notes;
create policy "write own notes" on public.notes for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "edit own notes" on public.notes;
create policy "edit own notes" on public.notes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "delete own notes" on public.notes;
create policy "delete own notes" on public.notes for delete to authenticated using (user_id = auth.uid());

create table if not exists public.going (
  user_id    uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  event_id   text not null,                               -- an opening or walk id from the map
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);
alter table public.going enable row level security;
drop policy if exists "read own and friends' going" on public.going;
create policy "read own and friends' going" on public.going for select to authenticated
  using (user_id = auth.uid() or public.are_friends(auth.uid(), user_id));
drop policy if exists "mark going" on public.going;
create policy "mark going" on public.going for insert to authenticated with check (user_id = auth.uid());
drop policy if exists "unmark going" on public.going;
create policy "unmark going" on public.going for delete to authenticated using (user_id = auth.uid());

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Let people delete their own account and everything attached to it
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.delete_my_account()
returns void language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  delete from auth.users where id = auth.uid();   -- cascades to profile, friendships, notes, going
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
