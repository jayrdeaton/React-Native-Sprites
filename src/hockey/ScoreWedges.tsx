import { Path, Skia } from '@shopify/react-native-skia'
import { useMemo } from 'react'

// Reconciled from BoxHockey's and AirHockey's Board.tsx p1Wedges/p2Wedges useMemo + "Score arcs"
// render loop. The angle math itself (computeGoalWedges) already lives in @tastic/physics — a
// separate, already-completed extraction: both apps' own src/utils/goalWedges.ts are one-line
// re-exports of it (`export { computeGoalWedges, type GoalWedge } from '@tastic/physics'`), not a
// second implementation. What was STILL duplicated after that extraction is only the Skia rendering
// this component now owns: building one gap-shrunk arc SkPath per wedge (confirmed identical in
// both apps, including the shared `WEDGE_GAP_DEG = 5` local constant) and stroking it filled-vs-
// unfilled by score.
//
// wedges is deliberately typed as the plain {startAngle,sweepAngle}[] shape rather than importing
// @tastic/physics's own GoalWedge type — structurally identical, so passing a real
// computeGoalWedges(scoreToWin, baseAngle) result straight through just works, without this package
// taking on a new dependency for a type alias alone. Memoized the same way both source apps memoize
// their own p1Wedges/p2Wedges — rebuilding scoreToWin's worth of SkPaths on every render would be
// wasteful, and a caller already memoizes the `wedges` array it passes in, so this stays stable
// across renders unless the underlying geometry/score-to-win genuinely changes.

const DEFAULT_GAP_DEG = 5
const DEFAULT_STROKE_WIDTH_PX = 2.5

export type ScoreWedgeAngle = {
  startAngle: number
  sweepAngle: number
}

export type ScoreWedgesProps = {
  /** Center of the goal crease circle this ring of wedges sits on. */
  cx: number
  cy: number
  radius: number
  /** One entry per wedge, in win-progress order — typically a computeGoalWedges(scoreToWin,
   *  baseAngle) result from @tastic/physics, unmodified. */
  wedges: ScoreWedgeAngle[]
  /** Wedges at index < score render filled in `color`; the rest render in `unfilledColor` — matches
   *  both apps' own `i < scores[n] ? playerColor : lineColor` check. */
  score: number
  color: string
  unfilledColor: string
  /** Degrees shaved symmetrically off each wedge's sweep (half off each end) so adjacent wedges show
   *  a visible gap rather than tiling edge-to-edge. Default 5, both apps' own literal
   *  WEDGE_GAP_DEG. */
  gapDeg?: number
  strokeWidth?: number
}

export function ScoreWedges({ cx, cy, radius, wedges, score, color, unfilledColor, gapDeg, strokeWidth }: ScoreWedgesProps) {
  const resolvedGapDeg = gapDeg ?? DEFAULT_GAP_DEG

  const paths = useMemo(() => {
    const rect = Skia.XYWHRect(cx - radius, cy - radius, radius * 2, radius * 2)
    return wedges.map(({ startAngle, sweepAngle }) =>
      Skia.PathBuilder.Make()
        .addArc(rect, startAngle + resolvedGapDeg / 2, sweepAngle - resolvedGapDeg)
        .detach()
    )
  }, [cx, cy, radius, wedges, resolvedGapDeg])

  return (
    <>
      {paths.map((path, i) => (
        <Path key={i} path={path} style='stroke' strokeWidth={strokeWidth ?? DEFAULT_STROKE_WIDTH_PX} strokeCap='round' color={i < score ? color : unfilledColor} />
      ))}
    </>
  )
}
