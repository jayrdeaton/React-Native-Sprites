import { Group, Line, vec } from '@shopify/react-native-skia'

// Reconciled from BoxHockey's and AirHockey's Board.tsx "Zone lines" — a rink's blue-line
// equivalent: a bold full-width bar, in a player's own color, sitting further out than the goal
// crease/faceoff circles but short of center. Confirmed identical geometry in both apps (the same
// `zoneLineFraction = 0.72` — real blue lines sit about 70% of the way from the goal line to center
// ice) and the same 4px strokeWidth (BoxHockey's own literal `4`, AirHockey's identical
// GOAL_LINE_STROKE_WIDTH constant) inside the same 0.5-opacity wrapper Group. One line per player —
// a caller renders this twice, once per player's own zoneLineY/color, same as both source apps'
// own two adjacent <Line> elements.

const DEFAULT_STROKE_WIDTH_PX = 4
const DEFAULT_OPACITY = 0.5

export type ZoneLineProps = {
  /** Left edge of the board — the line spans the full width from here, the way a real blue line
   *  spans the full rink, so it reads as "this whole zone is yours" rather than another marker for
   *  the goal itself. */
  x: number
  width: number
  y: number
  color: string
  strokeWidth?: number
  /** Both source apps wrap their zone lines in a shared `<Group opacity={0.5}>` — that literal
   *  value is this prop's default, overridable for a caller that wants a bolder or subtler line. */
  opacity?: number
}

export function ZoneLine({ x, width, y, color, strokeWidth, opacity }: ZoneLineProps) {
  return (
    <Group opacity={opacity ?? DEFAULT_OPACITY}>
      <Line p1={vec(x, y)} p2={vec(x + width, y)} color={color} strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH_PX} />
    </Group>
  )
}
