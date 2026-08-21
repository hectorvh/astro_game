# Laika Odyssey: A Spatial Adventure — Mini-Game Spec: "Jupiter Run" (Endless Runner / Quiz-Gate Trial)

**Type:** 3D (or 2.5D) lane-based endless runner, Subway-Surfers-style
**Purpose:** A timed mini-game that collects forced-choice spatial-relation responses while staying inside the "fun game" wrapper of Laika Odyssey: A Spatial Adventure.
**Duration:** 60 seconds per playthrough
**Status:** Design spec — not yet implemented. Companion to `jerboas-journey-technical-spec.md` (§8, architecture recommendations for mini-games) — note the whole project's naming/theme is changing; this document assumes the project has moved from the desert/Jerboa concept to a space theme, first level set en route to Jupiter.

> **Re-theme note:** this spec replaces the earlier desert/Jerboa version ("Desert Dash"). All game logic, timing, scoring, and data-model decisions carry over unchanged — only the visual/narrative skin and entity names have changed. Where this doc says "carried over from the desert version, unchanged," treat that as confirmed and skip re-deciding it.

---

## 1. Concept summary

**Laika**, a cartoon dog wearing an astronaut helmet, pilots (or rides in/alongside) a small spacecraft hurtling through space toward **Jupiter**. Laika is fixed on the horizontal screen line near the bottom of the screen, inside/on the spacecraft, and can only shift **sideways** between 4 lanes ("flight lanes" or "rails") of the ship's forward corridor — he never actually moves toward the camera; space and the ship's environment scroll toward him. Every 10 seconds a **checkpoint gate** (4 portals side by side, one per lane) approaches out of the starfield. Each portal displays one of four possible answers to a spatial-relation question shown above the gate. The player must steer Laika into the lane holding the portal with the correct answer before the gate reaches him. Along the way, **asteroids** drift into single lanes; the player either dodges by changing lanes or blasts them with a **laser bolt** for a bonus. Hearts (lives) track error tolerance; a running score tracks correct portals passed. The round ends at 60 s (reaches Jupiter — pass) or at 0 hearts (ship damaged too much — fail), whichever comes first.

This is the **stimulus engine** referred to in the main spec's architecture section — it should be built as a self-contained module that receives a trial list (questions + 4 answer options + which is correct) and emits response events, independent of how it's rendered. This module is theme-agnostic by design, so this space re-skin required no change to the underlying engine — only to the renderer/asset layer, exactly as the architecture recommended.

---

## 2. Research mapping

| Game element | Research meaning |
|---|---|
| The question above the gate | The spatial-relation stimulus (topological / motion / projective / distance — configurable per trial, see §8) |
| The 4 portals | The 4 forced-choice response options, consistent with the project's established forced-choice format |
| Lane chosen at the moment of passing the gate | The recorded `response` |
| Time between gate becoming visible and gate being passed | `response_time_ms` (with the same browser-timing caveats noted in the main spec, §5.2) |
| Correct/incorrect portal | `is_correct` |
| Asteroid dodge/blast events | Secondary engagement data only — **not** spatial-relation data, log separately, do not conflate with trial responses |

**⚠️ Research-validity flag — read before building (carried over, unchanged):** the main spec establishes a firm principle: *rewards must be decoupled from correctness and placed between mini-games, not tied to correct answers, to avoid response bias* (§5.4 of the main spec). This mini-game's core mechanic — hearts lost/gained and score awarded directly for correct/incorrect portals — **directly conflicts with that principle**. Reaching the right portal is simultaneously (a) the measured response and (b) the thing that keeps the ship intact and scores points, which creates strong incentive pressure that could bias how participants answer. This needs an explicit decision from the research team before implementation — options to discuss:
- Keep it as designed and treat this mini-game as intentionally lower-rigor / "warm-up" or an engagement lever, not a primary data source.
- Decouple: award points/hearts for *speed and asteroid-dodging only*, and record the portal choice purely as data without in-game consequence (the portal still "resolves" narratively but doesn't affect hearts/score).
- Reward participation between rounds instead (e.g., a fixed heart/score bonus every N gates regardless of correctness), matching the pattern used elsewhere in the game.

Whichever direction is chosen, log the decision and rationale — this is exactly the kind of "fun game vs. clean data" tension the main spec asks to flag rather than resolve silently.

---

## 3. Screen layout & camera

- **Camera:** fixed, low, slightly-behind-and-above Laika, looking down the 4 lanes toward the vanishing point of the starfield ahead — classic endless-runner third-person view, matching Subway Surfers' point of view exactly. Camera does not move relative to Laika; the world scrolls under/past it.
- **Laika (the dog):** anchored at a fixed screen-space position, roughly bottom-third of the screen, horizontally centered on whichever of the 4 lanes he currently occupies. Cartoon dog character, clearly wearing a rounded astronaut helmet (clear/domed visor, small chest/backpack life-support unit implied) over a simple spacesuit — keep the design friendly and rounded, in the same warm, approachable illustration language established for the project's characters. He plays a looping "running/floating-run" animation at all times (a light zero-g bounce to the run cycle reads well for a space setting); only his lane (x-position) changes, snapping or easing between 4 fixed lane x-coordinates.
- **Lanes:** 4 parallel lanes/rails, evenly spaced, receding toward the horizon point where Jupiter is visible in the distance. Number lanes 0–3 left to right internally; do not show numbers to the participant. Visually, the lanes can read as glowing energy-rail markers on the corridor floor, or as physical rail tracks inside a ship corridor — pick one consistent visual metaphor (see §11).
- **Ground/floor:** rather than sand, the "floor" Laika runs/floats along should be a **ship corridor deck or a glowing energy-walkway suspended in space**, tiled/textured to sell forward motion via scrolling texture or repeating segments — same technique as a desert floor, different texture (metal deck plating, or a starfield "road" with lane-marker light strips).
- **Sky/backdrop:** a deep-space starfield with slow parallax star layers (near stars drift faster than distant ones), plus **Jupiter looming larger and larger in the distance** as the round progresses toward its 60-second mark — a satisfying, legible sense of approach that doubles as an ambient (non-numeric) progress cue (see HUD note below). Soft nebula colour washes (purples/teals) can pick up the project's existing palette (dusty purple, desert teal) so the space level still feels visually related to the rest of the game.
- **HUD (fixed, does not scroll with the world):**
  - Top-left or top-center: **Hearts** — 5 heart icons (or "oxygen/hull integrity" icons if the team prefers a more diegetic space framing — confirm naming, see §14), filled/empty state, in the coral/alert colour from the palette for lost hearts.
  - Top-right: **Score counter**, numeric, increments on each correct portal.
  - Top-center (large, above the approaching gate, in world-space so it recedes with the gate): the **question text**.
  - Bottom or corner: a subtle **60-second timer**, or — better suited to this theme — use **Jupiter's growing size in the backdrop** as the primary ambient progress cue instead of a literal ticking clock, consistent with the main spec's "no visible countdown in trials" principle (§5.3). Flag for research-team decision on whether any numeric timer is shown at all.

---

## 4. Entities

### 4.1 Laika (player, the dog)
- **State:** `lane` (0–3, starts at lane 1 or 2, centred), `isRunning` (always true during play), `hasLaserReady` (cooldown-gated, see §4.4), `hearts` (0–5), `invulnerable` (brief post-hit grace period, e.g. 500 ms, to prevent double-hits from one obstacle).
- **Movement:** discrete lane-to-lane, not free x movement. On a "move left/right" input, `lane` changes by ±1 (clamped 0–3) and Laika eases (e.g. 150–200 ms tween) to the new lane's x-position. Input during an active tween either queues once or is ignored until the tween completes (recommend ignore-until-complete for predictability, since misfired double-lane jumps are a common runner-game complaint).
- **Forward motion:** purely cosmetic run/float-animation; Laika's world-space z-position never changes. Everything else (corridor floor, gates, asteroids, the growing Jupiter backdrop) moves toward him at `scrollSpeed`.

### 4.2 Checkpoint Gate ("Portal Array")
- A set of **4 portals**, one per lane, spawned together as a single synchronised unit at z = spawn distance (far), visually like glowing ring-shaped or arch-shaped energy gates suspended across each lane.
- Each portal displays one answer option (text and/or icon, depending on trial content — spatial-relation answers may be better as icons/diagrams for a cross-language, low-text-dependency instrument; flag with research team, see §8).
- The question text is displayed above the whole gate (spans all 4 lanes) so it's legible before the player commits to a lane, and it moves toward the camera in lock-step with the portals.
- **Resolution:** the moment Laika's z-plane crosses the gate's z-plane, the portal in Laika's current lane is the one "passed through." Compare that portal's `optionId` to the trial's `correctOptionId`.
  - **Correct:** portal flashes/pulses positively (e.g. teal glow, soft chime, small starburst), score +1 (amount TBD, see §6), gate dissolves into light particles, Laika continues.
  - **Incorrect:** portal flashes negatively (coral/red), lose 1 heart, gate dissolves, Laika continues (game does **not** stop or replay the gate — one attempt per gate, consistent with a forced-choice, no-do-over trial design).
- Only **one gate is active/visible at a time.** The next gate does not spawn until the spawn schedule says so (see §5), even if the player passes early or late — cadence is time-based, not distance/event-based, so trial timing stays consistent across participants.

### 4.3 Asteroid (obstacle)
- Spawns in exactly **one lane** at a time, at a position between gates (never overlapping a gate's resolution moment, to avoid confounding a hit/dodge with a portal answer).
- Tumbles/drifts toward Laika at the same `scrollSpeed` as everything else, with a slow rotation for visual interest.
- **Two resolutions:**
  - **Dodge:** Laika is in a different lane than the asteroid when it reaches his z-plane → no effect, asteroid passes harmlessly (visually: it drifts past behind/beside him, or simply despawns just past him).
  - **Hit:** Laika occupies the same lane as the asteroid at resolution and it was not destroyed by a laser bolt → lose 1 heart, Laika plays a brief hit/tumble animation (a little spacesuit spark/impact effect), `invulnerable` grace period starts.
  - **Blasted:** see §4.4 — destroyed before reaching Laika → gain 1 heart (capped at 5), asteroid shatters into a small rock-and-dust burst, does not reach Laika at all.
- Asteroid spawn frequency and lane pattern are independent of gate timing — see §5.3 for suggested cadence.

### 4.4 Laser bolt (player action / shooting mechanic)
- A secondary input (e.g. a distinct button/tap, or an "up" gesture on mobile, or spacebar on desktop) fires a laser bolt **in Laika's current lane**, forward, at a fast fixed speed (faster than `scrollSpeed`, so it reliably reaches an oncoming asteroid before the asteroid reaches Laika if fired with reasonable lead time).
- **Cooldown:** laser has a short cooldown (e.g. 1–1.5 s) to prevent spamming; reflect cooldown state in the UI (e.g. an icon that greys out and refills, like a small recharging-blaster indicator).
- **Collision:** if the bolt's z-position meets an asteroid in the same lane before the asteroid reaches Laika's z-plane, the asteroid is destroyed and the **heart-gain** rule in §4.3 applies. If no asteroid is in that lane, the bolt simply flies off into space with no effect (no penalty for firing "into nothing" — keep the mechanic low-stakes and skill-based rather than punishing).
- Laser bolts should not target or interact with portals/gates in any way — keep the shooting mechanic scoped to asteroids only, so it can't be used (accidentally or deliberately) to influence the recorded spatial-relation response.

### 4.5 Hearts (lives / HUD)
- Integer, range **0–5**, starts at **5**.
- −1 on: incorrect portal, asteroid hit.
- +1 (capped at 5) on: asteroid destroyed by laser bolt.
- At **0 hearts** → immediate game-over (see §7), regardless of time remaining.
- Naming: confirm with the team whether "hearts" stays literal (heart icons) or is re-skinned as "oxygen tanks" / "hull integrity" for diegetic fit with the space theme — either works with the same underlying 0–5 integer logic; this is a pure art/copy decision, not a logic change (see §14).

### 4.6 Score
- Integer, starts at 0, increments only on correct portals (see §6 for whether magnitude should vary).
- Displayed live in the HUD.
- Asteroid dodges/blasts do **not** affect score, to keep score legible as "how many spatial questions did you get right," separate from the arcade side-mechanic. (This is a design recommendation — confirm with the team; see §2's broader flag about tying score to correctness at all.)

---

## 5. Timing & spawn schedule

*(Carried over unchanged — timing logic is theme-independent.)*

- **Round length:** 60 seconds, fixed.
- **Gates:** one checkpoint gate every **10 seconds** → **6 gates per round** (at t = 0s/10s/20s/30s/40s/50s, or offset slightly so the first gate doesn't spawn instantaneously at round start — recommend the first gate becomes visible at t ≈ 3–4 s to give the player a moment of pure flying first).
- **Spawn distance vs. scroll speed:** the gate must be visible far enough in advance that the question text is readable and a lane decision is possible before it arrives, but the 10-second cadence must be exact regardless of player behaviour (this is a **time-locked** stimulus presentation, not distance-locked — critical for consistent `response_time_ms` measurement across participants). Recommended approach:
  - Fix `scrollSpeed` (constant, or only very gently increasing — see difficulty note below).
  - Fix `gateSpawnZ` (how far away a gate appears) such that `travelTime = gateSpawnZ / scrollSpeed` gives a comfortable read-and-decide window (suggest 3.5–5 seconds of travel time).
  - Because gates spawn every 10 s and only take ~4–5 s to arrive, there's clear open space between gates — that gap is exactly where asteroids should live (see below), and it also gives a visible "reset" moment so one trial doesn't visually bleed into the next.
- **Asteroids:** independent, more frequent cadence — suggest an asteroid opportunity roughly every 3–4 seconds in the gaps between gates (not during the 1–2 s immediately before/after a gate resolves, to avoid a hit/dodge and a portal answer being decided in the same instant, which would confound the two data streams and could also feel unfair). This yields roughly 10–14 asteroid events per round. Asteroid lane should be randomised but not repeat the same lane more than twice in a row (prevents the degenerate "always dodge right" strategy).
- **Difficulty curve:** keep `scrollSpeed` **constant across the round**, at least for the mock/first version. An escalating-speed runner is more "game-like" but reintroduces the reaction-time confound the main spec already flags (§5.2) — a faster-arriving stimulus in later trials would not be comparable to an earlier one. If escalating difficulty is wanted for engagement, escalate the *asteroid* frequency/pattern only, never the *gate* timing or approach speed, since only asteroids are non-research arcade content.

---

## 6. Scoring detail (needs research-team input)

*(Carried over unchanged.)*

Two options to decide between:
1. **Flat scoring:** +1 point per correct portal, regardless of anything else. Simple, and doesn't let response speed silently become "the score," which keeps score from being a second incentive pushing participants to rush (compounding the §2 flag).
2. **Speed-weighted scoring:** faster correct answers worth more. **Not recommended** given the project's existing caution around reaction-time noise and around not rewarding response speed in a way that could pressure participants — flagging only because it's a common runner-game pattern that might otherwise be added by default.

Recommend flat scoring (+1) unless the research team wants speed as a secondary engagement signal, in which case keep it purely cosmetic (e.g. a "great reflexes, astronaut!" toast) and not part of the numeric, saved score.

---

## 7. End conditions

| Condition | Outcome | Screen/flow |
|---|---|---|
| Hearts reach 0 at any point | **Game Over** (fail) | Stop the round immediately, show a game-over state (sympathetic, not punitive framing — this is a research participant, not a competitive gamer; avoid harsh "SHIP DESTROYED" tone, prefer something like "Your ship needs a quick repair — let's try that again sometime"), return to map/next mini-game. Log the round as incomplete; still save every trial response collected up to that point — don't discard partial data. |
| 60 seconds elapsed with ≥1 heart remaining | **Round Passed** ("Arrived at Jupiter") | Stop spawning, let the current run animation finish gracefully (don't cut off mid-gate if a gate is still resolving), show a success state — Jupiter now fills the screen, a nice narrative payoff for the level's framing — return to map/next level. |
| Player exits/backgrounds the app mid-round | Edge case — decide: pause and resume, or abandon and log partial data | Flag for team; recommend logging whatever trials were completed and marking the round `incomplete`, consistent with "don't lose data" principle. |

Both outcomes should feel low-stakes and warm in tone/visuals (consistent with the project's friendly, storybook-adjacent visual style, now reinterpreted for space) — this is a data-collection instrument for a broad age range, not a hardcore arcade game, and a punishing "game over" could discourage older-adult participants disproportionately. Confirm tone with the team.

---

## 8. Trial data structure (declarative JSON, per main spec §8)

*(Carried over unchanged, only the `minigame` id changes.)*

Following the main spec's recommendation to define trials as data rather than hard-coded screens:

```json
{
  "minigame": "jupiter_run",
  "trials": [
    {
      "stimulus_id": "jr_proj_003",
      "spatial_category": "projective",
      "question": {
        "text_key": "jr_proj_003_question",
        "media": null
      },
      "options": [
        { "option_id": "a", "label_key": "jr_proj_003_opt_a", "lane_hint": null },
        { "option_id": "b", "label_key": "jr_proj_003_opt_b", "lane_hint": null },
        { "option_id": "c", "label_key": "jr_proj_003_opt_c", "lane_hint": null },
        { "option_id": "d", "label_key": "jr_proj_003_opt_d", "lane_hint": null }
      ],
      "correct_option_id": "b"
    }
  ]
}
```

Notes:
- `text_key` / `label_key` point into the i18n locale files (per main spec §6) rather than raw strings, so the mini-game is translation-ready from day one, matching the project's i18n-first principle.
- **Portal-to-lane assignment should be randomised per participant per trial** (i.e. don't always put the correct answer in the same lane), otherwise position bias (players default-dodging to a "safe" lane) would contaminate the data. This randomisation happens at runtime, not in the JSON.
- `correct_option_id` can be `null` for trials with no single correct answer (consistent with `is_correct` being nullable in the main `data` table) — if this mini-game ever hosts non-forced-choice-correctness trials, the "heart/score" consequence logic needs a defined fallback (e.g. no heart change either way).
- A round of 6 gates needs 6 trials selected per playthrough — decide selection logic (fixed set, randomised per category to guarantee coverage across topological/motion/projective/distance, difficulty-balanced, no-repeat across sessions, etc.) with the research team; this ties into the "Limitation" noted in the original idea note about only getting data from a couple of spatial referencing systems per level — a 6-gate round is a natural place to guarantee **all four categories appear at least once**, e.g. category order `[topological, motion, projective, distance, motion, projective]` or similar, rather than leaving it random.

---

## 9. Logging (extends the main `data` table)

*(Carried over unchanged, only the `minigame` value and terminology change.)*

Each resolved gate should write one row consistent with the existing `data` schema:

| Column | Value for this mini-game |
|---|---|
| `minigame` | `'jupiter_run'` |
| `spatial_category` | from the trial (`topological`/`motion`/`projective`/`distance`) |
| `stimulus_id` | from the trial |
| `response` | `{ "option_id": "<chosen>", "lane": <0-3> }` |
| `is_correct` | boolean, from comparing chosen option to `correct_option_id` |
| `response_time_ms` | time from gate-visible to lane-locked-in (define precisely — see main spec §5.2 caveat) |
| `timestamp` / `ip` | as elsewhere |

Asteroid/laser events are **not** spatial-relation trials and should not be written to the `data` table in the same shape — if they're worth logging at all (e.g. for engagement/UX analysis, not linguistic analysis), use a separate lightweight table (e.g. `minigame_events`) so the two data streams don't get mixed in analysis.

---

## 10. Controls / input

*(Carried over unchanged.)*

- **Desktop:** Left/Right arrow keys or A/D to change lane; Up/Space to fire a laser bolt.
- **Touch (mobile/tablet — the likely primary device for this audience):** swipe left/right to change lane; tap a dedicated on-screen button (not swipe-up, which is easy to fire accidentally on a touch device while trying to lane-change) to fire a laser bolt.
- Given the older-adult participant population and the main spec's accessibility priorities (§7.6): make lane-change gestures forgiving (generous swipe-distance threshold, or offer discrete on-screen left/right buttons as an alternative/supplement to swiping), and make the laser-fire target large and clearly separated from lane-change gestures to avoid accidental mis-taps.

---

## 11. Visual style for this level

Derived from the project's existing storybook aesthetic, reinterpreted for space rather than desert:

- **Laika (the dog):** rounded, friendly cartoon proportions consistent with the project's established character-illustration language — big expressive eyes visible through a clear, domed astronaut helmet visor, floppy ears (may poke out from or be covered by a soft helmet shape — decide per final character sheet), a simple two-tone spacesuit in colours drawn from the existing palette (e.g. a cream/off-white suit body with teal or amber trim, keeping continuity with the rest of the game rather than defaulting to generic NASA white/orange). Keep a consistent model sheet so future poses/animations match.
- **Environment:** deep-space backdrop, parallax starfields, soft nebula colour washes in the existing dusty-purple/teal palette, a ship corridor or glowing energy-walkway underfoot, and **Jupiter** rendered as a warm, painterly gas-giant (bands of amber/terracotta/cream tie back naturally to the existing palette) growing steadily larger in the distance across the round.
- **Portals:** glowing ring/arch shapes, colour-coded neutrally until resolved (avoid pre-coding "right answer" via colour), with a soft particle-dissolve effect on pass.
- **Asteroids:** simple rounded rock shapes with a few crater details, tumbling gently — keep them visually distinct from portals and from Laika at a glance even for players with lower visual acuity.
- **"Simple 3D" / 2.5D treatment:** layered parallax star/nebula layers, soft glows instead of hard 3D lighting, isometric-friendly gate/asteroid silhouettes if a 2.5D fallback renderer is used instead of the full 3D/Unity build.
- **Typography/UI chrome:** reuse the project's existing rounded, friendly type choices and CSS-variable colour tokens unchanged — no new type system needed for this level, only new illustrated assets.

### 11.1 Colour palette reference (from mockup)

Sampled from the current mock render. Define all of these as CSS variables / theme tokens (per main spec §7.3) so the space level's palette is swap-able the same way the desert level's is, and so this level's tokens can be reused if further planets/levels re-skin the journey again.

**Space / environment**

| Token | Approx. hex | Attributes / usage |
|---|---|---|
| `space-void` | `#0A0E1A` – `#0D1220` | Base background void; near-black with a blue undertone rather than pure black, keeps the scene from feeling flat |
| `nebula-violet` | `#4A3B5C` – `#6B4E7A` | Nebula cloud texture, upper-left; low-saturation, adds depth without competing with the UI |
| `nebula-teal` | `#3A6B5E` – `#4A8A6F` | Nebula cloud texture, upper-right; echoes the "correct answer" teal so environment and UI feel tied together |
| `jupiter-surface` | `#C9915A` – `#A6663B` | Jupiter's banded surface; warm contrast against the cool space tones, anchors the horizon and grows more dominant as the round progresses (§3 ambient progress cue) |
| `starfield-white` | `#FFFFFF` @ low opacity | Scattered pinpoint stars; sparse and small so they don't distract from foreground gameplay elements |

**Ship interior / structural framing**

| Token | Approx. hex | Attributes / usage |
|---|---|---|
| `hull-gunmetal` | `#3D4450` – `#2A2F38` | Corridor walls, side panels, structural framing |
| `hull-highlight` | `#6B7280` | Panel edge lighting/bevels to suggest metallic sheen |
| `hull-warning-accent` | `#D94F4F` | Small pipe/light details along the walls; used sparingly as an "industrial" accent, not a primary UI colour |

**Portals / lane UI (the 4 forced-choice options)**

| Token | Approx. hex | Attributes / usage |
|---|---|---|
| `lane-cyan` (primary/neutral) | `#2FD8FF` / `#00C8FF` | Lane guide-lines, question-box border, hearts-bar container, score text — the "informational/neutral" colour tying the whole HUD together, not tied to any single answer option |
| `portal-mint` (Inside) | `#2FE8B0` – `#1FD9A0` | Leftmost portal; cool, high-contrast glow |
| `portal-magenta` (Outside) | `#C24FE0` – `#B93FE8` | Second portal; the most saturated of the four |
| `portal-indigo` (Beside) | `#3A5FE0` – `#4A6FF0` | Third portal; darker/cooler, stays distinct from cyan without clashing |
| `portal-amber` (Above) | `#F0A030` – `#FF9D2E` | Fourth portal; the one warm outlier against three cool tones — **flag:** this makes it the most visually distinct option, worth checking with the research team that it doesn't unintentionally bias selection toward or away from it |

> **Re-theme caveat:** §11 above specifies portals should stay "colour-coded neutrally until resolved (avoid pre-coding 'right answer' via colour)." The current mockup pre-assigns a fixed colour per lane position (mint/magenta/indigo/amber, always left-to-right), which — combined with the required per-trial lane randomisation (§8) — means the *colour* a given answer option gets will vary trial to trial as it moves lanes. That's consistent with the no-pre-coding intent, but confirm this is the actual implementation plan (colour tied to lane slot, not to answer identity) rather than colour becoming an accidental second cue.

**Status / feedback**

| Token | Approx. hex | Attributes / usage |
|---|---|---|
| `feedback-positive` | teal, shares family with `portal-mint` | Correct-portal flash/pulse, soft chime, starburst (§4.2) |
| `feedback-negative` / `hearts-lost` | `#FF6B5E` – `#E85A4D` | Incorrect-portal flash, filled-heart colour, asteroid-hit feedback; universal "resource/danger" signifier that reads instantly as a lost life |
| `hearts-track` | `#2A2F3A` | Unfilled heart/track background, low contrast against the wall so the filled portion pops |
| `hud-text` | `#E8F4FF` | High-legibility score/HUD text against the dark background |

> Per §13, correct/incorrect feedback must **not** rely on `feedback-positive` vs. `feedback-negative` colour alone — pair each with a distinct shape/icon and sound cue.

**Character (Laika)**

| Token | Approx. hex | Attributes / usage |
|---|---|---|
| `suit-base` | `#E8E4D8` | Astronaut suit body; warm-neutral against the cool environment, keeps continuity with the project's cream/off-white desert-era palette rather than defaulting to generic NASA white/orange (per §11) |
| `visor-glass` | `#1A1E28` with cyan reflection | Helmet visor; ties the character back into the `lane-cyan` accent family |
| `fur-tan` | `#C9A876` | Small warm accent visible at ears/tail, consistent with the "cream suit body with teal or amber trim" direction already specified in §11 |

---

## 12. Architecture recommendation

*(Carried over unchanged in substance.)*

- This mini-game is a strong candidate for the **Unity-compatible 3D build path** already earmarked for the endless-runner concept, since it benefits from proper 3D character animation (run/float cycle, hit/tumble, blaster fire) and asset reuse if further levels re-skin the environment again (per "further levels I will consider other environments"). Recommend exporting via **Unity WebGL** and embedding the build in an `<iframe>` or a dedicated route within the Next.js app, rather than rebuilding the runner logic in React/Three.js.
- **Bridge to the main app:** the WebGL build needs a narrow, well-defined message-passing contract with the Next.js shell (e.g. `postMessage`) to (a) receive the trial JSON + active UI language at launch, and (b) emit each resolved trial's response back to the shell's `data-access.ts` layer for persistence — keep the Unity build "dumb" about backend details (Supabase vs. local Postgres vs. memory mode) and let the shell own all persistence, consistent with the "single thin data-access module" principle in the main spec (§4.4).
- Because the stimulus engine (trial JSON in, response events out) is theme-agnostic, **swapping this level's theme required no change to game logic** — only to the asset/renderer layer. This validates the "separate the stimulus engine from the game shell" architecture recommendation (main spec §8.1) and is a strong reason to keep future environment re-skins (further space destinations beyond Jupiter, or other biomes entirely) as pure asset swaps against this same engine.

---

## 13. Accessibility & wellbeing notes

*(Carried over unchanged, wording adjusted for theme.)*

- **Motion sensitivity:** constant forward-scrolling starfield/corridor can trigger discomfort in some players (a known effect in endless-runner-style UIs, more so on older-adult or motion-sensitive users). Consider respecting `prefers-reduced-motion` by reducing star-scroll intensity/contrast and toning down parallax depth, and keep camera shake/bob effects (from hits, laser fire, etc.) minimal or optional.
- **Timing pressure:** a 3.5–5 s decision window per gate should be checked with the actual target population before finalizing — this may need to be longer for some participants; consider making the window a configurable parameter rather than a hard-coded constant.
- **Colour-only signaling:** don't rely on colour alone for correct/incorrect feedback (teal vs. coral) — pair with distinct shapes/icons and sound cues for colour-blind accessibility, consistent with the main spec's WCAG AA note (§7.6).
- **Tone:** keep failure states encouraging, not punishing (see §7).

---

## 14. Open questions for the research team

1. Should hearts/score be tied to answer correctness at all, given the project's own "decouple rewards from correctness" principle (§2)? This is the single biggest open tension in this design, unchanged from before.
2. Should the 60-second timer be visible, hidden, or replaced entirely by the "Jupiter growing larger" ambient cue?
3. Are asteroid-dodge/laser-blast events worth logging for any purpose, and if so, in what table/shape?
4. Text vs. icon-based answer options on portals — which better serves a cross-language, low-text-dependency instrument?
5. Trial selection per round: fixed set vs. randomised, and how to guarantee all four spatial categories appear (ties into the original idea note's "limitation" about uneven category coverage).
6. Exact decision-window length (gate travel time) appropriate for the target age range.
7. Unity WebGL vs. 2.5D web-native fallback — timeline-dependent decision, and which is buildable first for a mock.
8. Final naming: the overall game title is **"Laika Odyssey: A Spatial Adventure"**, the mini-game is **"Jupiter Run"**, and the dog protagonist is **"Laika"**.
9. "Hearts" vs. a more diegetic space term ("oxygen," "hull integrity") for the lives HUD — pure copy/art decision, no logic impact.
10. What comes after Jupiter — is this truly level 1 of a multi-planet or multi-environment journey, and should the map/title screens be restructured now to anticipate that, or is a single-level space theme sufficient for the next mock?
