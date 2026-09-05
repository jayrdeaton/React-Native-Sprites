import { Circle } from '@shopify/react-native-skia'

// Reconciled from BoxHockey's and AirHockey's Board.tsx "Rink faceoff circles" — purely decorative
// rink chrome present in every state alike: a stroked ring plus a small filled center dot, both in
// the same per-player color, at the same cx/cy. Confirmed identical resting shape in both apps
// (1.5px ring strokeWidth, dot radius = 8% of the ring's own radius via `faceoffRadius * 0.08`).
//
// Deliberately NOT built on this package's own Disc — Disc's fill and ring share one radius (a
// same-size highlight ring on a puck/paddle/ball); a faceoff circle's dot is a small, separate
// bullseye well inside a much bigger ring, a fundamentally different shape, not a Disc call with
// different numbers.
//
// BoxHockey layers extra pulse/tint animation on top of this exact ring+dot for its own interactive
// faceoff-draw mechanic (a countdown pulse, a live-target tint, a ready-check breathing ring) — real
// game-rules state (whose turn, which zone is currently live) that stays app-local. This component
// only ever draws the static ring+dot both apps render identically underneath all of that; a caller
// wanting BoxHockey's live/pulse look layers its own Group/Circle overlays around this component,
// the same way BoxHockey itself layers them around its own ring+dot today.

const DEFAULT_RING_WIDTH_PX = 1.5
// Both apps' own shared resting-state fraction (`faceoffRadius * 0.08`) — BoxHockey's own enlarged
// 0.32 while a draw is live is real interactive state, so a caller passes its own already-multiplied
// dotRadius for that look rather than this component growing a "live" mode of its own.
const DEFAULT_DOT_RADIUS_FRACTION = 0.08

export type FaceoffCircleProps = {
  x: number
  y: number
  /** Outer stroked ring's radius. */
  radius: number
  color: string
  /** Center dot's radius. Omitted defaults to `radius * 0.08`, both apps' own shared resting-state
   *  look — pass an already-resolved pixel value (e.g. BoxHockey's own live-state `radius * 0.32`)
   *  for any other size. */
  dotRadius?: number
  ringWidth?: number
}

export function FaceoffCircle({ x, y, radius, color, dotRadius, ringWidth }: FaceoffCircleProps) {
  return (
    <>
      <Circle cx={x} cy={y} r={radius} style='stroke' strokeWidth={ringWidth ?? DEFAULT_RING_WIDTH_PX} color={color} />
      <Circle cx={x} cy={y} r={dotRadius ?? radius * DEFAULT_DOT_RADIUS_FRACTION} color={color} />
    </>
  )
}
