# Dash Board Handoff

## Current Goal

Build a private personal operating-system dashboard that can be accessed from any device. It currently supports authentication, calendar/day navigation, habits, tasks, cloud sync, and a placeholder Health workspace.

## Repo / Deployment

- Local app path: `C:\Users\abram\Documents\Dash Board\dash-board-app`
- GitHub repo: `https://github.com/ItsAbram/dash-board-app`
- Branch: `main`
- Vercel imports from GitHub and auto-deploys on push to `main`
- Latest known commit at handoff: `5bb0dc8 Add automatic cloud sync`

## Stack

- Next.js `16.2.6`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- Supabase JS `^2.106.0`
- Node locally: `v24.15.0`
- npm locally: `11.12.1`

Useful commands:

```bash
npm.cmd run dev
npm.cmd run lint
npm.cmd run build
```

Git path on this machine:

```text
C:\Program Files\Git\cmd\git.exe
```

## Environment Variables

Required in Vercel and local `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...
GOOGLE_WORKOUT_SHEET_ID=...
```

Use the Supabase Project URL and Publishable/Anon key. Do not use the service role key in the browser.
Google credentials are server-only and are used by `/api/workouts/sync`.

## Supabase

Current schema file:

```text
supabase-schema.sql
```

Current model:

- Table: `public.dashboard_state`
- One row per authenticated user
- `id` is currently set to the user id
- `user_id` references `auth.users(id)`
- `data` is a JSON blob containing app state
- RLS is enabled
- Policies allow authenticated users to read/write/delete only their own row

Important: run `supabase-schema.sql` in Supabase SQL Editor whenever schema/policy changes are made.

Auth:

- Email/password auth is implemented.
- Login screen is gated: dashboard does not render until signed in.
- If Supabase email confirmation is enabled, users must confirm email before sign-in.
- For easier testing, disable email confirmation in Supabase Auth settings.

## App Behavior

### Authentication

Implemented in:

- `src/app/page.tsx`
- `src/components/auth/AuthPanel.tsx`

Behavior:

- Signed-out users see only the login screen.
- Auth buttons have working states.
- Error messages translate common Supabase issues:
  - email not confirmed
  - signup rate limit

### Dashboard

Main files:

- `src/app/page.tsx`
- `src/components/dashboard/DashboardWorkspace.tsx`
- `src/components/dashboard/CalendarView.tsx`
- `src/components/ui/MetricTile.tsx`
- `src/components/ui/Panel.tsx`
- `src/components/ui/ToggleListItem.tsx`

Features:

- Week/month calendar view
- Selected day drives displayed tasks and habit check-ins
- Habits are reusable across days
- Habit completion is stored by date key
- Tasks are day-specific through `dateKey`
- Dashboard uses neutral dark mode:
  - black/charcoal surfaces
  - gray borders/text
  - amber accent
  - red delete action

### Cloud Sync

Implemented in `src/app/page.tsx`.

Behavior:

- Auto-loads cloud state after sign-in.
- Auto-saves after local changes with a short debounce.
- Manual fallback buttons remain:
  - Manual Load
  - Manual Save
- Sync statuses include:
  - `Loading cloud data...`
  - `Loaded from cloud.`
  - `Local changes.`
  - `Saving...`
  - `Saved.`
  - `Save failed: ...`

### Date Handling

Implemented in:

- `src/lib/calendar.ts`
- `src/lib/dashboard-state.ts`

Important decision:

- Date keys use local browser date parts, not `toISOString()`, to avoid UTC shifting the date.
- Date keys are `YYYY-MM-DD`.

## Current Data Shape

Types live in:

```text
src/types/dashboard.ts
```

Current state shape:

```ts
type DashboardState = {
  habits: Habit[];
  tasks: Task[];
  focus: Record<string, string>;
};
```

`focus` still exists in state for compatibility, but the dashboard no longer exposes a Focus input. The old Focus card was replaced by a Health Workspace button.

## Workout Planner

Route:

```text
/health
```

File:

```text
src/app/health/page.tsx
```

Current status:

- Spreadsheet-driven workout execution page.
- Google Sheets is the planning/template source.
- Supabase stores synced workout plans and completion/checkoff history.
- Actual lifting performance is stored as editable per-set rows in `workout_exercise_sets`.
- Manual sync endpoint: `/api/workouts/sync`.
- Sheet template CSV files live in `workout-sheet-template/`.

Required Google Sheet tabs:

- `Blocks`
- `Sessions`
- `Exercises`
- `Templates`

Important setup:

- Run `supabase-schema.sql` after pulling this version.
- Create/copy the Google Sheet from the template CSV files.
- Share the Sheet with `GOOGLE_SERVICE_ACCOUNT_EMAIL`.
- Set `GOOGLE_WORKOUT_SHEET_ID` from the Sheet URL.
- Viewer access is enough because the app only reads plans from the sheet.

## Known Issues / Notes

- Supabase signup may show rate-limit errors if Create is pressed repeatedly. Wait before retrying.
- If email confirmation is enabled, sign-in will fail until the email is confirmed.
- Grammarly/browser extensions can cause hydration warnings by injecting body attributes. `suppressHydrationWarning` is set on `<body>` in `src/app/layout.tsx`.
- Manual sync buttons remain as fallback even though auto-sync is active.
- Data is still stored as one JSON blob. This is acceptable for early UX shaping but should eventually move to normalized Supabase tables.

## Recommended Next Steps

1. Run the updated Supabase schema in Supabase SQL Editor.
2. Create the Google Sheet from `workout-sheet-template/`.
3. Add Google service account env vars locally and in Vercel.
4. Test `/health` manual Sync Sheet.
5. Consider restricting auth to one allowed email if this remains a single-user private app.

## Verification Before Handoff

Last verified:

```bash
npm.cmd run lint
npm.cmd run build
```

Both passed.
