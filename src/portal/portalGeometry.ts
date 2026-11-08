// Pure/worklet math for Portal. Everything is in the portal's own frame: the center is (0, 0) and
// every length is in px, worked out from the portal's radius, so the component only has to move the
// whole drawing to the portal's center and turn the parts that spin.

export const PORTAL_TAU = Math.PI * 2

// How far a spinning part has turned, in radians, `turns` whole turns per loop of the clock. Whole
// turns keep the clock's wrap from 1 back to 0 seamless (a negative count spins the other way).
export function portalSpin(progress: number, turns: number): number {
  'worklet'
  return progress * turns * PORTAL_TAU
}

// A 0..1 wave, 0 at the start of the clock's loop and `cycles` times round per loop. Whole cycles keep
// the wrap seamless, the same as portalSpin.
export function portalPulse(progress: number, cycles: number): number {
  'worklet'
  return (1 - Math.cos(progress * cycles * PORTAL_TAU)) / 2
}

// A stroke width that scales with the portal but never thins below `minPx`, so a small portal (a
// Snake gate is about 7px across) still draws lines that read.
export function portalStroke(radius: number, fraction: number, minPx: number): number {
  'worklet'
  return Math.max(minPx, radius * fraction)
}

export type PortalPoint = { x: number; y: number }

export type VortexArmShape = {
  /** Where the arm starts, as a fraction of the radius: the core's rim. */
  inner: number
  /** Where the arm ends, as a fraction of the radius. */
  outer: number
  /** How far round the arm winds from root to tip, in degrees. */
  sweepDeg: number
  /** Straight pieces the curve is drawn with. */
  segments: number
}

// One vortex arm, arm `arm` of `armCount` spread evenly round the center: an Archimedean spiral from
// the core's rim out toward the disc's rim, winding `sweepDeg` as it goes. Turning the arms the way
// they wind (a positive portalSpin) makes them read as flowing in toward the core.
export function vortexArmPoints(radius: number, arm: number, armCount: number, shape: VortexArmShape): PortalPoint[] {
  'worklet'
  const points: PortalPoint[] = []
  const root = (arm / armCount) * PORTAL_TAU
  const sweep = (shape.sweepDeg * Math.PI) / 180
  const inner = radius * shape.inner
  const outer = radius * shape.outer
  for (let i = 0; i <= shape.segments; i++) {
    const t = i / shape.segments
    const r = inner + (outer - inner) * t
    const angle = root + sweep * t
    points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r })
  }
  return points
}

export type DashArc = { startDeg: number; sweepDeg: number }

// The dashes of a dashed ring: `count` evenly spaced, each `fill` of its slot (0..1), as the start
// and sweep in degrees Skia's addArc takes.
export function dashArcs(count: number, fill: number): DashArc[] {
  'worklet'
  const slot = 360 / count
  const arcs: DashArc[] = []
  for (let i = 0; i < count; i++) arcs.push({ startDeg: i * slot, sweepDeg: slot * fill })
  return arcs
}

// A point `distance` px out from the center at `angle` radians: where an orbiting spark is.
export function orbitPoint(distance: number, angle: number): PortalPoint {
  'worklet'
  return { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance }
}
