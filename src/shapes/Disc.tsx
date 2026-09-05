import { Circle, Group } from '@shopify/react-native-skia'
import type { SharedValue } from 'react-native-reanimated'

// Reconciled from BoxHockey's and AirHockey's puck (a flat-filled circle plus a separately
// opacity-animated stroked ring on top — BoxHockey recolors the ring to the active player's color
// and pulses it while idle/interceptable, AirHockey keeps it a plain white pulse) and AirHockey's
// own paddle (the identical filled-circle-plus-ring shape, just with no ring animation at all).
// Pong's ball is the ring-less case: just the filled circle, with its own opacity pulsing instead
// of a ring's — ringColor omitted skips the ring entirely, matching that look.
//
// opacity/ringOpacity are typed to accept a react-native-reanimated SharedValue as well as a plain
// number because every real call site drives them that way: each app wraps its own circle(s) in a
// `<Group opacity={...}>` fed by a worklet-driven idle-breathing pulse (900ms sin inOut, identical
// across all three apps) rather than a plain number, so the pulse animates at 60fps without this
// component (or its caller) re-rendering every frame. This component never reads `.value` itself
// — it just forwards whatever it's given straight to Group's own opacity prop, the same
// "SharedValue in, SharedValue out" discipline GravityWell already follows. The base/amplitude the
// pulse maps to, and the game phase that triggers it, both differ per app and are real game logic
// — that stays with the caller, never baked in here.

const DEFAULT_RING_WIDTH_PX = 2

export type DiscProps = {
  x: number
  y: number
  radius: number
  color: string
  opacity?: number | SharedValue<number>
  /** Omitted (the default) draws no ring at all — Pong's ball. Given, a second Circle is stroked
   *  on top at the same x/y/radius. */
  ringColor?: string
  ringWidth?: number
  ringOpacity?: number | SharedValue<number>
}

export function Disc({ x, y, radius, color, opacity, ringColor, ringWidth, ringOpacity }: DiscProps) {
  return (
    <Group opacity={opacity}>
      <Circle cx={x} cy={y} r={radius} color={color} />
      {ringColor && (
        <Group opacity={ringOpacity}>
          <Circle cx={x} cy={y} r={radius} style='stroke' strokeWidth={ringWidth ?? DEFAULT_RING_WIDTH_PX} color={ringColor} />
        </Group>
      )}
    </Group>
  )
}
