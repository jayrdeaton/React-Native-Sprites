import { Circle } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { MysteryPickup, type MysteryPickupProps } from '../../shapes/MysteryPickup'

// Mirrors CelebrationRings.test.tsx's own convention and its own header comment's reasoning:
// react-native-reanimated's mock (src/__mocks__/react-native-reanimated.ts) resolves withTiming/
// withDelay/withRepeat as passthroughs (no simulated progress-over-time), so this component's mount
// effect reads as already fully resolved (intro=1, pulse=1) the instant it flushes. But that first
// render's own useDerivedValue calls already ran *before* the effect (React flushes effects after
// render), so they still reflect the pre-effect snapshot (intro=0, pulse=0) — a second, identical
// rerender is needed to see a fresh useDerivedValue call against the now-resolved shared values.
// This suite asserts those two real endpoints (freshly mounted vs. settled), not mid-animation
// timing, same as CelebrationRings' own tests.

const defaults: MysteryPickupProps = { x: 40, y: 55, radius: 10, color: '#ff8800' }

function renderPickup(props: Partial<MysteryPickupProps> = {}) {
  return render(<MysteryPickup {...defaults} {...props} />)
}

function circleCalls() {
  return (Circle as jest.Mock).mock.calls
}

// Clears the mock and rerenders with identical props, so the resulting circleCalls() reflect only
// this render's own (now fully-resolved) useDerivedValue snapshot — see this file's header comment.
function settle(rerender: ReturnType<typeof renderPickup>['rerender'], props: Partial<MysteryPickupProps> = {}) {
  ;(Circle as jest.Mock).mockClear()
  rerender(<MysteryPickup {...defaults} {...props} />)
}

describe('MysteryPickup', () => {
  it('draws exactly a fill Circle and a stroked ring Circle, both at the given position/color', () => {
    renderPickup()

    expect(circleCalls().length).toBe(2)
    expect(circleCalls()[0][0]).toMatchObject({ cx: 40, cy: 55, color: '#ff8800' })
    expect(circleCalls()[1][0]).toMatchObject({ cx: 40, cy: 55, style: 'stroke', strokeWidth: 1.5, color: '#ff8800' })
  })

  it('starts at spawnStartScale of radius with both layers fully transparent, the instant it mounts', () => {
    renderPickup({ radius: 10 })

    expect(circleCalls()[0][0].r.value).toBeCloseTo(4, 10) // 10 * default spawnStartScale 0.4
    expect(circleCalls()[0][0].opacity.value).toBe(0)
    expect(circleCalls()[1][0].opacity.value).toBe(0)
  })

  it('grows to radius * (1 + pulseScale) and fades in to the default fill/ring opacities once the spawn settles', () => {
    const { rerender } = renderPickup({ radius: 10 })

    settle(rerender, { radius: 10 })

    expect(circleCalls()[0][0].r.value).toBeCloseTo(11.6, 10) // 10 * (1 + default pulseScale 0.16)
    expect(circleCalls()[0][0].opacity.value).toBeCloseTo(0.35, 10)
    expect(circleCalls()[1][0].opacity.value).toBeCloseTo(1, 10)
  })

  it('uses ringColor instead of color for the ring when given, matching a Snake-style white ring', () => {
    renderPickup({ ringColor: '#ffffff' })

    expect(circleCalls()[0][0].color).toBe('#ff8800')
    expect(circleCalls()[1][0].color).toBe('#ffffff')
  })

  it('uses an explicit ringWidth instead of the default when provided', () => {
    renderPickup({ ringWidth: 2 })

    expect(circleCalls()[1][0].strokeWidth).toBe(2)
  })

  it('reaches given fillOpacity/ringOpacity peaks instead of the defaults once settled, matching a Snake-style fully-solid fill', () => {
    const { rerender } = renderPickup({ radius: 10, fillOpacity: 1, ringOpacity: 0.8 })

    settle(rerender, { radius: 10, fillOpacity: 1, ringOpacity: 0.8 })

    expect(circleCalls()[0][0].opacity.value).toBeCloseTo(1, 10)
    expect(circleCalls()[1][0].opacity.value).toBeCloseTo(0.8, 10)
  })

  it('skips the grow-in entirely when spawnFadeMs is 0, landing straight on the pulsed radius once settled', () => {
    const { rerender } = renderPickup({ radius: 10, spawnFadeMs: 0 })

    settle(rerender, { radius: 10, spawnFadeMs: 0 })

    expect(circleCalls()[0][0].r.value).toBeCloseTo(11.6, 10)
  })

  it('disables the pulse entirely when pulseScale is 0, settling flat at the resting radius', () => {
    const { rerender } = renderPickup({ radius: 10, pulseScale: 0 })

    settle(rerender, { radius: 10, pulseScale: 0 })

    expect(circleCalls()[0][0].r.value).toBeCloseTo(10, 10)
  })
})
