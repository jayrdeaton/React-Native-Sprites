import { Group, Line, vec } from '@shopify/react-native-skia'
import { useEffect, useRef } from 'react'
import { Easing, interpolateColor, useDerivedValue, useSharedValue, withTiming } from 'react-native-reanimated'

// Reconciled from BoxHockey's and AirHockey's Board.tsx "Goal door flash" (puck/ball hit the
// invisible one-way door at the goal mouth) — confirmed byte-for-byte identical logic in both apps
// (AirHockey's own comment: "Ported from BoxHockey unchanged"), including all four decay/glow
// constants (GOAL_DOOR_FLASH_COLOR_DECAY_MS=120, GOAL_DOOR_FLASH_OPACITY_DECAY_MS=1200,
// GOAL_DOOR_FLASH_GLOW_WIDTH_RATIO=4, GOAL_DOOR_FLASH_GLOW_PEAK_OPACITY=0.55) and the hot-white
// peak color (#FFFFFF) each side's flash decays back down from — all baked in here as internal
// constants rather than props, same treatment this package's own CelebrationRings gives its own
// confirmed-identical timings, since no source app varies any of them.
//
// A two-layer (glow + core) color/opacity flash per side: *ColorT (fast) drives the hot-white ->
// goal-owner's-color cooldown via interpolateColor AND the wide, low-opacity glow layer's own
// opacity; *OpacityT (slow) drives only the crisp core line's opacity, independently, so the line
// settles into its resting color quickly but lingers visible much longer than the glow does. Both
// sides share one hitCount + hitSide discriminator (matching both source apps' own
// goalDoorHitCount/lastGoalDoorSide BoardProps) rather than being two separate components each with
// its own hit counter, since a real hit is only ever on one side at a time and this mirrors the
// shape callers already have their own game state in.
//
// hitCount is compared against a ref seeded with its OWN first-render value (not a hardcoded 0) —
// both source apps' own comments explain why: this counter never resets between rounds/games, so a
// component remounting partway through one (e.g. Fast Refresh) could otherwise see an
// already-nonzero starting value and spuriously flash on mount.

const DEFAULT_STROKE_WIDTH_PX = 4
const GLOW_WIDTH_RATIO = 4
const GLOW_PEAK_OPACITY = 0.55
const COLOR_DECAY_MS = 120
const OPACITY_DECAY_MS = 1200
const FLASH_PEAK_COLOR = '#FFFFFF'

export type GoalDoorFlashProps = {
  /** Goal mouth's horizontal span, shared by both doors — wherever the caller's own goal-line
   *  <Line>s deliberately leave a gap open for this component to fill in on a hit. */
  leftX: number
  rightX: number
  /** y of the top door / bottom door, matching whatever the caller draws its own boundary Lines at. */
  topY: number
  bottomY: number
  /** Color each side's flash decays back down to once the hot-white impact peak cools — the goal
   *  OWNER's color (a hit on the top door means whoever defends the top conceded, so BoxHockey/
   *  AirHockey both interpolate it toward THAT player's own color). Which player owns which side is
   *  real game logic and stays with the caller. */
  topColor: string
  bottomColor: string
  /** Matches the caller's own goal-line strokeWidth so the settled core layer reads as "the goal
   *  line, right here" rather than a new element. Default 4, both apps' own shared
   *  GOAL_LINE_STROKE_WIDTH. */
  strokeWidth?: number
  /** Same counter+side-discriminator shape as both source apps' own BoardProps
   *  (goalDoorHitCount/lastGoalDoorSide) — incrementing hitCount with hitSide 'top' or 'bottom'
   *  triggers that side's flash; the other side is untouched. Seed hitCount at whatever value your
   *  own game state already holds (not necessarily 0) — see this file's own header comment for why
   *  a remount is still safe even when that value is already nonzero. */
  hitCount: number
  hitSide: 'top' | 'bottom' | null
}

export function GoalDoorFlash({ leftX, rightX, topY, bottomY, topColor, bottomColor, strokeWidth, hitCount, hitSide }: GoalDoorFlashProps) {
  const resolvedStrokeWidth = strokeWidth ?? DEFAULT_STROKE_WIDTH_PX

  const topColorT = useSharedValue(0)
  const bottomColorT = useSharedValue(0)
  const topOpacityT = useSharedValue(0)
  const bottomOpacityT = useSharedValue(0)
  const prevHitCountRef = useRef(hitCount)
  useEffect(() => {
    if (hitCount === prevHitCountRef.current) return
    prevHitCountRef.current = hitCount
    const colorSv = hitSide === 'top' ? topColorT : hitSide === 'bottom' ? bottomColorT : null
    const opacitySv = hitSide === 'top' ? topOpacityT : hitSide === 'bottom' ? bottomOpacityT : null
    if (!colorSv || !opacitySv) return
    colorSv.value = 1
    colorSv.value = withTiming(0, { duration: COLOR_DECAY_MS, easing: Easing.out(Easing.quad) })
    opacitySv.value = 1
    opacitySv.value = withTiming(0, { duration: OPACITY_DECAY_MS, easing: Easing.out(Easing.quad) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hitCount])

  const topColorV = useDerivedValue(() => interpolateColor(topColorT.value, [0, 1], [topColor, FLASH_PEAK_COLOR]))
  const bottomColorV = useDerivedValue(() => interpolateColor(bottomColorT.value, [0, 1], [bottomColor, FLASH_PEAK_COLOR]))
  const topGlowOpacity = useDerivedValue(() => topColorT.value * GLOW_PEAK_OPACITY)
  const bottomGlowOpacity = useDerivedValue(() => bottomColorT.value * GLOW_PEAK_OPACITY)
  const topCoreOpacity = useDerivedValue(() => topOpacityT.value)
  const bottomCoreOpacity = useDerivedValue(() => bottomOpacityT.value)

  return (
    <>
      <Group opacity={topGlowOpacity}>
        <Line p1={vec(leftX, topY)} p2={vec(rightX, topY)} color={topColorV} strokeWidth={resolvedStrokeWidth * GLOW_WIDTH_RATIO} />
      </Group>
      <Group opacity={bottomGlowOpacity}>
        <Line p1={vec(leftX, bottomY)} p2={vec(rightX, bottomY)} color={bottomColorV} strokeWidth={resolvedStrokeWidth * GLOW_WIDTH_RATIO} />
      </Group>
      <Group opacity={topCoreOpacity}>
        <Line p1={vec(leftX, topY)} p2={vec(rightX, topY)} color={topColorV} strokeWidth={resolvedStrokeWidth} />
      </Group>
      <Group opacity={bottomCoreOpacity}>
        <Line p1={vec(leftX, bottomY)} p2={vec(rightX, bottomY)} color={bottomColorV} strokeWidth={resolvedStrokeWidth} />
      </Group>
    </>
  )
}
