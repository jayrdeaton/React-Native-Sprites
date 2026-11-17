# @tastic/sprites

A home for shared, rendered game-world visual entities for React Native games - effects today, with static shapes (obstacle rects and the like) joining them too. Not everything in here has to animate. Currently:

- **`Fireworks`** (import from `@tastic/sprites/fireworks`): an SVG + Reanimated celebration burst (continuous, random-interval particle bursts across the screen). Never depends on `@shopify/react-native-skia`.
- **`GravityWell`** (import from `@tastic/sprites/gravity`): a Skia + Reanimated particle-swirl marker: a filled hole with particles either falling in (attracting) or emanating out (repelling), placed via golden-angle spacing. Position, hole size, polarity, color and the clock (`progress`, a 0..1 loop the caller drives) are all `SharedValue`s.
- **`Portal`** (import from `@tastic/sprites/portal`): a Skia + Reanimated portal in one color round a dark core, in three looks (`variant`): `'vortex'` (three curved arms spinning into the core inside a faint disc), `'rift'` (a stacked soft glow, a ring pulsing in and out and two orbiting sparks) and `'warp'` (two dashed rings spinning opposite ways round a pulsing dot). Position, radius, colors and the clock are `SharedValue`s, as in `GravityWell`; `usePortalProgress()` makes the clock, and portals handed the same one move in step. `mirrored` (default `false`) draws the mirror image, turning the other way, a cue that doesn't rely on color. The core is black unless `coreColor` is given. DuelTastic's linked gates were the first user.
- **`ObstacleRect`, `GoalPost`, `Disc`, `CelebrationRings`, `MysteryPickup`** (import from `@tastic/sprites/shapes`): Skia + Reanimated board-decoration primitives reconciled from BoxHockey/AirHockey/Pong/LightCycles/Snake: an impassable-rectangle marker with an optional stroked outline, a small colored peg marking a goal, a filled circle with an optional stroked ring (pucks, balls, paddles), the three-ring expanding/fading goal-celebration burst, and a self-animating spawn-fade-then-pulse "mystery box" pickup glyph that renders identically regardless of the type it actually holds. Every prop is either a plain value or, where a source app actually drives it that way (ring/disc opacity), a `SharedValue` - no game rules, only what to draw.
- **`ZoneLine`, `FaceoffCircle`, `GoalDoorFlash`, `ScoreWedges`** (import from `@tastic/sprites/hockey`): Skia + Reanimated rink chrome reconciled from BoxHockey/AirHockey's near-identical two-goal rink layout: a full-width per-player zone line, the static ring+dot faceoff circle both apps render as permanent chrome underneath their own (app-local) interactive draw pulses, the two-layer glow+core color flash where a puck/ball hits the invisible goal-mouth door, and the gap-shrunk arc rendering for a goal crease's win-progress wedge ring (the wedge *angle* math itself lives in `@tastic/physics`; this is only the remaining Skia drawing). Genre-specific rather than generic board dressing, kept in their own subpath rather than folded into `shapes`.

Five subpath exports on purpose - none of `Fireworks`/`GravityWell`/`Portal`/`shapes`/`hockey` are unified onto one barrel. `Fireworks` matches its origin app's (Hangman) SVG-only architecture; `GravityWell`, `Portal`, `shapes`, and `hockey` match their origin apps' (BoxHockey/Swirlio/AirHockey/Pong/LightCycles) Skia-only architecture. Separate subpaths mean a consumer of one effect never needs to install another effect's native rendering peer dependency, and never needs to know genre-specific chrome like `hockey` exists at all if it doesn't apply.

## Installation

```bash
npm install @tastic/sprites
```

`react-native-svg` (>=13.0.0, for `Fireworks`) and `@shopify/react-native-skia` (>=2.6.0, for `GravityWell`/`Portal`/`shapes`/`hockey`) are **optional** peer dependencies - install whichever your app actually uses. Skia's floor is 2.6.0 because `Portal` and `ScoreWedges` build their paths with `Skia.PathBuilder`, new in that release.

`react-native-reanimated` (>=3.0.0) is required by every subpath. `@tastic/core` (>=0.10.0) is optional too, but `./gravity` needs it: it imports `clamp` from core's dependency-free `@tastic/core/math` entry.

## Usage

```tsx
import { Fireworks } from '@tastic/sprites/fireworks'
import { GravityWell } from '@tastic/sprites/gravity'
import { Portal, usePortalProgress } from '@tastic/sprites/portal'
import { CelebrationRings, Disc, GoalPost, MysteryPickup, ObstacleRect } from '@tastic/sprites/shapes'
import { FaceoffCircle, GoalDoorFlash, ScoreWedges, ZoneLine } from '@tastic/sprites/hockey'
```

See each module's exported prop types for the full API.

## Helpers and constants

Each subpath also exports the timing values and pure math its component is built on, so a test or a caller drawing its own variant uses the real numbers. The math functions are Reanimated worklets.

**`@tastic/sprites/fireworks`**

- `BURST_LIFETIME_MS` (`1200`): how long one burst stays mounted, its 650ms expand plus its 550ms fade.
- `MIN_BURST_INTERVAL_MS` (`180`) and `MAX_BURST_INTERVAL_MS` (`420`): the bounds of the random gap before the next burst, re-rolled after every burst. `onBurst` fires at the same cadence.

**`@tastic/sprites/gravity`**

- `GOLDEN_ANGLE_RAD`: the golden angle, `Math.PI * (3 - Math.sqrt(5))` (about 2.39996 rad, 137.5 degrees).
- `gravityParticleAngleRad(index)`: particle `index`'s angle, `index * GOLDEN_ANGLE_RAD` wrapped to 0..2π.
- `gravityParticlePhase(clockProgress, index, count)`: where particle `index` of `count` is in its own 0..1 loop: the clock plus `index / count`, wrapped.
- `gravityParticleRadius(phase, innerRadius, outerRadius, pulling)`: a phase as a distance from the center. `pulling` (attracting) runs from `outerRadius` in to `innerRadius`; otherwise from `innerRadius` out to `outerRadius`.
- `gravityParticleDotRadius(orbitRadius, holeRadius, minDotRadius, maxDotRadius)`: a dot's size, from `minDotRadius` at the center to `maxDotRadius` at the hole's edge (`minDotRadius` when `holeRadius <= 0`).
- `gravityParticleSizeScale(holeRadius, maxHoleRadius)`: `holeRadius / maxHoleRadius` clamped to 0..1 (`0` when `maxHoleRadius <= 0`), the multiplier `GravityWell` applies when given `maxHoleRadiusForScale`.
- `GRAVITY_PARTICLE_FADE_FRACTION` (`0.15`) and `gravityParticleOpacity(phase)`: a particle fades in over the first 15% of its loop, out over the last 15%, and is fully opaque between.

**`@tastic/sprites/portal`**

- `PORTAL_VARIANTS`: `['vortex', 'rift', 'warp']`, every `variant`, for a picker or a test.
- `usePortalProgress(periodMs = DEFAULT_PORTAL_PERIOD_MS)`: a `SharedValue<number>` clock running 0 to 1 at an even pace every `periodMs`, forever. It stops when the caller unmounts, and a new `periodMs` restarts it from 0.
- `DEFAULT_PORTAL_PERIOD_MS` (`4000`): one loop of the clock. The vortex and the warp gate's outer ring turn once a loop.
- The geometry works in the portal's own frame, center at (0, 0) and lengths in px:
  - `PORTAL_TAU`: `Math.PI * 2`.
  - `portalSpin(progress, turns)`: how far a part has turned, in radians, at `turns` whole turns a loop (negative turns the other way).
  - `portalPulse(progress, cycles)`: a 0..1 wave, 0 at the start of the loop, `cycles` times a loop.
  - `portalStroke(radius, fraction, minPx)`: `Math.max(minPx, radius * fraction)`, a stroke that scales with the portal but never thins below `minPx`.
  - `vortexArmPoints(radius, arm, armCount, shape)`: the `shape.segments + 1` points of vortex arm `arm` of `armCount` (spread evenly round the center), a spiral from `shape.inner` to `shape.outer` (fractions of `radius`) winding `shape.sweepDeg` degrees.
  - `dashArcs(count, fill)`: `count` evenly spaced dashes, each `fill` (0..1) of its slot, as `{ startDeg, sweepDeg }` for Skia's `addArc`.
  - `orbitPoint(distance, angle)`: the point `distance` px out at `angle` radians.

---

Made by [Infinite Token](https://www.infinitetoken.com), the team behind [Lumber](https://lumber.infinitetoken.com): end-to-end encrypted logging.
