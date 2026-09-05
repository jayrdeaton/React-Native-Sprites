import { Group, Line } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { GoalDoorFlash, type GoalDoorFlashProps } from '../../hockey/GoalDoorFlash'

// Unlike CelebrationRings/MysteryPickup (both ramp 0 -> 1), this component's own decay runs the
// other way: `sv.value = 1` immediately followed by `sv.value = withTiming(0, {...})`. The mocked
// withTiming is a pure passthrough with no simulated progress-over-time (see
// src/__mocks__/react-native-reanimated.ts), so that second assignment resolves synchronously,
// inside the same effect, straight to its own target — 0. A triggered-and-settled flash and an
// untriggered rest state are therefore both exactly 0 under this mock, unlike a ramp-up animation
// where "resolved" (1) and "never triggered" (0) read as different numbers. This suite can't tell
// those two states apart via a final derived `.value` the way this package's other animated
// components' tests do — it instead covers what IS observable regardless: render structure/
// geometry/defaults, the rest state, that top/bottom are independently derived (not accidentally
// sharing one SharedValue), and that a hit never throws regardless of hitSide/hitCount shape.

const defaults: GoalDoorFlashProps = { leftX: 10, rightX: 90, topY: 5, bottomY: 95, topColor: '#111111', bottomColor: '#222222', hitCount: 0, hitSide: null }

function renderFlash(props: Partial<GoalDoorFlashProps> = {}) {
  return render(<GoalDoorFlash {...defaults} {...props} />)
}

function lineCalls() {
  return (Line as jest.Mock).mock.calls
}

function groupCalls() {
  return (Group as jest.Mock).mock.calls
}

describe('GoalDoorFlash', () => {
  it('draws exactly 4 Lines (top/bottom glow, then top/bottom core), each in its own Group, at the given span', () => {
    renderFlash()

    expect(lineCalls().length).toBe(4)
    expect(groupCalls().length).toBe(4)
    expect(lineCalls()[0][0]).toMatchObject({ p1: { x: 10, y: 5 }, p2: { x: 90, y: 5 } }) // top glow
    expect(lineCalls()[1][0]).toMatchObject({ p1: { x: 10, y: 95 }, p2: { x: 90, y: 95 } }) // bottom glow
    expect(lineCalls()[2][0]).toMatchObject({ p1: { x: 10, y: 5 }, p2: { x: 90, y: 5 } }) // top core
    expect(lineCalls()[3][0]).toMatchObject({ p1: { x: 10, y: 95 }, p2: { x: 90, y: 95 } }) // bottom core
  })

  it('draws the glow layer at 4x the core strokeWidth, using the default of 4 when omitted', () => {
    renderFlash()

    expect(lineCalls()[0][0].strokeWidth).toBe(16)
    expect(lineCalls()[1][0].strokeWidth).toBe(16)
    expect(lineCalls()[2][0].strokeWidth).toBe(4)
    expect(lineCalls()[3][0].strokeWidth).toBe(4)
  })

  it('scales the glow strokeWidth off an explicit strokeWidth instead of the default', () => {
    renderFlash({ strokeWidth: 2 })

    expect(lineCalls()[0][0].strokeWidth).toBe(8)
    expect(lineCalls()[2][0].strokeWidth).toBe(2)
  })

  it('sits fully transparent on all 4 layers before any hit', () => {
    renderFlash()

    for (const [props] of groupCalls()) {
      expect(props.opacity.value).toBe(0)
    }
  })

  it('derives top and bottom opacity independently rather than sharing one SharedValue', () => {
    renderFlash()

    const [topGlow, bottomGlow, topCore, bottomCore] = groupCalls().map(([props]) => props.opacity)
    expect(topGlow).not.toBe(bottomGlow)
    expect(topCore).not.toBe(bottomCore)
    expect(topGlow).not.toBe(topCore)
  })

  it("does not flash on mount even when hitCount already starts nonzero, matching both source apps' own Fast-Refresh-safety comment", () => {
    renderFlash({ hitCount: 5, hitSide: 'top' })

    for (const [props] of groupCalls()) {
      expect(props.opacity.value).toBe(0)
    }
  })

  it('never throws when hitCount changes while hitSide is null', () => {
    const { rerender } = renderFlash({ hitCount: 0, hitSide: null })

    expect(() => rerender(<GoalDoorFlash {...defaults} hitCount={1} hitSide={null} />)).not.toThrow()
  })

  it('never throws on a real hit, and both sides stay independently valid numbers afterward', () => {
    const { rerender } = renderFlash({ hitCount: 0, hitSide: null })

    expect(() => rerender(<GoalDoorFlash {...defaults} hitCount={1} hitSide='top' />)).not.toThrow()
    for (const [props] of groupCalls()) {
      expect(typeof props.opacity.value).toBe('number')
      expect(Number.isNaN(props.opacity.value)).toBe(false)
    }
  })

  it('never throws on a bottom hit specifically, exercising the other half of the top/bottom branch', () => {
    const { rerender } = renderFlash({ hitCount: 0, hitSide: null })

    expect(() => rerender(<GoalDoorFlash {...defaults} hitCount={1} hitSide='bottom' />)).not.toThrow()
    for (const [props] of groupCalls()) {
      expect(typeof props.opacity.value).toBe('number')
      expect(Number.isNaN(props.opacity.value)).toBe(false)
    }
  })
})
