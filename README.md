# Astro Bunny: Galaxy Drift

A research instrument from the SCALA project (Spatial Communication and Ageing across Languages) at ifgi, University of Münster. It is dressed as a space flight: participants help **Astro Bunny**, a supply-run astronaut whose craft drifted through a black hole, hop from world to world while the app can record demographics, consent, and mini-game trials.

The vertical slice that is built today is **Play → logo screens → Welcome → onboarding or guest → menu → Galaxy Drift** (Unity WebGL).

## Architecture

This is a **Next.js 16** App Router app. There is one real page (`app/page.tsx`). Everything you see is a client-side screen swapped by session state, not a separate URL per screen.

```
Browser
  └── app/page.tsx
        └── JourneyApp  (components/jerboa/journey-app.tsx)
              ├── SessionProvider  (lib/jerboa/session-context.tsx)
              │     step, participant, login / signup / guest / save / consent
              └── CurrentScreen
                    start | splash-scala | splash-funders | welcome | signin | login |
                    userdatasetup | settings | information | consent | declined | menu | minigame1 | outro

Writes
  └── lib/jerboa/data-access.ts     ← stable interface
        ├── postgres  → app/api/*  → local Postgres (`jerboa`)
        ├── supabase  → browser client + RLS
        └── memory    → in-tab Map (lost on reload)
```

Galaxy Drift is a Unity WebGL build under `game-buildV11/`. The Next app embeds it in an iframe at `/game-build/play.html?level=<1-4>&mode=<assessment|trial>&embed=1&muted=<0|1>&fs=<0|1>`. The messages between the iframe and the app are defined in [docs/unity-shell-contract.md](docs/unity-shell-contract.md). Locally, `public/game-build/Build`, `TemplateData`, and `StreamingAssets` are symlinks into `game-buildV11/`. `play.html` loads the Brotli files (`.data.br`, `.wasm.br`, `.framework.js.br`) plus the uncompressed `loader.js`; only those are committed. If a Unity export already contains `.br` files (Compression Format: Brotli), use them as they are. If it is uncompressed (as V10 and V11 were), run `node scripts/brotli-unity-build.mjs game-buildVNN` once to write them. The header rules in `netlify.toml` and `next.config.mjs` match any build name (`/game-build/Build/*.wasm.br`, `*.data.br`, `*.framework.js.br`) and send `Content-Encoding: br` with the right type; `pnpm dev` and `pnpm start` both apply them. A new build only needs the symlinks, the four file names in `play.html` and the folder name in `scripts/netlify-build.sh`. `game-buildV10/` stays until V11 is verified on a phone.

### Layers

| Layer | Where | Role |
| --- | --- | --- |
| Screens | `components/jerboa/*-screen.tsx` | UI only. Call `useSession()` to move or save. |
| Flow | `lib/jerboa/session-context.tsx` | Holds `step`, profile draft, guest flag, and auth status. |
| Data access | `lib/jerboa/data-access.ts` | `signUp` (userid check), `createAccount`, `logIn`, `saveParticipant`, `recordConsent`. |
| Backend switch | `lib/jerboa/backend.ts` | Reads `NEXT_PUBLIC_JERBOA_BACKEND`. |
| HTTP API | `app/api/...` | Used in **postgres** mode. The browser never talks to Postgres. |
| Database | `db/local.sql` | Users, languages, trials. Existing databases: `pnpm db:merge`. |
| Mini-game | `game-buildV11/` + `public/game-build/play.html` | Unity WebGL (Galaxy Drift / Astro Bunny Runner). |

**Postgres mode (local default):** Next.js route handlers use `pg` and Unix-socket peer auth. Identity is one httpOnly cookie (`jerboa_participant` = `users.id`). Passwords are stored as `scrypt` hashes, never in plaintext. A user row is written only when **Create account** succeeds at the end of sign-up.

**Supabase mode:** the browser talks to a hosted project with the publishable key. Row-level security is required. The migration in `supabase/migrations/` is a **different** schema (`auth.uid()`); do not apply it to the local `jerboa` database.

**Memory mode:** no database. Fine for UI work and **Access as Guest**; answers disappear on reload.

### Persistence (postgres)

- `users` — userid, password hash, name, age range, gender, country, UI language, consent version and timestamp
- `user_languages` — language + fluency (at least one required)
- `data` — mini-game trials (schema ready; Galaxy Drift does not write trial rows yet)

## Screens

`JourneyApp` reads `step` and renders one component. Welcome through consent sit in a card (`PanelStage`). Play, the logo screens, the menu, and Galaxy Drift are full-bleed.

| Step | Screen | File | What it does |
| --- | --- | --- | --- |
| `start` | Play | `start-screen.tsx` | One Play button. Requests full screen, unlocks audio, then the logo screens. |
| `splash-scala` | SCALA | `splash-screen.tsx` | SCALA logo for 1.5 seconds. |
| `splash-funders` | Project partners | `splash-screen.tsx` | EU and UKRI logos for 1.5 seconds, then Welcome. |
| `welcome` | Welcome | `welcome-screen.tsx` | Log In, Sign Up, **Access as Guest**, UI language. |
| `signin` | Create your user ID | `signin-screen.tsx` | Checks that the userid is free; does not create a row yet. |
| `login` | Welcome back | `login-screen.tsx` | Existing account. **Log In** goes to the menu. |
| `userdatasetup` | Tell us a bit about yourself | `details-screen.tsx` (`mode="signup"`) | Sign Up demographics. Empty form, kept in memory until Create account. |
| `settings` | Tell us a bit about yourself | `details-screen.tsx` (`mode="settings"`) | Edit the logged-in profile. Guest mode does not save. |
| `information` | Participant Information | `information-screen.tsx` | Study explanation (placeholder copy). |
| `consent` | Ethical Information & Consent | `consent-screen.tsx` | Tick-box gate, then **Create account** (writes the `users` row, including consent). Decline writes nothing. |
| `declined` | Thank you for your time | `declined-screen.tsx` | Terminal state after Decline. |
| `menu` | Level menu | `menu-screen.tsx` | Rotary dial with the 4 levels (only Level 1 launches), Information, Settings, Mute. |
| `minigame1` | Galaxy Drift | `minigame-one-screen.tsx` | Unity WebGL embed for the chosen level. Arrow keys / A·D to change lane; Space to fire. |
| `outro` | Mission debrief | `cutscene-screen.tsx` | `astro_bunny.mp4` after Level 1 is completed, then the menu. Skippable. |

The step name `userdatasetup` and the file `details-screen.tsx` differ on purpose: the file still uses the older `DetailsScreen` export. Exiting a level from the pause menu returns to the menu without the video.

**Practice** (the pill under **Launch mission**, or the P key) starts the selected level as a practice run (`mode=trial`). It is offered only for levels with `practice: true` in `lib/jerboa/levels.ts`, does not count as completed, and skips the debrief video. **Launch mission** always sends `mode=assessment`. To test locked levels in `pnpm dev`, set `NEXT_PUBLIC_UNLOCK_ALL_LEVELS=1` in `.env.local`; production builds ignore it.

```
Play (full screen)
 └── SCALA logo (1.5 s)
      └── EU + UKRI logos (1.5 s)
           └── Welcome
                ├── Access as Guest  →  Menu
                ├── Sign Up (userid check only)
                │     → User data setup (draft)
                │     → Information
                │     → Consent → Create account  →  Menu
                │                    │
                │                    └── Decline (nothing saved) → Declined
                └── Log In  →  Menu

Menu → Level 1 → levelComplete → debrief video → Menu
            └── Pause → Exit  →  Menu
```

**Access as Guest** skips signup and the database and opens the menu so you can try Galaxy Drift. No participant row is created.

**Settings** on the menu opens the settings step with the saved profile. Saving returns to the menu. **Log out** (or **Leave guest mode**) at the bottom of Settings clears the logged-in user (memory and cookie) and returns to Welcome, so Sign Up cannot see the previous account.

Shared UI (not screens): `scene.tsx` (card / backdrop), `form-fields.tsx`, `language-picker.tsx`.

Story and character notes live in `astro-bunny-galaxy-drift-story.md`. The playable runner spec is `spatial-paws-astro-bunny-runner-spec.md`. Implementation inventory is `game-logic.md`.

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

Open [http://localhost:3000](http://localhost:3000). Use **Access as Guest** to skip signup. Data is lost when you reload.

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
pnpm db:psql                 # open a SQL shell on database jerboa
pnpm build && pnpm start     # production server on port 3000
```

This is **not** a static export. API routes need a Node server (`pnpm dev` or `pnpm start`).

### Option C — Supabase

Set `NEXT_PUBLIC_JERBOA_BACKEND=supabase` plus `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep the secret key off disk and out of git. Use the files under `supabase/`, not `db/local.sql`.

### Option D — Netlify

Config lives in `netlify.toml`. The site is a Next.js app (not a static export) plus the Unity WebGL files.

| Netlify setting | Value |
| --- | --- |
| Base directory | empty (repo root) |
| Build command | `pnpm run build:netlify` |
| Publish directory | empty (`@netlify/plugin-nextjs` owns it) |
| Node | 22 (`NODE_VERSION` in `netlify.toml`) |
| Backend | `NEXT_PUBLIC_JERBOA_BACKEND=memory` (build-time; guest play only) |

`pnpm run build:netlify` copies `game-buildV11/Build`, `TemplateData`, and `StreamingAssets` into `public/game-build` as real files (the git symlinks would 404 on the CDN), then runs `next build`.

On the live site, use **Access as Guest**. Sign-up and trials are not persisted in memory mode. For a hosted database, use Option C (Supabase) instead of local Postgres.

## Development checks

**WebGL context counter.** In `pnpm dev` only, `lib/jerboa/dev-webgl-counter.ts` (imported by `journey-app.tsx`) counts every WebGL context the page creates. It logs a `console.warn` when one level-menu visit creates more than 3, and exposes the numbers as `window.__astroBunnyWebGL` (`created`, `live`, `visit`). A healthy menu has `live: 1` and `visit: 1`, and Mute clicks or dial rotations add nothing. Browsers keep only a few contexts alive and drop the oldest one past that limit, which blanks the dial. Production builds do not include the counter.

**Game messages without Unity.** While the game is open in `pnpm dev`, `window.__astroBunnyDev` simulates messages from Unity: `completeLevel(level)`, `setMutedFromGame(muted)` and `toggleFullscreenFromGame()` (call the last one from a click handler, because full screen needs a user gesture). See [docs/unity-shell-contract.md](docs/unity-shell-contract.md).

## HUD theme

Tokens and classes for the level menu. Nothing on screen uses them yet. Existing screens keep Nunito and Baloo.

The fonts (Chakra Petch, Barlow, IBM Plex Mono) are loaded with `next/font` and self-hosted at build time. There is no request to Google at runtime.

### Tokens

| Token | Value | Use |
| --- | --- | --- |
| `--hud-bg` / `bg-hud-bg` | `#0A0E14` | Page background. |
| `--hud-bg-2` / `bg-hud-bg-2` | `#0F1620` | A slightly lifted surface. |
| `--hud-panel` / `bg-hud-panel` | `rgba(11,17,25,.82)` | Translucent panel fill. |
| `--hud-panel-solid` | `#0d141d` | Same panel when blur is unavailable. |
| `--hud-cyan` / `text-hud-cyan` | `#00E5FF` | Labels, links, brackets. |
| `--hud-cyan-dim` / `border-hud-cyan-dim` | `rgba(0,229,255,.28)` | Stronger cyan borders. |
| `--hud-cyan-faint` / `border-hud-cyan-faint` | `rgba(0,229,255,.10)` | Hairline panel borders. |
| `--hud-amber` / `text-hud-amber` | `#FF9100` | Focus, hover, emphasis. |
| `--hud-amber-dim` | `rgba(255,145,0,.35)` | Amber borders. |
| `--hud-ink` / `text-hud-ink` | `#E6EDF3` | Body text on the dark background. |
| `--hud-mute` / `text-hud-mute` | `#8296AB` | Secondary text. |
| `--hud-mute-2` | `#56687A` | Decorative lines and disabled states only. On `#0A0E14` it is below 4.5:1, so do not use it for text people must read. |
| `--hud-ok` | `#3DDC84` | A positive status, not a “correct answer” cue. |

`font-hud-display`, `font-hud-body`, and `font-hud-mono` are the three HUD families.

### Classes

| Class | When to use |
| --- | --- |
| `.hud-stage` | Full-bleed backdrop: cyan and amber glows, blueprint grid, scanlines, vignette. Children that must sit above the overlays need `position: relative; z-index: 1`. |
| `.hud-card` | A blurred panel with cyan corner brackets. Falls back to a solid fill when `backdrop-filter` is missing. |
| `.hud-eyebrow` | Short cyan mono label above a title. |
| `.hud-tag` | Muted uppercase mono label. 12px so it stays readable. |
| `.hud-icon-btn` | 48×48 round icon button. Set `data-tip` for the hover/focus label. |
| `.hud-key` | A keyboard keycap. |
| `.hud-focus` | Amber 2px focus ring with a 3px offset. |

Reduced motion turns the HUD transitions and animations off. The screen still shows the same layout.
