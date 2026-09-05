# @tastic/sprites

A home for shared, rendered game-world visual entities for React Native games — effects today, with static shapes (obstacle rects, portal rings, and the like) joining them too. Not everything in here has to animate. Currently:

- **`Fireworks`** (import from `@tastic/sprites/fireworks`) — an SVG + Reanimated celebration burst (continuous, random-interval particle bursts across the screen). Never depends on `@shopify/react-native-skia`.
- **`GravityWell`** (import from `@tastic/sprites/gravity`) — a Skia + Reanimated particle-swirl marker: a filled hole with particles either falling in (attracting) or emanating out (repelling), placed via golden-angle spacing. Position, polarity, and color are all driven by `SharedValue`s.
- **`ObstacleRect`, `GoalPost`, `Disc`, `CelebrationRings`, `MysteryPickup`** (import from `@tastic/sprites/shapes`) — Skia + Reanimated board-decoration primitives reconciled from BoxHockey/AirHockey/Pong/LightCycles/Snake: an impassable-rectangle marker with an optional stroked outline, a small colored peg marking a goal, a filled circle with an optional stroked ring (pucks, balls, paddles), the three-ring expanding/fading goal-celebration burst, and a self-animating spawn-fade-then-pulse "mystery box" pickup glyph that renders identically regardless of the type it actually holds. Every prop is either a plain value or, where a source app actually drives it that way (ring/disc opacity), a `SharedValue` — no game rules, only what to draw.
- **`ZoneLine`, `FaceoffCircle`, `GoalDoorFlash`, `ScoreWedges`** (import from `@tastic/sprites/hockey`) — Skia + Reanimated rink chrome reconciled from BoxHockey/AirHockey's near-identical two-goal rink layout: a full-width per-player zone line, the static ring+dot faceoff circle both apps render as permanent chrome underneath their own (app-local) interactive draw pulses, the two-layer glow+core color flash where a puck/ball hits the invisible goal-mouth door, and the gap-shrunk arc rendering for a goal crease's win-progress wedge ring (the wedge *angle* math itself lives in `@tastic/physics`; this is only the remaining Skia drawing). Genre-specific rather than generic board dressing, kept in their own subpath rather than folded into `shapes`.

Four renderers and four subpath exports on purpose — none of `Fireworks`/`GravityWell`/`shapes`/`hockey` are unified onto one barrel. `Fireworks` matches its origin app's (Hangman) SVG-only architecture; `GravityWell`, `shapes`, and `hockey` match their origin apps' (BoxHockey/Swirlio/AirHockey/Pong/LightCycles) Skia-only architecture. Separate subpaths mean a consumer of one effect never needs to install another effect's native rendering peer dependency, and never needs to know genre-specific chrome like `hockey` exists at all if it doesn't apply.

## Installation

```bash
npm install @tastic/sprites
```

`react-native-svg` (for `Fireworks`) and `@shopify/react-native-skia` (for `GravityWell`/`shapes`/`hockey`) are **optional** peer dependencies — install whichever your app actually uses.

## Usage

```tsx
import { Fireworks } from '@tastic/sprites/fireworks'
import { GravityWell } from '@tastic/sprites/gravity'
import { CelebrationRings, Disc, GoalPost, MysteryPickup, ObstacleRect } from '@tastic/sprites/shapes'
import { FaceoffCircle, GoalDoorFlash, ScoreWedges, ZoneLine } from '@tastic/sprites/hockey'
```

See each module's exported prop types for the full API.
