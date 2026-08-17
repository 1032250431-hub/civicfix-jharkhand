-- CivicFix: fix citizen "Still not fixed" / reopen action
-- Run this ONCE in the Supabase SQL Editor.
-- This does not change complaint data or user accounts.

begin;

-- Replace the two overlapping citizen UPDATE policies with one explicit policy.
drop policy if exists "citizen verifies own resolved complaint" on public.complaints;
drop policy if exists "citizen reports unresolved resolution" on public.complaints;

create policy "citizen can verify or reopen own resolved complaint"
on public.complaints
for update
to authenticated
using (
  citizen_id = (select auth.uid())
  and status = 'Resolved'
)
with check (
  citizen_id = (select auth.uid())
  and status in ('Verified', 'In Progress')
);

commit;

-- Verification: this should return the new policy name.
select policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename = 'complaints'
  and policyname = 'citizen can verify or reopen own resolved complaint';
