# Astro Bunny: Galaxy Drift — Story & Character Bible (v0.1, narrative concept)

**Project:** Jerboa's Journey / Spatial Paws Game — SCALA research instrument
**Purpose of this document:** a narrative and visual concept for the next story arc built around the existing **Astro Bunny** character. It is a companion to `spatial-paws-astro-bunny-runner-spec.md` (mechanics) — this file covers story, character history, and colour palette only. No gameplay systems are changed here; the stimulus engine (lanes, shoot-to-answer, forced-choice logging) stays exactly as already implemented.

> **Framing:** same rule as the rest of the project — this is a research instrument first. The story exists to give participants a reason to keep playing across many short trials, not to introduce new confounds. Any new mechanic implied by the story (e.g. "navigate to a planet") should stay a reskin of the existing engine unless the team explicitly signs off on new logic.

---

## 1. Premise

Astro Bunny was on a routine supply run between two space stations when their small craft drifted too close to an uncharted **black hole**. The gravity well didn't destroy the ship — it *bent* the trip. Bunny came out the other side intact, but very far from home: a different arm of the galaxy, unfamiliar stars, no signal from Mission Control.

The new story arc is the journey back: **hopping from system to system, planet to planet, using whatever fuel, star-charts, and friendly help can be found along the way**, all while the ship's onboard computer keeps asking Bunny simple questions about the shapes and directions of things — because the guidance system was scrambled by the black hole and needs to be recalibrated one answer at a time.

This gives an in-fiction reason for the existing quiz-wave mechanic: **every question Bunny answers correctly recalibrates one degree of the nav computer**, nudging the ship a little further toward home. It does not need to change the underlying rule that survival/reward stays decoupled from correctness in the actual data table — narratively the "answers" are framed as calibration pings, not as the sole reason the ship survives, which gives the team room to later separate "you got the nav question right" from "you didn't crash."

---

## 2. Title options

- **Astro Bunny: Galaxy Drift** *(working title used in this doc)*
- Astro Bunny: Long Way Home
- Astro Bunny: Lost Signal
- Bunny Beyond the Rim

---

## 3. Logline

*A supply-run bunny gets pulled through a black hole into a galaxy no one back home has ever mapped — and has to hop across strange new worlds, one recalibrated star-chart at a time, to find the way back.*

---

## 4. Character bible — Astro Bunny

### 4.1 Who they are

- **Species:** jerboa-like rabbit — long upright ears, big expressive eyes, tabby-grey and white fur, small pink nose, whiskers.
- **Role before the story:** a **cargo and supply-run pilot** — not a decorated hero, not a scientist. Reliable, a bit of a homebody, flies the same short routes often. This matters for the story: Bunny is ordinary, which makes the "lost across the galaxy" premise feel bigger and more personal rather than a mission Bunny signed up for.
- **Personality:** curious but a little anxious about the unknown; talks to the ship's computer to keep calm; determined without being reckless — prefers finding a way around a problem to charging through it. Warm, a little wry sense of humor. Reads well for a broad, cross-generational audience (matches the project's older-adult participant range — nothing frantic or edgy in tone).
- **Motivation:** wants to get home — not for glory, just because that's where their life is. Every planet visited is a means to that end, which keeps the narrative simple and legible across languages and cultures for the multi-country SCALA participant pool.

### 4.2 Appearance (from current model reference)

- Grey-and-white tabby markings on the face and ears; warm brown eyes, wide and expressive.
- Ears are the character's most readable silhouette feature — tall, slightly forward-leaning, pink inner ear, tan/brown outer fur; keep this shape consistent and unobstructed by helmets so Bunny reads instantly at runner distance or in a small mobile viewport.
- Spacesuit: white base with steel-blue panel accents, ribbed joints at shoulders, elbows, and knees, blue-trimmed collar ring, white gloves and boots with blue cuffs. Practical, rounded, toy-like proportions — not military or hard-sci-fi.
- No helmet in the current reference art (head is exposed); if a helmet is introduced for new environments (vacuum planets, underwater, etc.), keep it clear-domed so the face and ears stay visible.

### 4.3 What's new for this arc

- **The ship:** Bunny's small supply-run craft, now damaged just enough to need help along the way (not destroyed — keeps tone light). Give it a name — suggest **"The Acorn"** or **"Little Hop"** — something homely, reinforcing that Bunny is not flying a warship.
- **The nav computer / companion voice:** a small onboard AI that got its star-charts scrambled by the black hole crossing. This is the in-fiction source of the quiz questions and gives Bunny someone to talk to (useful for tutorial/explanatory dialogue without needing more characters yet).
- **New-galaxy locals (optional, future content):** friendly or obstacle-posing beings on each new planet, in the same spirit as the original desert Jerboa's "friends and foes." Not designed in this document — flagged as a hook for future planet-specific mini-scenes.

---

## 5. Backstory

Long before the story starts, Astro Bunny grew up on a modest home planet at the edge of a well-mapped, well-traveled part of the galaxy — the kind of place with regular shipping lanes, not a frontier. Bunny took a steady job flying short supply hops between a couple of nearby stations: food, parts, mail. Nothing glamorous. Good at it, well-liked at both ends of the route, but never the type to volunteer for anything further out.

On what should have been an unremarkable run, Bunny's ship crossed paths with a black hole that wasn't on any chart — small as these things go, but very much real. The ship was pulled in. Instead of the ending everyone would expect, Bunny (and the ship) came out the other side, somewhere else entirely: a different, unfamiliar arm of the galaxy, no station chatter on any frequency, and a nav computer full of scrambled star-charts.

The story picks up right there: Bunny, a long way from a route they knew by heart, has to relearn how to read the sky one system at a time — literally, by answering the recalibration questions the ship keeps asking — while hopping toward whatever signal might eventually lead home.

**Open threads for the team to decide (kept here rather than resolved unilaterally):**
- Does Bunny ever reach home in-story, or does the game stay open-ended (matches the current endless-runner design, where there's no fixed finish line)?
- Is the black hole ever explained/revisited, or does it stay a mystery inciting incident?
- Are the "new-galaxy locals" ever given names/design, or does this arc stay solo-character to keep asset scope small?

---

## 6. Structure hook for future levels

The existing engine is **theme-agnostic** (validated already when the desert Jerboa spec was fully re-themed to the Laika/Jupiter space theme without touching game logic). This story gives a natural reason to reuse that same pattern for **multiple planet skins**, one per "level":

| Layer | Reused as-is | Reskinned per planet |
|---|---|---|
| Lane / shoot-to-answer loop | ✅ unchanged | — |
| Track tiles, skybox | — | new per-planet materials (ice, jungle, gas-giant clouds, crystal caves, etc.) |
| Obstacles | ✅ same `Obstacle` tag/behaviour | new silhouettes per biome |
| Quiz item bank | ✅ same JSON contract (`question`, 3 answers, `correctIndex`) | swap item categories/content per planet if desired |
| Astro Bunny | ✅ same rig/animations | optional cosmetic-only suit variants (e.g. a warmer-looking suit skin for an ice planet) — appearance only, never a new mechanic |

This keeps the "long way home across many worlds" story compatible with a **low-effort content pipeline**: new planet = new tileset + skybox + item bank, not new code.

---

## 7. Colour palette — "Galaxy Drift"

Builds on the project's existing warm, storybook-friendly visual language, shifted from the Laika/Jupiter corridor palette toward a **deep-space, nebula-lost** feel — still soft and approachable, not harsh sci-fi black-and-neon.

| Role | Colour | Approx. hex | Notes |
|---|---|---|---|
| Deep-space background | midnight indigo | `#1B1A3B` | Base skybox tone — dark enough for contrast, not pure black (keeps warmth, avoids a bleak feel) |
| Nebula accent (secondary bg) | soft magenta-violet | `#7A5FB8` | Nebula clouds, distant light, title screen glow |
| Starlight / highlights | pale gold | `#F4D98A` | Stars, UI highlight states, "correct" cues (paired with shape/sound per accessibility rule — never colour alone) |
| Bunny suit — primary | warm white | `#F6F3EC` | Keep the existing suit base tone, slightly warmed for storybook consistency |
| Bunny suit — accent | steel teal-blue | `#3E7C8A` | Panel trim; echoes the project's established "desert teal" family, ties the two art directions together |
| Ship hull | soft slate blue | `#5B6B8C` | The Acorn / Little Hop exterior |
| Ship interior glow | warm amber | `#E0A43B` | Reused directly from the desert palette's amber — a deliberate thread connecting home-planet warmth to the ship interior even while lost |
| New-galaxy accent (per planet, rotate) | e.g. coral-pink `#E88C7D`, ice-cyan `#8FD9D0`, moss-green `#7FAE6D` | — | One accent colour per new planet, used sparingly against the shared indigo/violet space base so each world reads as distinct without a full palette rebuild |
| Alert / crash-adjacent | muted coral-red | `#D9534F` | Reused from the existing palette for consistency — never used for "wrong answer," only for the crash/obstacle cue, matching current no-colour-only-for-correctness rules |

**Design intent:** the palette should feel like *the same universe* as the desert Jerboa and the original Laika/Jupiter corridor — warm ambers and teals recur — so players and reviewers recognise the family resemblance even though Bunny is now somewhere the charts don't cover. Keep contrast checked against WCAG AA per the project's existing accessibility requirement, and continue pairing any colour-coded feedback with a shape or sound cue.

---

## 8. Tone and accessibility notes (carried over from project principles)

- Keep the "lost in space" premise **gentle, not frightening** — Bunny is resourceful and the tone stays hopeful throughout, appropriate for a broad, cross-generational, cross-cultural research population.
- No permanent-loss stakes in the narrative frame (e.g. "ship destroyed forever") — matches the existing note that failure/crash copy should stay warm, not punitive.
- Avoid horror-adjacent black-hole imagery (no screaming void, no darkness-as-threat visual language) — treat the black hole as a strange, disorienting event, not a menace.
- Any new UI text this story introduces (nav computer dialogue, planet names, etc.) goes through the same i18n pipeline as everything else — write source strings with translation and text-expansion in mind (short, simple sentences).

---

## 9. Open questions for the team

1. Ship name — "The Acorn," "Little Hop," or something else entirely?
2. Does the arc stay endless/open (matches current engine) or eventually resolve with Bunny reaching home?
3. Should the nav-computer companion have a name and a distinct voice/personality, or stay a minimal UI element?
4. How many new planet skins are in scope for a first pass, and which biomes (ice, jungle, crystal, gas giant, etc.)?
5. Does the in-fiction "answers recalibrate the ship" framing need to be walked back anywhere in participant-facing copy, so it's clear survival isn't literally gated on correctness (per the project's decoupling principle)?
6. Cosmetic suit variants per planet — worth the asset time, or keep Bunny visually constant across all worlds for this first pass?
