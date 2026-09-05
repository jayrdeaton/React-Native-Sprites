import { Circle, Group } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { CelebrationRings, type CelebrationRingsProps } from '../../shapes/CelebrationRings'

// Mirrors GravityWell.test.tsx's convention: Skia primitives are mocked as jest.fn (see
// src/__mocks__/rn-skia.ts), so assertions read call *props* off Circle.mock.calls/Group.mock.calls.
// react-native-reanimated's own mock (src/__mocks__/react-native-reanimated.ts) resolves
// withTiming/withDelay as passthroughs (no simulated progress-over-time), so a triggered
// celebration reads as already fully resolved (progress 1) the instant its effect flushes — this
// suite asserts the two real endpoints (never triggered vs. triggered-and-resolved), not
// mid-animation timing, same as this package's other animated components' own tests.

const defaults: CelebrationRingsProps = { x: 100, y: 5, color: '#00ff00', baseRadius: 10, maxExpansionRadius: 80, triggerKey: null }

function renderRings(props: Partial<CelebrationRingsProps> = {}) {
  return render(<CelebrationRings {...defaults} {...props} />)
}

function circleCalls() {
  return (Circle as jest.Mock).mock.calls
}

function groupCalls() {
  return (Group as jest.Mock).mock.calls
}

describe('CelebrationRings', () => {
  it('draws exactly 3 stroked Circles at the given position/color, each in its own Group, plus one outer Group', () => {
    renderRings()

    expect(circleCalls().length).toBe(3)
    expect(groupCalls().length).toBe(4)
    for (const [props] of circleCalls()) {
      expect(props).toMatchObject({ cx: 100, cy: 5, style: 'stroke', color: '#00ff00' })
    }
  })

  it('uses the confirmed 2.5/2/1.5 per-ring stroke widths, in that order', () => {
    renderRings()

    expect(circleCalls()[0][0].strokeWidth).toBe(2.5)
    expect(circleCalls()[1][0].strokeWidth).toBe(2)
    expect(circleCalls()[2][0].strokeWidth).toBe(1.5)
  })

  it('sits at baseRadius with 0.75 opacity before any trigger, since it does not hide its own rest state (see the component doc comment) — a caller is expected not to mount it until a celebration actually starts', () => {
    renderRings({ baseRadius: 10 })

    for (const [props] of circleCalls()) {
      expect(props.r.value).toBeCloseTo(10, 10)
    }
    // groupCalls()[0] is the outer, opacity-less Group; the 3 ring Groups follow it.
    for (const [props] of groupCalls().slice(1)) {
      expect(props.opacity.value).toBeCloseTo(0.75, 10)
    }
  })

  it('expands every ring to baseRadius + maxExpansionRadius and fades to 0 once triggerKey goes non-null', () => {
    const { rerender } = renderRings({ triggerKey: null, baseRadius: 10, maxExpansionRadius: 80 })

    const triggered = <CelebrationRings {...defaults} baseRadius={10} maxExpansionRadius={80} triggerKey='top' />
    // Two rerenders, deliberately: the first fires the triggering useEffect, which mutates
    // ring1P/2P/3P.value (resolved instantly by the mocked withTiming/withDelay — see this file's
    // own header comment) — but that same render's *own* r/opacity derived values were already
    // computed during render, before the effect ran, so they're still the pre-trigger snapshot.
    // The second rerender (identical props, so the effect itself does not fire again) re-invokes
    // useDerivedValue against the now-resolved shared values. mockClear() right before it, since
    // otherwise circleCalls()/groupCalls() below would still include every earlier render's
    // (stale) calls too, not just this last one's.
    rerender(triggered)
    ;(Circle as jest.Mock).mockClear()
    ;(Group as jest.Mock).mockClear()
    rerender(triggered)

    for (const [props] of circleCalls()) {
      expect(props.r.value).toBeCloseTo(90, 10)
    }
    for (const [props] of groupCalls().slice(1)) {
      expect(props.opacity.value).toBeCloseTo(0, 10)
    }
  })

  it('never triggers while triggerKey stays null across a rerender', () => {
    const { rerender } = renderRings({ triggerKey: null, baseRadius: 10 })

    rerender(<CelebrationRings {...defaults} baseRadius={10} triggerKey={null} />)

    for (const [props] of circleCalls()) {
      expect(props.r.value).toBeCloseTo(10, 10)
    }
  })
})
