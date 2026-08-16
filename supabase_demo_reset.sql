-- CIVICFIX ONE-TIME DEMO DATA RESET
-- Run this ONCE in Supabase SQL Editor after backing up any real complaint data.
-- It deletes all complaint records (including test reports) but preserves users/profiles.
-- It then inserts 4 clean, realistic sample complaints for the first citizen profile.
-- No UI/reset button is added to CivicFix.

begin;

-- Remove all existing complaint records.
-- This also removes duplicate relationships because duplicate_of is self-referencing.
delete from public.complaints;

-- Insert a small, clean set of realistic sample cases.
-- The first citizen profile is used only because complaints require a valid citizen_id.
with demo_citizen as (
  select id from public.profiles
  where role = 'citizen'
  order by created_at asc
  limit 1
)
insert into public.complaints
  (citizen_id, category, area, district, local_body_type, description,
   latitude, longitude, priority, priority_score, department, status,
   duplicate_count, created_at, updated_at)
select * from demo_citizen cross join (values
  (
    'Road / Pothole',
    'Harmu Main Road',
    'Ranchi',
    'Municipal Corporation',
    'A large pothole has developed on the main road and is making two-wheeler and pedestrian movement difficult.',
    23.3729::double precision,
    85.3377::double precision,
    'High',
    88,
    'Roads & Infrastructure',
    'In Progress'::public.complaint_status,
    1,
    now() - interval '3 days',
    now() - interval '1 day'
  ),
  (
    'Garbage / Waste',
    'Sakchi Market',
    'East Singhbhum',
    'Municipal Corporation',
    'Garbage has accumulated beside the market area and has not been cleared regularly.',
    22.8046::double precision,
    86.2029::double precision,
    'Medium',
    62,
    'Sanitation & Waste Management',
    'Pending'::public.complaint_status,
    1,
    now() - interval '2 days',
    now() - interval '2 days'
  ),
  (
    'Water Leakage',
    'Bank More',
    'Dhanbad',
    'Municipal Corporation',
    'A roadside water pipeline appears to be leaking continuously, creating waterlogging near the footpath.',
    23.7957::double precision,
    86.4304::double precision,
    'High',
    81,
    'Water Supply',
    'Assigned'::public.complaint_status,
    1,
    now() - interval '5 days',
    now() - interval '2 days'
  ),
  (
    'Streetlight',
    'Lalpur Main Road',
    'Ranchi',
    'Municipal Corporation',
    'A streetlight near the junction has stopped working, leaving the stretch poorly lit after sunset.',
    23.3567::double precision,
    85.3272::double precision,
    'Medium',
    55,
    'Electrical / Street Lighting',
    'Pending'::public.complaint_status,
    1,
    now() - interval '1 day',
    now() - interval '1 day'
  )
) as v(category, area, district, local_body_type, description, latitude, longitude, priority, priority_score, department, status, duplicate_count, created_at, updated_at);

commit;

-- Verify the clean demo set:
select id, category, area, district, status, priority, latitude, longitude
from public.complaints
order by created_at desc;
