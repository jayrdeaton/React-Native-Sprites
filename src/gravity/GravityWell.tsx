import { Circle, Group } from '@shopify/react-native-skia'
import { useMemo } from 'react'
import { SharedValue, useDerivedValue } from 'react-native-reanimated'

import { gravityParticleAngleRad, gravityParticleDotRadius, gravityParticleOpacity, gravityParticlePhase, gravityParticleRadius, gravityParticleSizeScale } from './gravityParticleMath'

// Reconciled from BoxHockey's components/GravityWellMarker.tsx and Swirlio's components/
// GravityWell.tsx — the same filled-hole-plus-orbiting-particles visual, independently built twice.
// Every prop here is a SharedValue: BoxHockey's wells are static per board layout (position/size/
// polarity/color only ever changed on a real layout event, which already re-renders its own caller),
// but that staticness is the *call site*'s concern, not this component's — a plain value wrapped in
// `useSharedValue()` once behaves identically to one that's genuinely live, so this component only
// ever reads `.value`, never a plain prop, for anything that varies per well.

const DEFAULT_PARTICLE_COUNT = 14
const DEFAULT_MIN_DOT_RADIUS_PX = 0.75
const DEFAULT_MAX_DOT_RADIUS_PX = 3
const DEFAULT_HOLE_FILL_OPACITY = 1
const DEFAULT_HOLE_OUTLINE_WIDTH_PX = 1.5

type GravityWellParticleProps = {
  index: number
  x: SharedValue<number>
  y: SharedValue<number>
  holeRadius: SharedValue<number>
  attracting: SharedValue<boolean>
  progress: SharedValue<number>
  foreground: SharedValue<string>
  particleCount: number
  minDotRadius: number
  maxDotRadius: number
  maxHoleRadiusForScale?: number
}

// One particle orbiting the gravity well — a per-instance array of these (see GravityWell's own
// particleIndices) is what actually gets rendered, the same "component per instance, hooks can't be
// called in a loop" reasoning both source components already followed. angleRad is a plain per-index
// constant (golden-angle spread) rather than a SharedValue — it never changes once a particle exists.
function GravityWellParticle({ index, x, y, holeRadius, attracting, progress, foreground, particleCount, minDotRadius, maxDotRadius, maxHoleRadiusForScale }: GravityWellParticleProps) {
  const angleRad = gravityParticleAngleRad(index)
  const phase = useDerivedValue(() => gravityParticlePhase(progress.value, index, particleCount))
  // Bounded by the hole's own edge, not some larger field beyond it — particles stay contained inside
  // the well itself (0 at the center, holeRadius.value at its edge), never spilling into whatever's
  // around it. Reading attracting.value directly here (rather than some closed-over boolean) is what
  // lets a live polarity flip take effect on the very next frame.
  const orbitRadius = useDerivedValue(() => gravityParticleRadius(phase.value, 0, holeRadius.value, attracting.value))
  const cx = useDerivedValue(() => x.value + Math.cos(angleRad) * orbitRadius.value)
  const cy = useDerivedValue(() => y.value + Math.sin(angleRad) * orbitRadius.value)
  const opacity = useDerivedValue(() => gravityParticleOpacity(phase.value))
  // Depth (gravityParticleDotRadius, center-to-edge within this particle's own hole) optionally times
  // an overall scale (gravityParticleSizeScale, how big that whole range gets given how strong the
  // well currently is) — maxHoleRadiusForScale omitted skips the multiply entirely (BoxHockey's
  // wells don't scale by strength), given applies it (Swirlio's behavior).
  const dotRadius = useDerivedValue(() => {
    const depthRadius = gravityParticleDotRadius(orbitRadius.value, holeRadius.value, minDotRadius, maxDotRadius)
    if (maxHoleRadiusForScale === undefined) return depthRadius
    return depthRadius * gravityParticleSizeScale(holeRadius.value, maxHoleRadiusForScale)
  })
  return <Circle cx={cx} cy={cy} r={dotRadius} color={foreground} opacity={opacity} />
}

export type GravityWellProps = {
  x: SharedValue<number>
  y: SharedValue<number>
  holeRadius: SharedValue<number>
  attracting: SharedValue<boolean>
  progress: SharedValue<number>
  foreground: SharedValue<string>
  holeFillColor?: SharedValue<string>
  holeFillOpacity?: number
  holeOutlineColor?: SharedValue<string>
  holeOutlineWidth?: number
  particleCount?: number
  minDotRadius?: number
  maxDotRadius?: number
  maxHoleRadiusForScale?: number
}

// Gravity's own marker. A filled hole sized by holeRadius, plus foreground-colored particles either
// falling toward its center or emanating out toward its edge depending on `attracting`, contained
// entirely within the hole itself (see gravityParticleRadius's own 0..holeRadius bound).
//
// holeFillColor/holeFillOpacity default to `foreground`/1 — BoxHockey's call site instead passes
// holeFillColor={foreground} holeFillOpacity={0.16} (a low-opacity accent-colored field, since its
// wells need to read as a zone against the board rather than a hard hole), Swirlio's passes
// holeFillColor={background} at the default full opacity (a genuine punched-through hole in the
// pattern behind it). holeOutlineColor is omitted entirely by default — no outline circle is drawn at
// all (BoxHockey's look, removed there per playtesting feedback); given, a second stroked Circle is
// drawn at the same cx/cy/r as the fill, after every particle (matching Swirlio's own "drawn last, on
// top of the particles" comment) so the hole still reads as a distinct shape against a background
// close in value to its own fill.
export function GravityWell({ x, y, holeRadius, attracting, progress, foreground, holeFillColor, holeFillOpacity, holeOutlineColor, holeOutlineWidth, particleCount, minDotRadius, maxDotRadius, maxHoleRadiusForScale }: GravityWellProps) {
  const resolvedParticleCount = particleCount ?? DEFAULT_PARTICLE_COUNT
  const resolvedMinDotRadius = minDotRadius ?? DEFAULT_MIN_DOT_RADIUS_PX
  const resolvedMaxDotRadius = maxDotRadius ?? DEFAULT_MAX_DOT_RADIUS_PX

  // Per-instance, not module-level — particleCount is now a runtime prop, so a fixed-size constant
  // array (as both source components used, back when their own particle counts were hardcoded)
  // would no longer track it.
  const particleIndices = useMemo(() => Array.from({ length: particleCount ?? DEFAULT_PARTICLE_COUNT }, (_, index) => index), [particleCount])

  return (
    <Group>
      <Circle cx={x} cy={y} r={holeRadius} color={holeFillColor ?? foreground} opacity={holeFillOpacity ?? DEFAULT_HOLE_FILL_OPACITY} />
      {particleIndices.map((index) => (
        <GravityWellParticle key={index} index={index} x={x} y={y} holeRadius={holeRadius} attracting={attracting} progress={progress} foreground={foreground} particleCount={resolvedParticleCount} minDotRadius={resolvedMinDotRadius} maxDotRadius={resolvedMaxDotRadius} maxHoleRadiusForScale={maxHoleRadiusForScale} />
      ))}
      {holeOutlineColor && <Circle cx={x} cy={y} r={holeRadius} style='stroke' strokeWidth={holeOutlineWidth ?? DEFAULT_HOLE_OUTLINE_WIDTH_PX} color={holeOutlineColor} />}
    </Group>
  )
}
