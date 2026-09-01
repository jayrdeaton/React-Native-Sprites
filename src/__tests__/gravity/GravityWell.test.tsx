import { Circle, Group } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'
import type { SharedValue } from 'react-native-reanimated'

import { gravityParticleDotRadius, gravityParticlePhase, gravityParticleRadius, gravityParticleSizeScale } from '../../gravity/gravityParticleMath'
import { GravityWell, type GravityWellProps } from '../../gravity/GravityWell'

// Mirrors @tastic/hud's TriggerGauge.test.tsx pattern: Skia primitives are mocked as jest.fn (see
// src/__mocks__/rn-skia.ts), so assertions read call *props* off Circle.mock.calls/Group.mock.calls
// rather than inspecting any rendered DOM (Circle/Group both render null/passthrough, never real
// nodes). react-native-reanimated's own mock (src/__mocks__/react-native-reanimated.ts) evaluates
// useDerivedValue synchronously and returns a plain `{ value: <computed> }` object, matching
// Hangman's existing mock convention — so a Circle prop built from useDerivedValue can be read via
// `.value` directly, no act()/waitFor needed.

// A hand-rolled SharedValue stand-in — GravityWellProps only ever needs the `.value` shape here, so
// there's no need to route test fixtures through the mocked `useSharedValue` at all.
function shared<T>(value: T): SharedValue<T> {
  return { value } as SharedValue<T>
}

const DEFAULT_PARTICLE_COUNT = 14

const defaults: GravityWellProps = {
  x: shared(100),
  y: shared(100),
  holeRadius: shared(50),
  attracting: shared(true),
  progress: shared(0.3),
  foreground: shared('#f04')
}

function renderWell(props: Partial<GravityWellProps> = {}) {
  return render(<GravityWell {...defaults} {...props} />)
}

function circleCalls() {
  return (Circle as jest.Mock).mock.calls
}

describe('GravityWell', () => {
  describe('default render (particleCount omitted)', () => {
    it('draws exactly 14 particle Circles plus 1 hole-fill Circle, and no outline Circle', () => {
      renderWell()

      expect(circleCalls().length).toBe(DEFAULT_PARTICLE_COUNT + 1)
      expect((Group as jest.Mock).mock.calls.length).toBe(1)
    })

    it('draws the count of particles a custom particleCount asks for, not the default', () => {
      renderWell({ particleCount: 6 })

      expect(circleCalls().length).toBe(6 + 1)
    })
  })

  describe('holeOutlineColor', () => {
    it('draws no outline Circle when omitted', () => {
      renderWell()

      expect(circleCalls().length).toBe(DEFAULT_PARTICLE_COUNT + 1)
    })

    it('adds exactly one more Circle call, stroked, using the default holeOutlineWidth, when given', () => {
      const holeOutlineColor = shared('#0f0')
      renderWell({ holeOutlineColor })

      expect(circleCalls().length).toBe(DEFAULT_PARTICLE_COUNT + 2)

      // Drawn last, on top of every particle — matching Swirlio's own comment on its outline.
      const outlineProps = circleCalls()[circleCalls().length - 1][0]
      expect(outlineProps.style).toBe('stroke')
      expect(outlineProps.strokeWidth).toBe(1.5)
      expect(outlineProps.color).toBe(holeOutlineColor)
    })

    it('uses an explicit holeOutlineWidth instead of the default when provided', () => {
      const holeOutlineColor = shared('#0f0')
      renderWell({ holeOutlineColor, holeOutlineWidth: 4 })

      const outlineProps = circleCalls()[circleCalls().length - 1][0]
      expect(outlineProps.strokeWidth).toBe(4)
    })
  })

  describe('hole-fill Circle', () => {
    it('defaults color to foreground and opacity to 1 when holeFillColor/holeFillOpacity are omitted', () => {
      renderWell()

      const holeFillProps = circleCalls()[0][0]
      expect(holeFillProps.color).toBe(defaults.foreground)
      expect(holeFillProps.opacity).toBe(1)
    })

    it('uses holeFillColor/holeFillOpacity when provided', () => {
      const holeFillColor = shared('#00f')
      renderWell({ holeFillColor, holeFillOpacity: 0.16 })

      const holeFillProps = circleCalls()[0][0]
      expect(holeFillProps.color).toBe(holeFillColor)
      expect(holeFillProps.opacity).toBe(0.16)
    })
  })

  describe('attracting', () => {
    it('true vs false compute different orbit radii (read via a particle Circle cx offset) at the same phase', () => {
      const progress = shared(0.2)
      const holeRadius = shared(50)

      renderWell({ progress, holeRadius, attracting: shared(true) })
      // Circle call 0 is the hole fill; call 1 is particle index 0 (angleRad 0, so cx sits exactly
      // x.value + orbitRadius with no cosine attenuation to account for).
      const attractingCx = circleCalls()[1][0].cx.value
      ;(Circle as jest.Mock).mockClear()

      renderWell({ progress, holeRadius, attracting: shared(false) })
      const repellingCx = circleCalls()[1][0].cx.value

      expect(attractingCx).not.toBeCloseTo(repellingCx, 5)

      const phase = gravityParticlePhase(0.2, 0, DEFAULT_PARTICLE_COUNT)
      expect(attractingCx).toBeCloseTo(defaults.x.value + gravityParticleRadius(phase, 0, 50, true), 10)
      expect(repellingCx).toBeCloseTo(defaults.x.value + gravityParticleRadius(phase, 0, 50, false), 10)
    })
  })

  describe('maxHoleRadiusForScale', () => {
    it('multiplies a particle dot radius when given; leaves it at the unscaled depth radius when omitted', () => {
      const holeRadius = shared(40)
      const progress = shared(0.5)

      renderWell({ holeRadius, progress, attracting: shared(true) })
      const unscaledR = circleCalls()[1][0].r.value
      ;(Circle as jest.Mock).mockClear()

      renderWell({ holeRadius, progress, attracting: shared(true), maxHoleRadiusForScale: 80 })
      const scaledR = circleCalls()[1][0].r.value

      const phase = gravityParticlePhase(0.5, 0, DEFAULT_PARTICLE_COUNT)
      const orbitRadius = gravityParticleRadius(phase, 0, 40, true)
      const depthRadius = gravityParticleDotRadius(orbitRadius, 40, 0.75, 3)

      expect(unscaledR).toBeCloseTo(depthRadius, 10)
      expect(scaledR).toBeCloseTo(depthRadius * gravityParticleSizeScale(40, 80), 10)
      expect(scaledR).not.toBeCloseTo(unscaledR, 5)
    })
  })
})
