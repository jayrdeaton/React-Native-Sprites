# @tastic/animations

Shared visual effects for React Native games:

- **`Fireworks`** (import from `@tastic/animations/fireworks`) — an SVG + Reanimated celebration burst (continuous, random-interval particle bursts across the screen). Never depends on `@shopify/react-native-skia`.
- **`GravityWell`** (import from `@tastic/animations/gravity`) — a Skia + Reanimated particle-swirl marker: a filled hole with particles either falling in (attracting) or emanating out (repelling), placed via golden-angle spacing. Position, polarity, and color are all driven by `SharedValue`s.

Two renderers and two subpath exports on purpose — `Fireworks` and `GravityWell` are NOT unified onto one renderer or one barrel. `Fireworks` matches its origin app's (Hangman) SVG-only architecture; `GravityWell` matches its origin apps' (BoxHockey/Swirlio) Skia-only architecture. Separate subpaths mean a consumer of one effect never needs to install the other effect's native rendering peer dependency.

## Installation

```bash
npm install @tastic/animations
```

`react-native-svg` (for `Fireworks`) and `@shopify/react-native-skia` (for `GravityWell`) are **optional** peer dependencies — install whichever your app actually uses.

## Usage

```tsx
import { Fireworks } from '@tastic/animations/fireworks'
import { GravityWell } from '@tastic/animations/gravity'
```

See each module's exported prop types for the full API.
