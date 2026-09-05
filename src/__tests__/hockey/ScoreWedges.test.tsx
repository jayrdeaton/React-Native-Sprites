import { Path, Skia } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { ScoreWedges, type ScoreWedgesProps } from '../../hockey/ScoreWedges'

// Skia.PathBuilder.Make() returns a fresh object per call, but its addArc/close/detach all point at
// the SAME shared mock function across every returned builder (see src/__mocks__/rn-skia.ts's own
// header comment) — so reading .mock.calls off any one returned builder's addArc sees every arc any
// wedge built, in order, without needing to track each builder instance separately.
function addArcCalls() {
  const results = (Skia.PathBuilder.Make as jest.Mock).mock.results
  if (results.length === 0) return []
  return (results[0].value.addArc as jest.Mock).mock.calls
}

const wedges = [
  { startAngle: 180, sweepAngle: 60 },
  { startAngle: 240, sweepAngle: 60 },
  { startAngle: 300, sweepAngle: 60 }
]

const defaults: ScoreWedgesProps = { cx: 100, cy: 50, radius: 20, wedges, score: 1, color: '#ff0000', unfilledColor: '#cccccc' }

function renderWedges(props: Partial<ScoreWedgesProps> = {}) {
  return render(<ScoreWedges {...defaults} {...props} />)
}

function pathCalls() {
  return (Path as jest.Mock).mock.calls
}

describe('ScoreWedges', () => {
  it('builds one arc SkPath per wedge, on a bounding rect centered at cx/cy sized by radius', () => {
    renderWedges()

    expect((Skia.XYWHRect as jest.Mock).mock.calls[0]).toEqual([80, 30, 40, 40])
    expect((Skia.PathBuilder.Make as jest.Mock).mock.calls.length).toBe(3)
    expect((Skia.PathBuilder.Make as jest.Mock).mock.results.map((r) => r.value.detach).every((fn) => fn === (Skia.PathBuilder.Make as jest.Mock).mock.results[0].value.detach)).toBe(true)
  })

  it("shrinks each wedge by the default 5deg gap, split evenly off each end, matching both apps' shared WEDGE_GAP_DEG", () => {
    renderWedges()

    const calls = addArcCalls()
    expect(calls.length).toBe(3)
    expect(calls[0][1]).toBe(182.5) // 180 + 5/2
    expect(calls[0][2]).toBe(55) // 60 - 5
    expect(calls[1][1]).toBe(242.5)
    expect(calls[1][2]).toBe(55)
    expect(calls[2][1]).toBe(302.5)
    expect(calls[2][2]).toBe(55)
  })

  it('uses an explicit gapDeg instead of the default', () => {
    renderWedges({ gapDeg: 10 })

    const calls = addArcCalls()
    expect(calls[0][1]).toBe(185) // 180 + 10/2
    expect(calls[0][2]).toBe(50) // 60 - 10
  })

  it('renders exactly one stroked, round-capped Path per wedge, at the default 2.5 strokeWidth', () => {
    renderWedges()

    expect(pathCalls().length).toBe(3)
    for (const [props] of pathCalls()) {
      expect(props).toMatchObject({ style: 'stroke', strokeWidth: 2.5, strokeCap: 'round' })
    }
  })

  it('uses an explicit strokeWidth instead of the default', () => {
    renderWedges({ strokeWidth: 4 })

    expect(pathCalls()[0][0].strokeWidth).toBe(4)
  })

  it("colors wedges before `score` in color, and the rest in unfilledColor, matching both apps' own `i < scores[n] ? playerColor : lineColor`", () => {
    renderWedges({ score: 2 })

    expect(pathCalls()[0][0].color).toBe('#ff0000')
    expect(pathCalls()[1][0].color).toBe('#ff0000')
    expect(pathCalls()[2][0].color).toBe('#cccccc')
  })

  it('colors every wedge unfilledColor when score is 0', () => {
    renderWedges({ score: 0 })

    for (const [props] of pathCalls()) {
      expect(props.color).toBe('#cccccc')
    }
  })

  it('colors every wedge in color once score reaches the wedge count', () => {
    renderWedges({ score: 3 })

    for (const [props] of pathCalls()) {
      expect(props.color).toBe('#ff0000')
    }
  })
})
