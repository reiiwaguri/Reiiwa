-- SISI OTAKU CMS
-- Jalankan seluruh file ini di Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now()
);

create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  excerpt text,
  content text,
  image_url text,
  published_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists news_published_at_idx
on public.news (published_at desc);

alter table public.profiles enable row level security;
alter table public.news enable row level security;

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to authenticated;

drop policy if exists "public read news" on public.news;
create policy "public read news"
on public.news for select
to anon, authenticated
using (true);

drop policy if exists "owner insert news" on public.news;
create policy "owner insert news"
on public.news for insert
to authenticated
with check (public.is_owner());

drop policy if exists "owner update news" on public.news;
create policy "owner update news"
on public.news for update
to authenticated
using (public.is_owner())
with check (public.is_owner());

drop policy if exists "owner delete news" on public.news;
create policy "owner delete news"
on public.news for delete
to authenticated
using (public.is_owner());

drop policy if exists "owner read profile" on public.profiles;
create policy "owner read profile"
on public.profiles for select
to authenticated
using (id = auth.uid());

insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do update set public = true;

drop policy if exists "public view news images" on storage.objects;
create policy "public view news images"
on storage.objects for select
to public
using (bucket_id = 'news-images');

drop policy if exists "owner upload news images" on storage.objects;
create policy "owner upload news images"
on storage.objects for insert
to authenticated
with check (bucket_id = 'news-images' and public.is_owner());

drop policy if exists "owner update news images" on storage.objects;
create policy "owner update news images"
on storage.objects for update
to authenticated
using (bucket_id = 'news-images' and public.is_owner())
with check (bucket_id = 'news-images' and public.is_owner());

drop policy if exists "owner delete news images" on storage.objects;
create policy "owner delete news images"
on storage.objects for delete
to authenticated
using (bucket_id = 'news-images' and public.is_owner());

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists news_updated_at on public.news;
create trigger news_updated_at
before update on public.news
for each row execute function public.set_updated_at();
