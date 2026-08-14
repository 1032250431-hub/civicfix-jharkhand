
-- CIVICFIX FINAL HACKATHON DATABASE
-- Run this entire script in Supabase SQL Editor.

create extension if not exists pgcrypto;

do $$ begin
  create type public.user_role as enum ('citizen','admin','worker');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.complaint_status as enum ('Pending','Assigned','In Progress','Resolved','Verified');
exception when duplicate_object then null; end $$;

create table if not exists public.profiles(
 id uuid primary key references auth.users(id) on delete cascade,
 name text not null,
 email text not null,
 role public.user_role not null default 'citizen',
 created_at timestamptz not null default now()
);

create table if not exists public.complaints(
 id uuid primary key default gen_random_uuid(),
 citizen_id uuid not null references public.profiles(id) on delete cascade,
 category text not null,
 area text not null,
 district text not null default 'Ranchi',
 local_body_type text not null default 'Other Local Body',
 description text not null,
 latitude double precision,
 longitude double precision,
 priority text not null default 'Medium',
 priority_score integer not null default 0 check(priority_score between 0 and 100),
 department text not null,
 status public.complaint_status not null default 'Pending',
 assigned_worker_id uuid references public.profiles(id),
 duplicate_of uuid references public.complaints(id),
 duplicate_count integer not null default 1,
 photo_path text,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);

create index if not exists complaints_location_idx on public.complaints(latitude,longitude);
create index if not exists complaints_status_idx on public.complaints(status);
create index if not exists complaints_priority_idx on public.complaints(priority_score desc);

alter table public.profiles enable row level security;
alter table public.complaints enable row level security;

create or replace function public.current_role()
returns public.user_role
language sql stable security definer set search_path=public
as $$ select role from public.profiles where id=auth.uid() $$;

drop policy if exists "profiles self or operations" on public.profiles;
create policy "profiles self or operations" on public.profiles for select
using(id=auth.uid() or public.current_role() in ('admin','worker'));

drop policy if exists "citizen creates own complaint" on public.complaints;
create policy "citizen creates own complaint" on public.complaints for insert
with check(citizen_id=auth.uid());

drop policy if exists "citizen sees own complaint" on public.complaints;
create policy "citizen sees own complaint" on public.complaints for select
using(citizen_id=auth.uid());

drop policy if exists "admin sees all complaints" on public.complaints;
create policy "admin sees all complaints" on public.complaints for select
using(public.current_role()='admin');

drop policy if exists "worker sees assigned or unassigned complaints" on public.complaints;
create policy "worker sees assigned or unassigned complaints" on public.complaints for select
using(public.current_role()='worker' and (assigned_worker_id=auth.uid() or assigned_worker_id is null));

drop policy if exists "admin updates complaints" on public.complaints;
create policy "admin updates complaints" on public.complaints for update
using(public.current_role()='admin') with check(public.current_role()='admin');

drop policy if exists "worker updates assigned complaints" on public.complaints;
create policy "worker updates assigned complaints" on public.complaints for update
using(public.current_role()='worker' and assigned_worker_id=auth.uid())
with check(public.current_role()='worker' and assigned_worker_id=auth.uid());

drop policy if exists "citizen verifies own resolved complaint" on public.complaints;
create policy "citizen verifies own resolved complaint" on public.complaints for update
using(citizen_id=auth.uid() and status='Resolved')
with check(citizen_id=auth.uid() and status='Verified');

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
 insert into public.profiles(id,name,email,role)
 values(new.id,
        coalesce(new.raw_user_meta_data->>'name',split_part(new.email,'@',1)),
        new.email,
        case when (new.raw_user_meta_data->>'role') in ('admin','worker') then (new.raw_user_meta_data->>'role')::public.user_role else 'citizen'::public.user_role end);
 return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Photo storage bucket. The current demo UI stores GPS + report data; this bucket is ready
-- for the next photo-upload step and can be restricted further with Storage RLS.
insert into storage.buckets(id,name,public) values('complaint-photos','complaint-photos',false)
on conflict(id) do nothing;


-- Jharkhand-specific routing reference:
-- The Government of Jharkhand currently lists 24 districts in 5 divisions.
-- CivicFix stores district + local-body type so a future server-side routing
-- function can send each complaint to the correct ULB/authority.
