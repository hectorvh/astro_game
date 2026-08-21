# Jerboa's Journey

A research instrument from the SCALA project (Spatial Communication and Ageing across Languages) at ifgi, University of Münster. It is dressed as a short desert adventure: participants help a jerboa travel from a cactus burrow to an oasis while the app records demographics, consent, and (later) mini-game trials.

The vertical slice that is built today is **onboarding → consent → title → map**. Mini-games on the map stops are still placeholders.

## Architecture

This is a **Next.js 16** App Router app. There is one real page (`app/page.tsx`). Everything you see is a client-side screen swapped by session state, not a separate URL per screen.

```
Browser
  └── app/page.tsx
        └── JourneyApp  (components/jerboa/journey-app.tsx)
              ├── SessionProvider  (lib/jerboa/session-context.tsx)
              │     step, participant, login / signup / save / consent
              └── CurrentScreen
                    intro | welcome | signin | login | userdatasetup | settings |
                    information | consent | declined | title | map

Writes
  └── lib/jerboa/data-access.ts     ← stable interface
        ├── postgres  → app/api/*  → local Postgres (`jerboa`)
        ├── supabase  → browser client + RLS
        └── memory    → in-tab Map (lost on reload)
```

### Layers

| Layer | Where | Role |
| --- | --- | --- |
| Screens | `components/jerboa/*-screen.tsx` | UI only. Call `useSession()` to move or save. |
| Flow | `lib/jerboa/session-context.tsx` | Holds `step`, profile draft, and auth status. |
| Data access | `lib/jerboa/data-access.ts` | `signUp` (userid check), `createAccount`, `logIn`, `saveParticipant`, `recordConsent`. |
| Backend switch | `lib/jerboa/backend.ts` | Reads `NEXT_PUBLIC_JERBOA_BACKEND`. |
| HTTP API | `app/api/...` | Used in **postgres** mode. The browser never talks to Postgres. |
| Database | `db/local.sql` | Users, languages, trials. Existing databases: `pnpm db:merge`. |

**Postgres mode (local default):** Next.js route handlers use `pg` and Unix-socket peer auth. Identity is one httpOnly cookie (`jerboa_participant` = `users.id`). Passwords are stored as `scrypt` hashes, never in plaintext. A user row is written only when **Create account** succeeds at the end of sign-in.

**Supabase mode:** the browser talks to a hosted project with the publishable key. Row-level security is required. The migration in `supabase/migrations/` is a **different** schema (`auth.uid()`); do not apply it to the local `jerboa` database.

**Memory mode:** no database. Fine for UI work; answers disappear on reload.

### Persistence (postgres)

- `users` — userid, password hash, name, age range, gender, country, UI language, consent version and timestamp
- `user_languages` — language + fluency (at least one required)
- `data` — mini-game trials (schema ready; games not built yet)

## Screens

`JourneyApp` reads `step` and renders one component. The first seven screens sit in a card (`PanelStage`). Title and Map are full-bleed scenes.

| Step | Screen | File | What it does |
| --- | --- | --- | --- |
| `intro` | Opening video | `intro-screen.tsx` | Plays on first load, then Welcome. |
| `welcome` | Welcome | `welcome-screen.tsx` | Log In, Sign In, UI language. |
| `signin` | Create your user ID | `signin-screen.tsx` | Checks that the userid is free; does not create a row yet. |
| `login` | Welcome back | `login-screen.tsx` | Existing account. **Log In** goes to the home screen. |
| `userdatasetup` | Tell us a bit about yourself | `details-screen.tsx` (`mode="signup"`) | Sign In demographics. Empty form, kept in memory until Create account. |
| `settings` | Tell us a bit about yourself | `details-screen.tsx` (`mode="settings"`) | Edit the logged-in profile. Save returns to home. |
| `information` | Participant Information | `information-screen.tsx` | Study explanation (placeholder copy). |
| `consent` | Ethical Information & Consent | `consent-screen.tsx` | Tick-box gate, then **Create account** (writes the `users` row, including consent). Decline writes nothing. |
| `declined` | Thank you for your time | `declined-screen.tsx` | Terminal state after Decline. |
| `title` | Home menu | `title-screen.tsx` | Start Playing, Settings, About, Exit. |
| `map` | Desert trail | `map-screen.tsx` | Five stops. Mini-games are “coming soon”. |

The step name `userdatasetup` and the file `details-screen.tsx` differ on purpose: the file still uses the older `DetailsScreen` export.

```
Intro video (first load only)
 └── Welcome
      ├── Sign In (userid check only)
      │     → User data setup (draft)
      │     → Information
      │     → Consent → Create account  →  Title  →  Map
      │                    │
      │                    └── Decline (nothing saved) → Declined
      └── Log In  →  Title  →  Map
```

**Settings** on Title and Map opens the settings step with the saved profile. Saving returns to Title. **Exit → Back to the start** clears the logged-in user (memory and cookie) so Sign In cannot see the previous account.

Shared UI (not screens): `scene.tsx` (card / backdrop), `form-fields.tsx`, `language-picker.tsx`.

The design brief and research constraints live in `jerboas-journey-technical-spec.md`.

## Run the app

### Requirements

- Node.js 22 (or current LTS)
- [pnpm](https://pnpm.io/)
- Optional: PostgreSQL 16, if you want answers to persist

### Install

```bash
pnpm install
cp .env.example .env.local
```

### Option A — in-memory (no database)

Leave `NEXT_PUBLIC_JERBOA_BACKEND` empty in `.env.local`, or set it to `memory`. Then:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Data is lost when you reload.

### Option B — local Postgres (recommended for real sessions)

1. Create a database named `jerboa` on your local cluster.
2. Put this in `.env.local` (Unix socket, peer auth as your OS user):

```
NEXT_PUBLIC_JERBOA_BACKEND=postgres
DATABASE_URL=postgresql:///jerboa?host=/var/run/postgresql
```

3. Apply the schema (tables, grants, and the `hector` login role used by `db/apply.sh`):

```bash
pnpm db:apply          # empty database
pnpm db:merge          # existing database that still has an `accounts` table
```

`pnpm db:apply` / `pnpm db:merge` use Docker as the `postgres` OS user to talk to the Unix socket.

4. Start the Next.js server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

Useful extras:

```bash
pnpm db:psql          # open a SQL shell on database jerboa
pnpm build && pnpm start   # production server on port 3000
```

This is **not** a static export. API routes need a Node server (`pnpm dev` or `pnpm start`). A Netlify deploy uses `@netlify/plugin-nextjs` with **Build command** `pnpm run build:netlify` (copies the Unity WebGL files into `public/game-build`, then `next build`) and `NEXT_PUBLIC_JERBOA_BACKEND=memory` (UI only; answers are not persisted). Leave **Base directory** and **Publish directory** empty — the app lives at the repo root and the Next plugin owns the publish folder.

### Option C — Supabase

Set `NEXT_PUBLIC_JERBOA_BACKEND=supabase` plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep the secret key off disk and out of git. Use the files under `supabase/`, not `db/local.sql`.
