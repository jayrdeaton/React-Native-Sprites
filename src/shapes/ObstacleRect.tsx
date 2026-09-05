import { Rect } from '@shopify/react-native-skia'

// Reconciled from BoxHockey's and AirHockey's Board.tsx (a single opaque Rect, no outline —
// confirmed identical in both) and LightCycles' GameBoard.tsx ObstacleCell (a near-opaque fill
// Rect plus a second, stroked Rect of the same color on top). Not called "Wall" — LightCycles
// already has an unrelated concept by that name (its own per-player-zone perimeter outline) and
// reusing the word here would be confusing. strokeColor is omitted by default so BoxHockey/
// AirHockey's plain-fill look is the default; LightCycles' own outline is opt-in via
// strokeColor/strokeWidth instead of being forced onto apps that never had one.

const DEFAULT_STROKE_WIDTH_PX = 1.5

export type ObstacleRectProps = {
  x: number
  y: number
  width: number
  height: number
  color: string
  /** BoxHockey/AirHockey never set this (Skia's own default: fully opaque). LightCycles passes
   *  0.85 so its separate stroked outline (see strokeColor) reads as a distinct top layer. */
  opacity?: number
  /** Omitted (the default) draws no outline at all — BoxHockey/AirHockey's look. Given, a second
   *  Rect is stroked on top at the same x/y/width/height, in strokeColor — LightCycles' look. */
  strokeColor?: string
  strokeWidth?: number
}

export function ObstacleRect({ x, y, width, height, color, opacity, strokeColor, strokeWidth }: ObstacleRectProps) {
  return (
    <>
      <Rect x={x} y={y} width={width} height={height} color={color} opacity={opacity} />
      {strokeColor && <Rect x={x} y={y} width={width} height={height} style='stroke' strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH_PX} color={strokeColor} />}
    </>
  )
}
