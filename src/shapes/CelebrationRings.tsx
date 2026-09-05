import { Circle, Group } from '@shopify/react-native-skia'
import { useEffect } from 'react'
import { Easing, useDerivedValue, useSharedValue, withDelay, withTiming } from 'react-native-reanimated'

// Reconciled from BoxHockey's and AirHockey's Board.tsx goal-celebration rings — a trio of
// stroked circles expanding outward from a point and fading as they grow, staggered 160ms apart,
// confirmed byte-for-byte identical between the two apps (same 850/160/320ms timings, same 0.75
// peak opacity, same 2.5/2/1.5 per-ring stroke widths). Centered on the goal itself (x/y) rather
// than on any specific puck/ball instance — a scored puck may already be fading or bursting away
// on its own concurrently (see e.g. BoxHockey's own puck-departure shard burst, which is NOT
// duplicated closely enough between apps to belong in this shared package) while these rings mark
// the goal that was scored on.
//
// triggerKey mirrors both apps' own `lastScoredGoal` dependency: the three rings reset to 0 and
// restart their expansion whenever this prop changes to a non-null value; null is always "no
// celebration playing," matching both apps resetting lastScoredGoal back to null between rounds.
//
// This component doesn't hide itself at rest — before any trigger fires, all three rings sit at
// baseRadius with 0.75 opacity (the literal result of ring1P/2P/3P starting at 0), same as both
// source apps' own pre-effect defaults. Both apps only ever mount their ring JSX at all behind
// `lastScoredGoal !== null`; a caller here is expected to do the same (`triggerKey !== null &&
// <CelebrationRings ... />`) rather than relying on this component to hide its own rest state.

const RING_DURATION_MS = 850
const RING_STAGGER_MS = 160
const RING_PEAK_OPACITY = 0.75
const RING1_STROKE_WIDTH_PX = 2.5
const RING2_STROKE_WIDTH_PX = 2
const RING3_STROKE_WIDTH_PX = 1.5

export type CelebrationRingsProps = {
  x: number
  y: number
  color: string
  baseRadius: number
  maxExpansionRadius: number
  triggerKey: string | number | null
}

export function CelebrationRings({ x, y, color, baseRadius, maxExpansionRadius, triggerKey }: CelebrationRingsProps) {
  // Kept as shared values (not read directly as the plain props) so the derived radii below stay
  // current even if the board is resized mid-celebration — same discipline as puckRadiusSV/
  // maxRingR in both source apps, and GravityWell's own holeRadius hoisting in this package.
  const baseRadiusSV = useSharedValue(baseRadius)
  baseRadiusSV.value = baseRadius
  const maxExpansionSV = useSharedValue(maxExpansionRadius)
  maxExpansionSV.value = maxExpansionRadius

  const ring1P = useSharedValue(0)
  const ring2P = useSharedValue(0)
  const ring3P = useSharedValue(0)

  useEffect(() => {
    if (triggerKey === null) return
    ring1P.value = 0
    ring2P.value = 0
    ring3P.value = 0
    ring1P.value = withTiming(1, { duration: RING_DURATION_MS, easing: Easing.out(Easing.cubic) })
    ring2P.value = withDelay(RING_STAGGER_MS, withTiming(1, { duration: RING_DURATION_MS, easing: Easing.out(Easing.cubic) }))
    ring3P.value = withDelay(RING_STAGGER_MS * 2, withTiming(1, { duration: RING_DURATION_MS, easing: Easing.out(Easing.cubic) }))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerKey])

  const ring1R = useDerivedValue(() => baseRadiusSV.value + ring1P.value * maxExpansionSV.value)
  const ring2R = useDerivedValue(() => baseRadiusSV.value + ring2P.value * maxExpansionSV.value)
  const ring3R = useDerivedValue(() => baseRadiusSV.value + ring3P.value * maxExpansionSV.value)
  const ring1O = useDerivedValue(() => (1 - ring1P.value) * RING_PEAK_OPACITY)
  const ring2O = useDerivedValue(() => (1 - ring2P.value) * RING_PEAK_OPACITY)
  const ring3O = useDerivedValue(() => (1 - ring3P.value) * RING_PEAK_OPACITY)

  return (
    <Group>
      <Group opacity={ring1O}>
        <Circle cx={x} cy={y} r={ring1R} style='stroke' strokeWidth={RING1_STROKE_WIDTH_PX} color={color} />
      </Group>
      <Group opacity={ring2O}>
        <Circle cx={x} cy={y} r={ring2R} style='stroke' strokeWidth={RING2_STROKE_WIDTH_PX} color={color} />
      </Group>
      <Group opacity={ring3O}>
        <Circle cx={x} cy={y} r={ring3R} style='stroke' strokeWidth={RING3_STROKE_WIDTH_PX} color={color} />
      </Group>
    </Group>
  )
}
