import { Circle, Group, Path, Skia } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'
import type { SharedValue } from 'react-native-reanimated'

import { Portal, PORTAL_VARIANTS, type PortalProps } from '../../portal/Portal'

// GravityWell.test.tsx's approach: Skia primitives are jest.fn mocks (src/__mocks__/rn-skia.ts), so
// these read the props each Circle/Path/Group got, and the reanimated mock evaluates useDerivedValue
// at once, so a derived prop is read through `.value`.

function shared<T>(value: T): SharedValue<T> {
  return { value } as SharedValue<T>
}

const R = 20

function renderPortal(props: Partial<PortalProps> = {}) {
  return render(<Portal variant='vortex' x={shared(100)} y={shared(60)} radius={shared(R)} color={shared('#ff00aa')} progress={shared(0)} {...props} />)
}

const circles = () => (Circle as jest.Mock).mock.calls.map((call) => call[0])
const paths = () => (Path as jest.Mock).mock.calls.map((call) => call[0])
const groups = () => (Group as jest.Mock).mock.calls.map((call) => call[0])
const builder = () => (Skia.PathBuilder.Make as jest.Mock).mock.results[0].value
const value = <T,>(prop: T | SharedValue<T>): T => (typeof prop === 'object' && prop !== null && 'value' in prop ? (prop as SharedValue<T>).value : (prop as T))

describe('Portal', () => {
  it('moves the whole drawing to its center, for every variant', () => {
    for (const variant of PORTAL_VARIANTS) {
      ;(Group as jest.Mock).mockClear()
      renderPortal({ variant })

      expect(groups()[0].transform.value).toEqual([{ translateX: 100 }, { translateY: 60 }])
    }
  })

  it('draws the mirror image only when mirrored, for every variant', () => {
    for (const variant of PORTAL_VARIANTS) {
      ;(Group as jest.Mock).mockClear()
      renderPortal({ variant })
      expect(groups()[1].transform).toBeUndefined()

      ;(Group as jest.Mock).mockClear()
      renderPortal({ variant, mirrored: true })
      expect(groups()[1].transform).toEqual([{ scaleX: -1 }])
    }
  })

  it('draws the core black unless given a coreColor, for every variant', () => {
    for (const variant of PORTAL_VARIANTS) {
      ;(Circle as jest.Mock).mockClear()
      renderPortal({ variant })
      expect(circles().some((c) => c.color === '#000000' && c.style === undefined)).toBe(true)

      const coreColor = shared('#112233')
      ;(Circle as jest.Mock).mockClear()
      renderPortal({ variant, coreColor })
      expect(circles().some((c) => c.color === coreColor)).toBe(true)
      expect(circles().some((c) => c.color === '#000000')).toBe(false)
    }
  })

  describe('vortex', () => {
    it('draws a faint disc the full radius, the arms twice (glow and line) and a rimmed core', () => {
      renderPortal({ variant: 'vortex' })

      const [disc, core, rim] = circles()
      expect(value(disc.r)).toBe(R)
      expect(disc.opacity).toBeLessThan(0.5)
      expect(value(core.r)).toBeCloseTo(R * 0.3, 10)
      expect(rim).toMatchObject({ style: 'stroke' })
      expect(value(rim.r)).toBeCloseTo(R * 0.3, 10)

      expect(paths()).toHaveLength(2)
      expect(value(paths()[0].strokeWidth)).toBeGreaterThan(value(paths()[1].strokeWidth))
    })

    it('builds three arms into one path', () => {
      renderPortal({ variant: 'vortex' })

      expect(builder().moveTo).toHaveBeenCalledTimes(3)
      expect(builder().lineTo).toHaveBeenCalledTimes(3 * 24)
    })

    it('turns the arms once a loop', () => {
      renderPortal({ variant: 'vortex', progress: shared(0.25) })

      expect(groups()[2].transform.value).toEqual([{ rotate: Math.PI / 2 }])
    })
  })

  describe('rift', () => {
    it('stacks three glow discs, the biggest the full radius', () => {
      renderPortal({ variant: 'rift' })

      const glow = circles().slice(0, 3)
      expect(glow.map((c) => value(c.r))).toEqual([R, R * 0.78, R * 0.56])
      for (const layer of glow) expect(layer.opacity).toBeLessThan(0.2)
    })

    it('pulses its ring out from half the radius twice a loop', () => {
      renderPortal({ variant: 'rift', progress: shared(0) })
      const ringAtRest = circles().find((c) => c.style === 'stroke')
      expect(value(ringAtRest.r)).toBeCloseTo(R * 0.5, 10)

      ;(Circle as jest.Mock).mockClear()
      renderPortal({ variant: 'rift', progress: shared(0.25) })
      const ringOut = circles().find((c) => c.style === 'stroke')
      expect(value(ringOut.r)).toBeCloseTo(R * 0.66, 10)
    })

    it('orbits two sparks opposite each other, inside the radius', () => {
      renderPortal({ variant: 'rift', progress: shared(0) })

      const sparks = circles().slice(-2)
      expect(value(sparks[0].cx)).toBeCloseTo(R * 0.84, 10)
      expect(value(sparks[1].cx)).toBeCloseTo(-R * 0.84, 10)
      for (const spark of sparks) expect(Math.hypot(value(spark.cx), value(spark.cy)) + value(spark.r)).toBeLessThanOrEqual(R)
    })
  })

  describe('warp', () => {
    it('draws two dashed rings, eight dashes outside and six inside', () => {
      renderPortal({ variant: 'warp' })

      expect(paths()).toHaveLength(2)
      expect(builder().addArc).toHaveBeenCalledTimes(14)
      expect(value(paths()[0].strokeWidth)).toBeGreaterThan(value(paths()[1].strokeWidth))
    })

    it('spins the rings opposite ways, the inner one twice as fast', () => {
      renderPortal({ variant: 'warp', progress: shared(0.125) })

      const [outer, inner] = groups()
        .slice(2)
        .map((g) => g.transform.value[0].rotate)
      expect(outer).toBeCloseTo(Math.PI / 4, 10)
      expect(inner).toBeCloseTo(-Math.PI / 2, 10)
    })

    it('swells and brightens its center dot and keeps it small', () => {
      renderPortal({ variant: 'warp', progress: shared(0) })
      const restDot = circles()[circles().length - 1]
      ;(Circle as jest.Mock).mockClear()
      renderPortal({ variant: 'warp', progress: shared(0.25) })
      const fullDot = circles()[circles().length - 1]

      expect(value(fullDot.r)).toBeGreaterThan(value(restDot.r))
      expect(value(fullDot.opacity)).toBeGreaterThan(value(restDot.opacity))
      expect(value(fullDot.r)).toBeLessThan(R * 0.3)
    })
  })
})
