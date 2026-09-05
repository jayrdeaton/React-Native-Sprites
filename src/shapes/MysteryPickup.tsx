import { Circle } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { Easing, useDerivedValue, useSharedValue, withDelay, withRepeat, withTiming } from 'react-native-reanimated'

// Reconciled from LightCycles' GameBoard.tsx PowerupGlyph and Snake's SnakeBoardCanvas.tsx
// PickupGlyph/FoodDot — all three draw "a mystery-box circle": a filled circle plus a separately
// stroked ring on top, rendered identically regardless of the actual pickup type (Snake's own
// comment: a live pickup renders identically regardless of type, the type only ever revealed once
// collected, in the holder's own HUD badge). But their actual pulse *drivers* are not one
// implementation reached for twice, the way e.g. CelebrationRings' two sources were (confirmed
// byte-for-byte identical timings there) — LightCycles owns a self-contained two-phase animation (a
// mount-triggered grow+fade-in, settling into an endless back-and-forth radius pulse) via its own
// two SharedValues, no outside clock involved; Snake instead reads a continuous `phase` SharedValue
// its board already drives for other elements (SnakeBody's own undulation, its own FoodDot) and
// derives radius/ring-opacity as a plain sin() of it, with no spawn beat at all. Snake's own comment
// frames this as reaching for the board's shared driver "instead of LightCycles' own separate
// spawn-fade+pulse system, which has no equivalent driver here" — a deliberate divergence, not an
// oversight, so this isn't two apps independently building the same thing (Snake explicitly chose a
// different mechanism because this component didn't exist yet).
//
// This component follows LightCycles' own model — the fuller of the two, spawn fade *and* pulse
// rather than just pulse — as its own self-contained, mount-owned animation, so a caller gets a
// fully animated glyph from geometry+color alone, no external clock prop required, the same
// ergonomic level as GoalPost/ObstacleRect. Every numeric default below is LightCycles' own literal
// current value; a future Snake integration is expected to override fillOpacity/ringOpacity/
// spawnFadeMs to 1/1/0 (fully solid, no fade-in) to match its own current look on this shared
// component, rather than this component growing a second, phase-driven mode to imitate Snake's
// sin() curve exactly.
//
// Replaying the spawn animation on a freshly-spawned pickup is the caller's job via React's own
// remount — key the element on the pickup's own id, same as both source apps' own list-rendering
// already does (LightCycles' Powerups/Snake's Pickups, both `key={pickup.id}`). This component's
// mount effect deliberately never depends on props that could change while the same pickup just
// sits there, matching PowerupGlyph's own comment on the same point.

const DEFAULT_RING_WIDTH_PX = 1.5
const DEFAULT_FILL_OPACITY = 0.35
const DEFAULT_RING_OPACITY = 1
const DEFAULT_SPAWN_FADE_MS = 260
const DEFAULT_SPAWN_START_SCALE = 0.4
const DEFAULT_PULSE_DURATION_MS = 900
const DEFAULT_PULSE_SCALE = 0.16

export type MysteryPickupProps = {
  x: number
  y: number
  /** Resting radius once fully spawned in, at the neutral point of the pulse (the pulse oscillates
   *  by ±pulseScale around this). The caller resolves cell size to pixels itself, matching every
   *  other shape here — e.g. LightCycles' own powerupPickupRadiusPx(cellPx). */
  radius: number
  color: string
  /** Stroked ring drawn on top of the fill, at the same cx/cy/r. Omitted defaults to `color`
   *  (LightCycles' own look — one color for both layers); Snake's own pickups/food instead hardcode
   *  a white ring regardless of fill color. */
  ringColor?: string
  ringWidth?: number
  /** Fill layer's resting opacity once fully spawned in (ramps 0 -> this over spawnFadeMs, then
   *  holds — the fill itself never pulses, only the radius/ring do, matching LightCycles exactly).
   *  Default 0.35, LightCycles' own literal value: translucent, so the opaque ring is what mainly
   *  reads. Snake's own pickups/food are fully solid instead — pass 1. */
  fillOpacity?: number
  /** Ring layer's resting opacity once fully spawned in, same ramp as fillOpacity. Default 1 —
   *  LightCycles' own ring reads fully opaque once spawned (its strokeOpacity is exactly `intro`,
   *  i.e. an implicit peak of 1). */
  ringOpacity?: number
  /** Duration of the spawn grow+fade-in. Default 260ms, LightCycles' own POWERUP_SPAWN_FADE_MS.
   *  Snake's own pickups/food have no equivalent spawn beat at all (full size/opacity from the very
   *  first frame) — pass 0 for that look. */
  spawnFadeMs?: number
  /** Fraction of `radius` the glyph starts at the instant it mounts, growing to full size by the end
   *  of the spawn fade. Default 0.4, LightCycles' own literal value. Irrelevant once spawnFadeMs is
   *  0 — the grow-in resolves on the very first frame either way. */
  spawnStartScale?: number
  /** One leg's duration of the eternal back-and-forth radius pulse that starts once the spawn fade
   *  finishes (withRepeat's own reverse argument makes a full out-and-back cycle 2x this). Default
   *  900ms, LightCycles' own POWERUP_PULSE_DURATION_MS. */
  pulseDurationMs?: number
  /** How far the pulse grows the radius above its resting value, as a fraction — 0.16 means the
   *  radius swings up to ±16% larger. Default 0.16, LightCycles' own POWERUP_PULSE_SCALE. Pass 0 to
   *  disable pulsing outright (a flat resting radius once spawned in). */
  pulseScale?: number
}

export function MysteryPickup({ x, y, radius, color, ringColor, ringWidth, fillOpacity, ringOpacity, spawnFadeMs, spawnStartScale, pulseDurationMs, pulseScale }: MysteryPickupProps) {
  const resolvedFillOpacity = fillOpacity ?? DEFAULT_FILL_OPACITY
  const resolvedRingOpacity = ringOpacity ?? DEFAULT_RING_OPACITY
  const resolvedSpawnFadeMs = spawnFadeMs ?? DEFAULT_SPAWN_FADE_MS
  const resolvedSpawnStartScale = spawnStartScale ?? DEFAULT_SPAWN_START_SCALE
  const resolvedPulseDurationMs = pulseDurationMs ?? DEFAULT_PULSE_DURATION_MS
  const resolvedPulseScale = pulseScale ?? DEFAULT_PULSE_SCALE

  // intro: 0 -> 1 once, the instant this glyph mounts. pulse: starts only once intro finishes, then
  // loops forever back and forth (see withRepeat's own reverse arg) — identical two-driver structure
  // to PowerupGlyph's own intro/pulse. Both purely cosmetic, same as PowerupGlyph's own comment notes.
  const intro = useSharedValue(0)
  const pulse = useSharedValue(0)
  useEffect(() => {
    intro.value = withTiming(1, { duration: resolvedSpawnFadeMs, easing: Easing.out(Easing.quad) })
    pulse.value = withDelay(resolvedSpawnFadeMs, withRepeat(withTiming(1, { duration: resolvedPulseDurationMs, easing: Easing.inOut(Easing.ease) }), -1, true))
    // Intentionally mount-only (see this component's own doc comment) — a caller replays the spawn
    // beat by remounting (key on the pickup's own id), not by changing any prop here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const derivedRadius = useDerivedValue(() => radius * (resolvedSpawnStartScale + (1 - resolvedSpawnStartScale) * intro.value) * (1 + pulse.value * resolvedPulseScale))
  const derivedFillOpacity = useDerivedValue(() => intro.value * resolvedFillOpacity)
  const derivedRingOpacity = useDerivedValue(() => intro.value * resolvedRingOpacity)

  return (
    <>
      <Circle cx={x} cy={y} r={derivedRadius} color={color} opacity={derivedFillOpacity} />
      <Circle cx={x} cy={y} r={derivedRadius} style='stroke' strokeWidth={ringWidth ?? DEFAULT_RING_WIDTH_PX} color={ringColor ?? color} opacity={derivedRingOpacity} />
    </>
  )
}
