# Spatial Paws — Game Logic, Objects, and Characters

This document describes the **current playable version** of Spatial Paws (scene: `Assets/Scenes/Jerboa Runner.unity`). It is a 3-lane endless runner with a quiz: the player dodges solid obstacles and shoots the panel that shows the correct answer.

---

## 1. Game overview

The player stays in place on the Z axis. The world (track tiles, quiz waves, and any spawned obstacles) moves toward the camera, which creates the feeling of running forward.

There are **three lanes**. The player can only stand in one lane at a time. Anything tagged `Obstacle` that collides with the character ends the run.

A second layer sits on top of the runner: every few seconds a **question wave** appears far ahead. The question floats above three solid answer panels (one per lane). Shooting the panel with the correct answer destroys that wave. Shooting a wrong panel does nothing except log a miss. Running into any panel still crashes the character.

Questions are loaded from a local JSON file. Player actions are written to a local session log JSON, ready to upload to a database later.

---

## 2. Core loop

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

There is no score target or finish line in this version. The run continues until the character collides with an object tagged `Obstacle` (asteroid, plant, or an answer panel).

### Difficulty (obstacle spawner)

`SpawnManager` (if present in a scene) increases world obstacle speed from `10` toward `50`, and spawns more often as speed rises (`cooldown = 20 / currentSpeed`). The current Jerboa Runner scene is driven mainly by the quiz spawner; the asteroid spawner script still exists for scenes that use it.

---

## 3. Controls

| Action | Keys |
|---|---|
| Move left one lane | `A` or Left Arrow |
| Move right one lane | `D` or Right Arrow |
| Shoot | `Space` |

Lane 0 is the leftmost rail, lane 2 the rightmost. The character cannot move past those bounds.

Default rail X positions on the player: `-4.10`, `-2.10`, `-0.10`.  
Quiz panels in the current scene use: `-5.1`, `-2.1`, `1.1`.

---

## 4. Characters

### Astro Bunny (playable — current scene)

- **Scene object:** `BunnyRunning`
- **Controller:** `PlayerControllerX`
- **Assets:** `Assets/Characters Game/Characters_Raw/AstroBunny/`
- **Model / clips:** `BunnyCharacter`, `BunnyRun`, `BunnyRunning`, `Bunnydying`, `BunnyBackflip`, `Bunnybiped`
- **Animator:** `BunnyController`

Astro Bunny is a jerboa-like astronaut on the three rails. The character does not run in world space; the ground moves instead. On crash:

1. `isGameOver` is set
2. The death animation is triggered (`Death_b`, `DeathType_int = 1`)
3. Rigidbody constraints are released
4. The bunny is thrown backward and spun
5. The object that was hit is unparented and knocked forward

A cannon child (`Cannon`) is the muzzle for the crystal shot.

### Astro Laika (character asset, not the current scene player)

- **Prefab:** `Assets/Characters Game/Characters_Raw/Laika/AstroLaika.prefab`
- **Mesh:** `Captain_Laika`

Laika is an earlier playable astronaut dog. `SpawnManager` still looks up a GameObject named `AstroLaika`. The Jerboa Runner scene uses `BunnyRunning` instead. Laika remains in the project for reuse.

---

## 5. World and objects

### Track / ground

- **Prefab:** `Assets/Ground/Ground.prefab`
- **Scene parent:** `GroundMoving` with children `Ground1` … `Ground10`
- **Script:** `TrackManager`

Tiles are lined up along Z (`tileLength = 10`). Each frame they move backward. When a tile goes behind Z = `-10`, it is moved to the end of the row. This is an infinite scrolling floor; the player never leaves the start area.

### Camera and lighting

- Main camera follows the runner view down the track.
- A directional light lights the scene.
- Skybox materials live in `Assets/Skyboxes/` (`skybox_star`, `skybox_volcanic`).

### Answer panels (active in play)

Spawned at runtime by `BoxSpawner` as simple dark cubes (`AnswerBox`):

- Solid `BoxCollider` (not a trigger)
- Kinematic rigidbody (mass 10)
- Tag: `Obstacle` (contact with the bunny = crash)
- World-space TextMesh Pro label on the front face
- Only the panel whose text matches `questions.json` → `correctIndex` can be destroyed by a shot

Scale defaults: `2.4 × 1.4 × 1.2`. Color: dark blue-gray.

A whole wave is grouped under a `QuestionWave` parent that moves toward the player (`moveSpeed` 10). The question text floats above the three panels. Hitting the correct panel destroys the entire wave. Waves that pass Z = `-10` are destroyed.

**Scene object:** `Answers` holds `BoxSpawner`. In the current scene, first wave after 2 seconds, then every **10** seconds. Panels spawn at Z = `50`.

### Legacy Yes / No / Skip boxes (not spawned)

These prefabs are **kept in Assets** and still assigned on `BoxSpawner`, but they are not instantiated:

| Prefab | Path |
|---|---|
| Yes box | `Assets/Obstacles/BOX_yes.prefab` |
| No box | `Assets/Obstacles/BOX_no.prefab` |
| Skip box | `Assets/Obstacles/SkipBOX.prefab` |

Raw meshes: `Assets/Obstacles/Obstacles_Raw/` (`YesBOX`, `SkipBOX`, `BOXMain`, unlabeled `Box`).

### Crystal projectile (shot)

- **Prefab:** `Assets/Weapons/Cristal1 1.prefab`
- **Script:** `CrystalProjectile`
- **Tag:** `Bullet`
- **Collider:** trigger
- Speed `40`, lifetime `2` seconds
- Moves along local left (down the track from the cannon)

If it hits a `TargetBox`, the box decides whether it was a correct or incorrect answer. If it hits any other `Obstacle`, that obstacle is destroyed (asteroid-style shoot-to-clear).

Cannon visual: `Assets/Weapons/CannonPos/Cannon.prefab`, blaster mesh `Assets/Weapons/RawFiles/Blaster_Green.obj`.

### Other obstacles (scripts / older content)

`SpawnManager` can spawn a list of obstacle prefabs on a random lane at Z = `28`. Those objects should use tag `Obstacle` so they crash the player. The current Jerboa Runner scene does not list asteroid prefabs in the snippet above; the quiz panels themselves are the solid obstacles the player must not touch.

---

## 6. Quiz logic

### Data file

`Assets/StreamingAssets/questions.json`

Each row:

| Field | Meaning |
|---|---|
| `id` | Question id (also written to the session log) |
| `question` | Text shown above the panels |
| `answers` | Exactly three strings, one per panel |
| `correctIndex` | `0`, `1`, or `2` — which answer is destructible |
| `category` | Optional grouping (currently `"Solar System"`) |
| `difficulty` | Optional integer (currently `1`) |

`QuestionDatabase` loads this file at Start (file path or `UnityWebRequest` on WebGL), shuffles the list, and hands the next question to each wave. When the list is exhausted it reshuffles and continues.

### How a correct panel is chosen

1. Take `answers[correctIndex]` from JSON. That string is the only correct answer.
2. Shuffle which panel prefab/slot and which **lane** get which answer.
3. The panel that displays the correct string has `isDestructible = true`.
4. A `Bullet` trigger hitting that panel logs `shot_correct` and destroys the wave.
5. A bullet hitting any other panel logs `shot_incorrect` and leaves the wave in place.

Sample items include closest planet to the Sun (Mercury), the Red Planet (Mars), eight planets, largest planet (Jupiter), rings (Saturn), and Earth’s satellite (the Moon).

---

## 7. Session event log

`PlaySessionLogger` starts with the player. Events are kept in memory and written to:

`Application.persistentDataPath/session_logs/<sessionId>.json`

(On Linux Editor this is typically under `~/.config/unity3d/DefaultCompany/Spatial Paws Game/session_logs/`.)

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

---

## 8. Scripts (quick map)

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

---

## 9. Tags

| Tag | Used for |
|---|---|
| `Obstacle` | Crash the player; crystal can destroy non-quiz obstacles |
| `Bullet` | Crystal shot; `TargetBox` listens for this |
| `Ground` | (Available; jumping/grounded was used in earlier player versions) |

---

## 10. Build notes

Product name: **Spatial Paws Game**.  
Play scene: **Jerboa Runner**.  
WebGL build profiles exist under `Assets/Settings/Build Profiles/`.  
Quiz JSON must stay in `StreamingAssets` so it is copied into builds and can be edited without recompiling scripts.
