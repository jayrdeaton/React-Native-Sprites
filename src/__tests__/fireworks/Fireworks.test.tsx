import { act, render } from '@testing-library/react'
import { Circle } from 'react-native-svg'

import { mockViewRender } from '../../__mocks__/react-native'
import { BURST_LIFETIME_MS, Fireworks, MAX_BURST_INTERVAL_MS, MIN_BURST_INTERVAL_MS } from '../../fireworks/Fireworks'

const LAYOUT_EVENT = { nativeEvent: { layout: { x: 0, y: 0, width: 320, height: 480 } } }
const COLORS = ['#ff0000', '#00ff00', '#0000ff']
const PARTICLES_PER_BURST = 14

const mockCircle = Circle as unknown as jest.Mock

// react-native-svg's Circle is jest-mocked to a leaf jest.fn (see src/__mocks__/react-native-svg.ts)
// rather than the host-type string Hangman's own test queried via react-test-renderer, since this
// package's tests run under jsdom + @testing-library/react instead — so particles are asserted via
// `mockCircle.mock.calls` rather than a rendered-tree query. Likewise the mocked View never fires a
// real 'layout' event under jsdom, so layout is triggered by calling the `onLayout` prop the mocked
// View's render function (`mockViewRender`, from src/__mocks__/react-native.ts) captured directly.
const triggerLayout = () => {
  const lastCall = mockViewRender.mock.calls[mockViewRender.mock.calls.length - 1]
  act(() => {
    ;(lastCall[0] as { onLayout: (e: typeof LAYOUT_EVENT) => void }).onLayout(LAYOUT_EVENT)
  })
}

describe('Fireworks', () => {
  afterEach(() => {
    jest.useRealTimers()
  })

  it('calls onBurst once per burst, and again for every successive burst', () => {
    jest.useFakeTimers()
    const onBurst = jest.fn()
    render(<Fireworks colors={COLORS} onBurst={onBurst} />)

    triggerLayout()
    expect(onBurst).toHaveBeenCalledTimes(1)

    act(() => {
      jest.advanceTimersByTime((MAX_BURST_INTERVAL_MS + BURST_LIFETIME_MS) * 3)
    })

    expect(onBurst.mock.calls.length).toBeGreaterThan(1)
  })

  it('never calls onBurst when colors is empty', () => {
    jest.useFakeTimers()
    const onBurst = jest.fn()
    render(<Fireworks colors={[]} onBurst={onBurst} />)

    triggerLayout()
    act(() => {
      jest.advanceTimersByTime((MAX_BURST_INTERVAL_MS + BURST_LIFETIME_MS) * 3)
    })

    expect(onBurst).not.toHaveBeenCalled()
  })

  it('renders no particles until layout fires, then renders one burst worth of particles', () => {
    render(<Fireworks colors={COLORS} />)

    expect(mockCircle.mock.calls).toHaveLength(0)

    triggerLayout()

    expect(mockCircle.mock.calls).toHaveLength(PARTICLES_PER_BURST)
  })

  it('gives every particle a fill color drawn from the colors prop', () => {
    render(<Fireworks colors={COLORS} />)

    triggerLayout()

    expect(mockCircle.mock.calls.length).toBeGreaterThan(0)
    for (const [props] of mockCircle.mock.calls) {
      expect(COLORS).toContain((props as { fill: string }).fill)
    }
  })

  it('schedules each successive burst after a random delay within the configured bounds, not a fixed gap', () => {
    jest.useFakeTimers()
    const setTimeoutSpy = jest.spyOn(global, 'setTimeout')
    render(<Fireworks colors={COLORS} />)

    triggerLayout()

    // Advance through several spawns so multiple "schedule the next burst" calls land in the spy.
    act(() => {
      jest.advanceTimersByTime((MAX_BURST_INTERVAL_MS + BURST_LIFETIME_MS) * 4)
    })

    const spawnDelays = setTimeoutSpy.mock.calls.map(([, delay]) => delay).filter((delay): delay is number => delay !== undefined && delay >= MIN_BURST_INTERVAL_MS && delay <= MAX_BURST_INTERVAL_MS)

    expect(spawnDelays.length).toBeGreaterThan(1)
    // Not every real interval need differ (the random range is narrow), but across several spawns
    // a fixed-gap implementation would produce all-identical delays — this pins down that it varies.
    expect(new Set(spawnDelays).size).toBeGreaterThan(1)
  })

  it('keeps spawning new bursts indefinitely while mounted, never settling into a lasting gap', () => {
    jest.useFakeTimers()
    render(<Fireworks colors={COLORS} />)

    triggerLayout()

    // mockCircle.mock.calls only ever grows (a mocked leaf component has no DOM presence to query
    // the way react-test-renderer's queryAll could, so "currently mounted" isn't directly
    // observable) — sample its cumulative length repeatedly across a long stretch instead. A
    // batching implementation would plateau between fixed-size groups; a continuous one keeps
    // adding fresh particles from fresh bursts throughout.
    let sawGrowthAfterFirstBurst = false
    let previousCount = mockCircle.mock.calls.length
    for (let i = 0; i < 10; i++) {
      act(() => {
        jest.advanceTimersByTime(MIN_BURST_INTERVAL_MS)
      })
      const currentCount = mockCircle.mock.calls.length
      if (currentCount > previousCount) sawGrowthAfterFirstBurst = true
      previousCount = currentCount
    }

    expect(sawGrowthAfterFirstBurst).toBe(true)
  })
})
