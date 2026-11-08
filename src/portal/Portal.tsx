import { Circle, Group, Path, Skia } from '@shopify/react-native-skia'
import { type SharedValue, useDerivedValue } from 'react-native-reanimated'

import { dashArcs, orbitPoint, PORTAL_TAU, portalPulse, portalSpin, portalStroke, vortexArmPoints } from './portalGeometry'

// A portal: a way in that comes out somewhere else (DuelTastic's linked gates, the first user). Three
// looks, all animated off one clock and drawn in one color round a dark core:
//
// - 'vortex': three curved arms spinning round a dark core with a thin rim, inside a faint disc.
// - 'rift': a stacked soft glow round a dark center, a bright ring pulsing in and out, and two sparks
//   orbiting.
// - 'warp': a dashed outer ring spinning one way, a thinner dashed inner ring spinning the other, and
//   a pulsing dot in the middle.
//
// Every prop that varies per portal is a SharedValue, GravityWell's discipline: a plain value wrapped
// once behaves the same as a live one, so this component only ever reads `.value`. `progress` is the
// clock, a 0..1 loop (usePortalProgress makes one); portals handed the same clock move in step, which
// is how a caller shows two ends belong together. `mirrored` draws the mirror image, so every part
// turns the other way: a cue that doesn't rely on color (a red-green colorblind player can't tell some
// pairs of colors apart) and reads at any size. Everything fits inside `radius`, so a caller can size
// a portal like any other glyph on its board.

export type PortalVariant = 'vortex' | 'rift' | 'warp'

export const PORTAL_VARIANTS: readonly PortalVariant[] = ['vortex', 'rift', 'warp']

export type PortalProps = {
  variant: PortalVariant
  x: SharedValue<number>
  y: SharedValue<number>
  /** The portal's outer edge: nothing is drawn beyond it. */
  radius: SharedValue<number>
  /** The one color every part is drawn in, but the core. */
  color: SharedValue<string>
  /** The clock, a 0..1 loop. Spins and pulses run whole turns per loop, so its wrap never jumps. */
  progress: SharedValue<number>
  /** The hole in the middle. Default black. */
  coreColor?: SharedValue<string>
  /** Draw the mirror image: the vortex's arms wind the other way and every part turns the other way.
   *  Default false. */
  mirrored?: boolean
}

const DEFAULT_CORE_COLOR = '#000000'

// Vortex: a faint disc, three arms winding a little over half a turn from the core's rim to near
// the disc's, each drawn twice (a wide faint glow under a bright line), turning once a loop.
const VORTEX_DISC_OPACITY = 0.14
const VORTEX_ARM_COUNT = 3
const VORTEX_ARM_SHAPE = { inner: 0.32, outer: 0.96, sweepDeg: 200, segments: 24 }
const VORTEX_CORE = 0.3
const VORTEX_TURNS = 1

// Rift: three glow discs stacked (brighter toward the middle), a core a third across, a ring pulsing
// between half and two thirds out twice a loop, and two sparks opposite each other going round twice.
const RIFT_GLOW_LAYERS = [1, 0.78, 0.56]
const RIFT_GLOW_OPACITY = 0.12
const RIFT_CORE = 0.34
const RIFT_RING_REST = 0.5
const RIFT_RING_SWING = 0.16
const RIFT_PULSES = 2
const RIFT_SPARK_COUNT = 2
const RIFT_SPARK_ORBIT = 0.84
const RIFT_SPARK_TURNS = 2

// Warp: eight dashes round the outside turning once a loop, six thinner ones inside turning twice the
// other way, and a dot in the middle swelling and fading twice a loop.
const WARP_OUTER = { at: 0.86, dashes: 8, fill: 0.55, turns: 1 }
const WARP_INNER = { at: 0.56, dashes: 6, fill: 0.5, turns: -2 }
const WARP_DOT = 0.2
const WARP_DOT_SWING = 0.5
const WARP_PULSES = 2

type PartProps = Omit<PortalProps, 'variant' | 'x' | 'y' | 'mirrored'>

const MIRROR = [{ scaleX: -1 }]

function VortexPortal({ radius, color, progress, coreColor }: PartProps) {
  const arms = useDerivedValue(() => {
    const builder = Skia.PathBuilder.Make()
    for (let arm = 0; arm < VORTEX_ARM_COUNT; arm++) {
      const points = vortexArmPoints(radius.value, arm, VORTEX_ARM_COUNT, VORTEX_ARM_SHAPE)
      builder.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) builder.lineTo(points[i].x, points[i].y)
    }
    return builder.detach()
  })
  const spin = useDerivedValue(() => [{ rotate: portalSpin(progress.value, VORTEX_TURNS) }])
  const armWidth = useDerivedValue(() => portalStroke(radius.value, 0.12, 1.25))
  const glowWidth = useDerivedValue(() => armWidth.value * 2.6)
  const core = useDerivedValue(() => radius.value * VORTEX_CORE)
  const rimWidth = useDerivedValue(() => portalStroke(radius.value, 0.06, 1))
  return (
    <>
      <Circle cx={0} cy={0} r={radius} color={color} opacity={VORTEX_DISC_OPACITY} />
      <Group transform={spin}>
        <Path path={arms} style='stroke' strokeWidth={glowWidth} strokeCap='round' strokeJoin='round' color={color} opacity={0.25} />
        <Path path={arms} style='stroke' strokeWidth={armWidth} strokeCap='round' strokeJoin='round' color={color} />
      </Group>
      <Circle cx={0} cy={0} r={core} color={coreColor ?? DEFAULT_CORE_COLOR} />
      <Circle cx={0} cy={0} r={core} style='stroke' strokeWidth={rimWidth} color={color} />
    </>
  )
}

function RiftSpark({ index, radius, color, progress }: { index: number } & Pick<PartProps, 'radius' | 'color' | 'progress'>) {
  const point = useDerivedValue(() => orbitPoint(radius.value * RIFT_SPARK_ORBIT, portalSpin(progress.value, RIFT_SPARK_TURNS) + (index / RIFT_SPARK_COUNT) * PORTAL_TAU))
  const cx = useDerivedValue(() => point.value.x)
  const cy = useDerivedValue(() => point.value.y)
  const r = useDerivedValue(() => portalStroke(radius.value, 0.09, 1.2))
  return <Circle cx={cx} cy={cy} r={r} color={color} />
}

function RiftPortal({ radius, color, progress, coreColor }: PartProps) {
  const glow0 = useDerivedValue(() => radius.value * RIFT_GLOW_LAYERS[0])
  const glow1 = useDerivedValue(() => radius.value * RIFT_GLOW_LAYERS[1])
  const glow2 = useDerivedValue(() => radius.value * RIFT_GLOW_LAYERS[2])
  const core = useDerivedValue(() => radius.value * RIFT_CORE)
  const ring = useDerivedValue(() => radius.value * (RIFT_RING_REST + RIFT_RING_SWING * portalPulse(progress.value, RIFT_PULSES)))
  const ringWidth = useDerivedValue(() => portalStroke(radius.value, 0.1, 1.5))
  return (
    <>
      <Circle cx={0} cy={0} r={glow0} color={color} opacity={RIFT_GLOW_OPACITY} />
      <Circle cx={0} cy={0} r={glow1} color={color} opacity={RIFT_GLOW_OPACITY} />
      <Circle cx={0} cy={0} r={glow2} color={color} opacity={RIFT_GLOW_OPACITY} />
      <Circle cx={0} cy={0} r={core} color={coreColor ?? DEFAULT_CORE_COLOR} />
      <Circle cx={0} cy={0} r={ring} style='stroke' strokeWidth={ringWidth} color={color} />
      {Array.from({ length: RIFT_SPARK_COUNT }, (_, index) => (
        <RiftSpark key={index} index={index} radius={radius} color={color} progress={progress} />
      ))}
    </>
  )
}

function WarpRing({ ring, radius, color, progress, widthFraction, minWidth }: { ring: typeof WARP_OUTER; widthFraction: number; minWidth: number } & Pick<PartProps, 'radius' | 'color' | 'progress'>) {
  const path = useDerivedValue(() => {
    const r = radius.value * ring.at
    const oval = Skia.XYWHRect(-r, -r, r * 2, r * 2)
    const builder = Skia.PathBuilder.Make()
    const arcs = dashArcs(ring.dashes, ring.fill)
    for (let i = 0; i < arcs.length; i++) builder.addArc(oval, arcs[i].startDeg, arcs[i].sweepDeg)
    return builder.detach()
  })
  const spin = useDerivedValue(() => [{ rotate: portalSpin(progress.value, ring.turns) }])
  const width = useDerivedValue(() => portalStroke(radius.value, widthFraction, minWidth))
  return (
    <Group transform={spin}>
      <Path path={path} style='stroke' strokeWidth={width} strokeCap='round' color={color} />
    </Group>
  )
}

function WarpPortal({ radius, color, progress, coreColor }: PartProps) {
  const core = useDerivedValue(() => radius.value * WARP_INNER.at)
  const dot = useDerivedValue(() => radius.value * WARP_DOT * (1 - WARP_DOT_SWING / 2 + WARP_DOT_SWING * portalPulse(progress.value, WARP_PULSES)))
  const dotOpacity = useDerivedValue(() => 0.6 + 0.4 * portalPulse(progress.value, WARP_PULSES))
  return (
    <>
      <Circle cx={0} cy={0} r={core} color={coreColor ?? DEFAULT_CORE_COLOR} />
      <WarpRing ring={WARP_OUTER} radius={radius} color={color} progress={progress} widthFraction={0.13} minWidth={1.5} />
      <WarpRing ring={WARP_INNER} radius={radius} color={color} progress={progress} widthFraction={0.07} minWidth={1} />
      <Circle cx={0} cy={0} r={dot} color={color} opacity={dotOpacity} />
    </>
  )
}

export function Portal({ variant, x, y, radius, color, progress, coreColor, mirrored = false }: PortalProps) {
  const center = useDerivedValue(() => [{ translateX: x.value }, { translateY: y.value }])
  const parts = { radius, color, progress, coreColor }
  return (
    <Group transform={center}>
      <Group transform={mirrored ? MIRROR : undefined}>
        {variant === 'vortex' && <VortexPortal {...parts} />}
        {variant === 'rift' && <RiftPortal {...parts} />}
        {variant === 'warp' && <WarpPortal {...parts} />}
      </Group>
    </Group>
  )
}
