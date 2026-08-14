# EXACT DEPLOYMENT CHECKLIST

## A. Create Supabase backend
1. Go to https://supabase.com and create a new project.
2. Open SQL Editor.
3. Paste the entire `supabase.sql` from this folder.
4. Run it.
5. Go to Project Settings → API.
6. Copy:
   - Project URL
   - Publishable/anon key
7. Keep these two values. NEVER put a service-role key in the website.

Supabase provides Postgres, Auth and database authorization/RLS in the same project.

## B. Create demo users
Create three email/password users in Supabase Auth:
- citizen@civicfix.local
- admin@civicfix.local
- worker@civicfix.local

Use password:
CivicFix@123

After creation, open Table Editor → profiles and set:
- citizen role = citizen
- admin role = admin
- worker role = worker

IMPORTANT: only trusted organizers should receive the admin credentials.

## C. Put the code on GitHub
1. Create a new GitHub repository, e.g. `civicfix-india`.
2. Extract this ZIP.
3. Upload ALL files/folders:
   - package.json
   - server.js
   - render.yaml
   - public/
   - supabase.sql
   - README.md
4. Commit to the main branch.

## D. Deploy the public website
Recommended: Render Web Service.

1. Go to https://render.com
2. Create account / sign in.
3. New → Web Service.
4. Connect the GitHub repository.
5. Use:
   Build Command: `npm install`
   Start Command: `npm start`
6. Free plan is enough for hackathon testing.
7. Deploy.

Render will give a public `onrender.com` URL.

## E. IMPORTANT — inject the Supabase credentials
Before deploying, edit `public/index.html`.

Find:
__SUPABASE_URL__
__SUPABASE_ANON_KEY__

Replace them with your Supabase Project URL and publishable/anon key.

Example:
const CONFIG={
 url:"https://xxxxxxxx.supabase.co",
 key:"eyJ..."
};

Then commit/push the change. Render redeploys from GitHub.

NEVER put a Supabase service_role/secret key in `public/index.html`.

## F. Test the PUBLIC URL
Use the Render URL on:
- Android phone
- iPhone if available
- laptop

Test in this order:

1. Citizen login.
2. Tap Report an issue.
3. Tap Use GPS.
4. Allow location permission.
5. Submit a pothole.
6. Confirm it appears on the citizen dashboard.
7. Open the public URL on another browser/device.
8. Sign in as Admin.
9. Confirm the complaint appears on the admin queue/map.
10. Assign worker.
11. Sign in as Worker.
12. Start work.
13. Mark resolved.
14. Sign in as Citizen.
15. Verify resolution.

## G. Jharkhand-specific test data

For the hackathon, use realistic Jharkhand scenarios:
1. Ranchi — Pothole / Road
2. Dhanbad — Garbage / Waste
3. Jamshedpur / East Singhbhum — Broken Streetlight
4. Deoghar — Open Drainage
5. Hazaribagh — Water Leakage

The report form contains all 24 official Jharkhand districts and local-body type selection.

## H. Mobile GPS
GPS requires browser permission. The final public URL must be HTTPS for reliable real-device testing.

## H. Final hackathon presentation
Generate a QR code for the public URL and put it on the final PPT/demo slide.

Judge flow:
Citizen phone → GPS report → Admin dashboard → Worker update → Citizen verification.

## Important production note
The free Render service can sleep after inactivity, and its filesystem is ephemeral. That is why the application uses Supabase as the persistent backend/database rather than storing real complaints in local files.
