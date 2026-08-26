# Spatial Paws — Mini-Game Spec: Astro Bunny Runner (Endless Runner / Quiz-Wave Trial)

**Type:** 3D lane-based endless runner with a shoot-to-answer quiz  
**Purpose:** A playable stimulus engine that collects forced-choice spatial-relation (and general quiz) responses while staying inside a space-runner wrapper.  
**Playable scene:** `Assets/Scenes/Jerboa Runner.unity`  
**Product name:** Spatial Paws Game  
**Status:** Describes the **current playable version**. Companion to `game-logic.md` (implementation inventory) and successor to `laika-odyssey-jupiter-run-minigame-spec.md` (earlier 4-lane portal design with Laika).

> **Character and mechanic change:** the playable protagonist is **Astro Bunny**, not Laika. The player does **not** steer into a correct portal. They dodge solid obstacles and **shoot the answer panel that shows the correct text**. Three lanes, no hearts, no 60-second finish line: the run continues until a collision tagged `Obstacle`.

---

## 1. Concept summary

**Astro Bunny**, a jerboa-like cartoon astronaut, runs in place on three rails while the world scrolls toward the camera. The bunny never moves on the Z axis; track tiles, quiz waves, and obstacles come to them. Every few seconds a **question wave** appears far ahead: the question floats above three solid answer panels (one per lane). The player must **fire a crystal shot** at the panel whose text matches the correct answer. Hitting that panel destroys the whole wave. Hitting a wrong panel does nothing except log a miss — the wave stays, so the player can fire again. Running into any panel, asteroid, or other `Obstacle` ends the run.

Questions come from a local JSON file. Player actions are written to a local session log, ready to upload to a database later.

This is the **stimulus engine** for the SCALA / Spatial Paws journey: a self-contained Unity module that receives a trial list (question + three answers + which index is correct) and emits response events. Theme and character are asset-layer concerns; the loop (lane, shoot, correct/incorrect, crash) is independent of whether the runner is a bunny or a dog.

---

## 2. What changed from the Laika / Jupiter Run spec

The earlier design (`laika-odyssey-jupiter-run-minigame-spec.md`) is **not** what the current scene plays. Keep that file as historical design; use this document as the source of truth for the built runner.

| Topic | Jupiter Run (Laika spec) | Astro Bunny Runner (this version) |
|---|---|---|
| Playable character | Laika, cartoon dog astronaut | **Astro Bunny**, jerboa-like astronaut |
| Lanes | 4 | **3** |
| How the player answers | Steer into the correct portal | **Shoot** the panel with the correct text |
| Wrong answer | Lose 1 heart; gate still resolves; one attempt | Panel stays; **miss is logged**; player may shoot again |
| Lives / score | 5 hearts; score on correct portals | **None.** Crash = game over |
| Round length | 60 seconds or 0 hearts | **Endless** until collision with `Obstacle` |
| Obstacles | Asteroids between gates; laser does not hit portals | Answer panels **are** solid obstacles; crystal can also destroy non-quiz obstacles |
| End of round | Arrive at Jupiter (pass) or ship damaged (fail) | Death animation + knockback; session JSON written to disk |

Laika remains in the Unity project as an unused character asset (`AstroLaika.prefab`). The Jerboa Runner scene player is `BunnyRunning`.

---

## 3. Research mapping

| Game element | Research meaning |
|---|---|
| Question text above the wave | The stimulus (currently solar-system facts; spatial-relation categories can be swapped in via JSON) |
| The 3 panels | The 3 forced-choice options |
| Which panel was shot | The recorded response (`correctIndex` vs. the panel that was hit) |
| Time from wave spawn (`question_shown`) to a correct shot | Candidate `response_time_ms` |
| Correct shot | `shot_correct` — wave destroyed, trial resolved |
| Incorrect shot | `shot_incorrect` — wave remains; **not** a terminal answer |
| Crash into a panel or other obstacle | `crash` — round ends; may occur before a correct shot |

**⚠️ Research-validity flags**

1. **Survival is tied to correctness.** All three lanes carry a solid panel. The player cannot dodge the wave by changing lanes. They must destroy it with a correct shot or they will collide. Reaching the right answer is both the measured response and the only way to stay alive. That is a stronger correctness incentive than the old hearts-on-portal design, and it conflicts with the project principle that rewards should be decoupled from correctness.

2. **Wrong shots are retryable.** An incorrect shot does not lock the trial. Participants can spray shots until one hits the labelled correct panel. Logged `shot_incorrect` events are useful, but `shot_correct` is not a first-attempt forced choice unless analysis keeps only the first shot per wave (or the design is changed to one shot per wave).

3. **Current item bank is not spatial-relation copy.** Sample items are solar-system facts (Mercury, Mars, Jupiter, Saturn, the Moon). The engine is category-agnostic; swapping in topological / motion / projective / distance items is a data change, not a code change.

4. **Session log is local-only.** Events are written to disk on crash/quit. They are not yet posted to the Next.js `data` table. Bridging Unity → shell remains an open architecture item (see §13).

---

## 4. Core loop

```
Start
  → load questions.json
  → start session log
  → track tiles begin scrolling
  → after a delay, spawn quiz waves on a timer
Play
  → change lane (A/D or arrows)
  → shoot (Space)
  → correct shot: wave disappears
  → wrong shot: panel stays
  → physical hit with Obstacle: Game Over
End
  → death animation + knockback
  → write session JSON to disk
```

### Win / lose

There is no score target and no finish line. The run continues until the character collides with an object tagged `Obstacle` (asteroid, plant, or an answer panel).

### Difficulty (optional asteroid spawner)

`SpawnManager` (if present in a scene) increases world obstacle speed from `10` toward `50`, and spawns more often as speed rises (`cooldown = 20 / currentSpeed`). The current Jerboa Runner scene is driven mainly by the quiz spawner; the asteroid spawner script still exists for scenes that use it.

---

## 5. Screen layout and camera

- **Camera:** fixed, slightly behind and above Astro Bunny, looking down the three rails toward the vanishing point. The camera does not move with the bunny on Z; the world scrolls past it.
- **Astro Bunny:** anchored at a fixed world Z, horizontally on whichever of the three lanes they occupy. Looping run animation while the ground moves. Only lane (X) changes during play.
- **Lanes:** three parallel rails, numbered **0–2** left to right internally; numbers are not shown to the player. Lane 0 is the leftmost rail; the bunny cannot move past 0 or 2.
- **Default rail X (player):** `-4.10`, `-2.10`, `-0.10`.
- **Quiz panel X (current scene):** `-5.1`, `-2.1`, `1.1`.
- **Ground:** repeating track tiles (`Ground1` … `Ground10`) that scroll backward and wrap, so the bunny never leaves the start area.
- **Sky:** starfield / volcanic skybox materials (`skybox_star`, `skybox_volcanic`).
- **HUD:** this version has no hearts, score, or countdown. The question lives in world space above the approaching wave. A later shell HUD (timer, lives, Jupiter approach) would be a new layer on top of this loop, not something the current scene implements.

---

## 6. Characters

### 6.1 Astro Bunny (playable — current scene)

Astro Bunny is a jerboa-like astronaut on the three rails: rounded cartoon proportions, spacesuit, friendly silhouette suited to a broad age range. The character does not run in world space; the ground moves instead.

| | |
|---|---|
| Scene object | `BunnyRunning` |
| Controller | `PlayerControllerX` |
| Assets | `Assets/Characters Game/Characters_Raw/AstroBunny/` |
| Model / clips | `BunnyCharacter`, `BunnyRun`, `BunnyRunning`, `Bunnydying`, `BunnyBackflip`, `Bunnybiped` |
| Animator | `BunnyController` |
| Muzzle | child `Cannon` — origin of the crystal shot |

**State (runtime):** current lane (0–2), `isGameOver`, firing from the cannon.

**Movement:** discrete lane-to-lane. Left/right input changes lane by ±1, clamped to 0–2. The bunny eases to the new rail X. Forward motion is cosmetic animation only; world Z never changes.

**Crash sequence:**

1. `isGameOver` is set
2. Death animation is triggered (`Death_b`, `DeathType_int = 1`)
3. Rigidbody constraints are released
4. The bunny is thrown backward and spun
5. The object that was hit is unparented and knocked forward
6. Session JSON is written (and again on quit, once)

### 6.2 Astro Laika (legacy asset — not the current player)

| | |
|---|---|
| Prefab | `Assets/Characters Game/Characters_Raw/Laika/AstroLaika.prefab` |
| Mesh | `Captain_Laika` |

Laika is the earlier playable astronaut dog from the Jupiter Run design. `SpawnManager` still looks up a GameObject named `AstroLaika`. The Jerboa Runner scene uses `BunnyRunning` instead. Keep Laika in the project for reuse or a later character swap; do not treat it as the active protagonist in copy, HUD, or research docs for this scene.

---

## 7. Entities and world objects

### 7.1 Track / ground

- **Prefab:** `Assets/Ground/Ground.prefab`
- **Scene parent:** `GroundMoving` with children `Ground1` … `Ground10`
- **Script:** `TrackManager`

Tiles are lined up along Z (`tileLength = 10`). Each frame they move backward. When a tile goes behind Z = `-10`, it is moved to the end of the row. Infinite scrolling floor; the player never leaves the start area.

### 7.2 Question wave (active quiz unit)

A wave is grouped under a `QuestionWave` parent that moves toward the player (`moveSpeed` 10). The question text floats above three panels. Hitting the **correct** panel destroys the **entire** wave. Waves that pass Z = `-10` are destroyed.

- **Spawner:** scene object `Answers` holds `BoxSpawner`
- **First wave:** after 2 seconds
- **Then:** every **10** seconds
- **Spawn Z:** `50`

Only one research-relevant event is intended per wave (the shots against its panels), but multiple `shot_incorrect` events can fire before `shot_correct` or `crash`.

### 7.3 Answer panels

Spawned at runtime by `BoxSpawner` as simple dark cubes (`AnswerBox`):

- Solid `BoxCollider` (not a trigger)
- Kinematic rigidbody (mass 10)
- Tag: `Obstacle` — contact with the bunny = crash
- World-space TextMesh Pro label on the front face
- Only the panel whose text matches `questions.json` → `correctIndex` can be destroyed by a shot (`isDestructible = true`)

Scale defaults: `2.4 × 1.4 × 1.2`. Colour: dark blue-gray.

Because every lane has a solid panel, **lane choice is not the answer**. Lane choice is positioning for the shot (and for not walking into a panel). The answer is which labelled cube the crystal hits.

### 7.4 Legacy Yes / No / Skip boxes (not spawned)

These prefabs are kept in Assets and still assigned on `BoxSpawner`, but they are not instantiated:

| Prefab | Path |
|---|---|
| Yes box | `Assets/Obstacles/BOX_yes.prefab` |
| No box | `Assets/Obstacles/BOX_no.prefab` |
| Skip box | `Assets/Obstacles/SkipBOX.prefab` |

Raw meshes: `Assets/Obstacles/Obstacles_Raw/` (`YesBOX`, `SkipBOX`, `BOXMain`, unlabeled `Box`).

### 7.5 Crystal projectile (shot)

- **Prefab:** `Assets/Weapons/Cristal1 1.prefab`
- **Script:** `CrystalProjectile`
- **Tag:** `Bullet`
- **Collider:** trigger
- Speed `40`, lifetime `2` seconds
- Moves along local left (down the track from the cannon)

If it hits a `TargetBox`, the box decides whether the answer was correct or incorrect. If it hits any other `Obstacle`, that obstacle is destroyed (asteroid-style shoot-to-clear).

Cannon visual: `Assets/Weapons/CannonPos/Cannon.prefab`, blaster mesh `Assets/Weapons/RawFiles/Blaster_Green.obj`.

Unlike the Laika spec, **the shot is the quiz input**. It is not scoped to asteroids only.

### 7.6 Other obstacles

`SpawnManager` can spawn obstacle prefabs on a random lane at Z = `28`. Those objects should use tag `Obstacle` so they crash the player. The current Jerboa Runner scene treats the quiz panels themselves as the solid obstacles the player must not touch. Asteroid-style shoot-to-clear still works if those prefabs are listed.

---

## 8. Controls

| Action | Keys |
|---|---|
| Move left one lane | `A` or Left Arrow |
| Move right one lane | `D` or Right Arrow |
| Shoot | `Space` |

Touch / mobile mappings are not implemented in the Unity scene described here. The Next.js shell that embeds the WebGL build currently documents the same desktop keys.

---

## 9. Quiz logic

### 9.1 Data file

`Assets/StreamingAssets/questions.json`  
Must stay in `StreamingAssets` so it is copied into builds and can be edited without recompiling scripts.

Each row:

| Field | Meaning |
|---|---|
| `id` | Question id (also written to the session log) |
| `question` | Text shown above the panels |
| `answers` | Exactly **three** strings, one per panel |
| `correctIndex` | `0`, `1`, or `2` — which answer is destructible |
| `category` | Optional grouping (currently `"Solar System"`) |
| `difficulty` | Optional integer (currently `1`) |

`QuestionDatabase` loads this file at Start (file path, or `UnityWebRequest` on WebGL), shuffles the list, and hands the next question to each wave. When the list is exhausted it reshuffles and continues. There is no per-round cap of N trials; the run lasts until crash.

### 9.2 How a correct panel is chosen

1. Take `answers[correctIndex]` from JSON. That string is the only correct answer.
2. Shuffle which panel slot / **lane** gets which answer (so the correct text is not always in the same rail).
3. The panel that displays the correct string has `isDestructible = true`.
4. A `Bullet` trigger hitting that panel logs `shot_correct` and destroys the wave.
5. A bullet hitting any other panel logs `shot_incorrect` and leaves the wave in place.

Sample items include closest planet to the Sun (Mercury), the Red Planet (Mars), eight planets, largest planet (Jupiter), rings (Saturn), and Earth’s satellite (the Moon).

### 9.3 Trial JSON (research-facing shape)

The file on disk is the Unity-facing table above. For the shell / `data` table, a round can be described as:

```json
{
  "minigame": "astro_bunny_runner",
  "trials": [
    {
      "id": "ss_001",
      "category": "Solar System",
      "difficulty": 1,
      "question": "Which planet is closest to the Sun?",
      "answers": ["Venus", "Mercury", "Mars"],
      "correctIndex": 1
    }
  ]
}
```

Lane assignment of the three strings is randomised at spawn, not stored in JSON. If spatial-relation items replace solar-system facts, keep the same three-option, `correctIndex` contract so the engine does not change.

---

## 10. Timing and spawn schedule

- **Round length:** unbounded. Ends only on crash (or quit).
- **Waves:** first at ~2 s, then every **10** s.
- **Travel:** panels spawn at Z = `50` and move at `moveSpeed` 10, so they take on the order of 5 seconds to reach the bunny — a read-and-shoot window, then a crash if the correct panel was never hit.
- **Scroll speed:** quiz waves use a fixed `moveSpeed` of 10 in the current scene. `SpawnManager` ramping 10 → 50 is optional and not the main driver of Jerboa Runner.
- **Despawn:** waves that pass Z = `-10` are destroyed (the player has already been hit, or the wave missed them).

Cadence is **time-based**, not “spawn next after the last wave is cleared.” A slow player who still has a live wave can see the next one on the 10-second timer. Flag this if overlapping waves would confound `question_shown` / response timing.

---

## 11. Session event log

`PlaySessionLogger` starts with the player. Events are kept in memory and written to:

`Application.persistentDataPath/session_logs/<sessionId>.json`

On Linux Editor this is typically under:

`~/.config/unity3d/DefaultCompany/Spatial Paws Game/session_logs/`

The file is written on crash and again on quit (once).

| Event | Source |
|---|---|
| `lane_change` | Left/right in `PlayerControllerX` |
| `shot_fired` | Space / `ShootBlaster()` |
| `shot_correct` | Bullet + destructible `TargetBox` |
| `shot_incorrect` | Bullet + wrong `TargetBox` |
| `question_shown` | Each `SpawnBoxWave()` |
| `crash` | Collision with `Obstacle` |

Each session JSON has `sessionId`, `startedAt`, `endedAt`, `platform`, and an `events` array. Unused numeric fields are `-1`. This shape is meant to map later to a `sessions` + `events` database without changing the game’s event names.

Asteroid-style destroys (crystal vs. non-quiz `Obstacle`) are gameplay, not spatial-relation trials. Keep them out of the main `data` table if/when the shell starts ingesting Unity events; use the session event stream for engagement analysis.

---

## 12. Scripts and tags (implementation map)

| Script | Role |
|---|---|
| `PlayerControllerX` | Lanes, shooting, crash, session start |
| `BoxSpawner` | Load quiz, spawn question waves and answer cubes |
| `TargetBox` | Label, correct/incorrect hit |
| `QuestionWave` | Move a wave; destroy on correct hit or off-screen |
| `QuestionDatabase` / `QuestionData` | JSON quiz table |
| `QuizText` / `FaceCamera` | World-space labels |
| `CrystalProjectile` | Shot movement and obstacle vs box handling |
| `TrackManager` | Infinite ground |
| `SpawnManager` | Timed obstacle spawn + speed ramp (optional scene) |
| `PlaySessionLogger` / `PlaySessionData` | Local event JSON |

| Tag | Used for |
|---|---|
| `Obstacle` | Crash the player; crystal can destroy non-quiz obstacles |
| `Bullet` | Crystal shot; `TargetBox` listens for this |
| `Ground` | Available; jumping/grounded was used in earlier player versions |

---

## 13. Architecture (Unity + Next.js shell)

- The runner is a **Unity WebGL** build (product: Spatial Paws Game, play scene: **Jerboa Runner**). Build profiles live under `Assets/Settings/Build Profiles/`.
- The Next.js app embeds the build (iframe / `public/game-build/play.html`) as the map’s first stop. Onboarding, consent, and persistence stay in the shell (`lib/jerboa/data-access.ts`).
- **Bridge (not done for this log yet):** Unity writes session JSON locally. The shell’s `data` table is ready for trial rows but Jupiter Run / this runner does not yet post them. A narrow `postMessage` contract should (a) send trial JSON + UI language in, and (b) emit events out, leaving Supabase vs. Postgres vs. memory to the shell.
- Character and environment are asset swaps on the same engine. Replacing Laika with Astro Bunny did not require a new stimulus protocol — only a different player object, clips, and copy. Further planet skins can follow the same split.

---

## 14. Visual style

Keep the project’s friendly, storybook-adjacent space look, now centred on the bunny rather than the dog.

- **Astro Bunny:** jerboa-like astronaut — large ears/silhouette readable at runner distance, rounded helmet/suit, looping run cycle, distinct death/knockback so a crash is obvious without harsh “GAME OVER” chrome.
- **Environment:** scrolling track tiles, starfield or volcanic skybox, three rails receding to a vanishing point. Jupiter-as-progress-cue from the old spec is **not** in this scene.
- **Panels:** dark blue-gray cubes with high-contrast TMP labels; do not colour-code “correct” before a hit. Correct vs. incorrect is destroy-and-clear vs. no effect, plus log events — pair any later VFX with a non-colour cue (shape/sound).
- **Shot:** crystal projectile from a green blaster/cannon child, clearly separable from the bunny body.
- **Tone:** crash is the only fail state. Keep death readable but not punitive in surrounding shell copy (research participants, mixed ages).

---

## 15. Accessibility and wellbeing

- **Motion:** constant forward scroll can be uncomfortable. Respect reduced-motion in the shell where possible; keep camera shake from the knockback modest.
- **Decision window:** ~5 s of travel from Z = 50 at speed 10, plus retries on wrong shots. Confirm with the target age range; make spawn distance / speed configurable rather than baking a single window.
- **Colour-only signalling:** current panels are uniformly dark. Do not later add a “green = correct” tint before the shot. Feedback should not rely on colour alone.
- **Retry vs. one-shot:** retryable wrong panels are easier for motor skill (good for older adults) and weaker as a first-attempt instrument (see §3).
- **Failure tone:** one crash ends the run. Shell copy after the WebGL view should stay warm, not “ship destroyed.”

---

## 16. Build notes

- Product name: **Spatial Paws Game**
- Play scene: **Jerboa Runner**
- Quiz JSON must remain in `StreamingAssets`
- WebGL profiles: `Assets/Settings/Build Profiles/`
- Session logs: `persistentDataPath/session_logs/`

---

## 17. Open questions

1. Should survival stay gated on shooting the correct panel, given the “decouple rewards from correctness” principle?
2. Should a wrong shot lock the wave (one attempt, closer to a forced-choice trial) or stay retryable as implemented?
3. Replace the solar-system bank with spatial-relation items (topological / motion / projective / distance), and how to guarantee category coverage in an endless run?
4. Hearts, score, and/or a 60-second Jupiter arrival — bring back from the Laika spec, or keep endless-until-crash?
5. When and how does Unity session JSON reach the Next.js `data` table?
6. Touch controls for tablet participants?
7. Overlapping waves if a wave is not cleared before the next 10-second spawn — intended or a bug?
8. Naming in the **web shell** is now **Astro Bunny: Galaxy Drift** (character Astro Bunny, first map stop Galaxy Drift). Unity product name remains **Spatial Paws Game**.
9. Retain Astro Laika as a selectable skin, or retire the prefab from the playable path entirely?
