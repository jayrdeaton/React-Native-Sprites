import { dashArcs, orbitPoint, PORTAL_TAU, portalPulse, portalSpin, portalStroke, vortexArmPoints } from '../../portal/portalGeometry'

const SHAPE = { inner: 0.3, outer: 1, sweepDeg: 180, segments: 6 }

describe('portalSpin', () => {
  it('turns whole turns per loop, so the clock wrapping from 1 to 0 lands on the same angle', () => {
    expect(portalSpin(0, 1)).toBe(0)
    expect(portalSpin(0.25, 1)).toBeCloseTo(PORTAL_TAU / 4, 10)
    expect(Math.cos(portalSpin(1, 2))).toBeCloseTo(Math.cos(portalSpin(0, 2)), 10)
  })

  it('spins the other way for a negative count', () => {
    expect(portalSpin(0.25, -2)).toBeCloseTo(-PORTAL_TAU / 2, 10)
  })
})

describe('portalPulse', () => {
  it('starts at 0, peaks at 1 halfway through each cycle and is back at 0 when the loop wraps', () => {
    expect(portalPulse(0, 2)).toBeCloseTo(0, 10)
    expect(portalPulse(0.25, 2)).toBeCloseTo(1, 10)
    expect(portalPulse(0.5, 2)).toBeCloseTo(0, 10)
    expect(portalPulse(1, 2)).toBeCloseTo(0, 10)
  })

  it('stays between 0 and 1', () => {
    for (let p = 0; p <= 1; p += 0.01) {
      expect(portalPulse(p, 3)).toBeGreaterThanOrEqual(0)
      expect(portalPulse(p, 3)).toBeLessThanOrEqual(1)
    }
  })
})

describe('portalStroke', () => {
  it('scales with the radius on a big portal and holds the floor on a small one', () => {
    expect(portalStroke(30, 0.1, 1.5)).toBeCloseTo(3, 10)
    expect(portalStroke(7, 0.1, 1.5)).toBe(1.5)
  })
})

describe('vortexArmPoints', () => {
  it('runs from the inner fraction of the radius out to the outer one, segments + 1 points', () => {
    const points = vortexArmPoints(20, 0, 3, SHAPE)

    expect(points).toHaveLength(7)
    expect(Math.hypot(points[0].x, points[0].y)).toBeCloseTo(6, 10)
    expect(Math.hypot(points[6].x, points[6].y)).toBeCloseTo(20, 10)
  })

  it('winds sweepDeg from root to tip, ever further out', () => {
    const points = vortexArmPoints(20, 0, 3, SHAPE)

    expect(Math.atan2(points[0].y, points[0].x)).toBeCloseTo(0, 10)
    expect(Math.atan2(points[3].y, points[3].x)).toBeCloseTo(Math.PI / 2, 10)
    for (let i = 1; i < points.length; i++) expect(Math.hypot(points[i].x, points[i].y)).toBeGreaterThan(Math.hypot(points[i - 1].x, points[i - 1].y))
  })

  it('spreads arms evenly round the center', () => {
    const second = vortexArmPoints(20, 1, 3, SHAPE)[0]

    expect(Math.atan2(second.y, second.x)).toBeCloseTo(PORTAL_TAU / 3, 10)
  })

  it('stays inside the radius', () => {
    for (const point of vortexArmPoints(12, 2, 3, { ...SHAPE, outer: 0.96, segments: 24 })) expect(Math.hypot(point.x, point.y)).toBeLessThanOrEqual(12)
  })
})

describe('dashArcs', () => {
  it('spaces count dashes evenly, each fill of its slot', () => {
    expect(dashArcs(4, 0.5)).toEqual([
      { startDeg: 0, sweepDeg: 45 },
      { startDeg: 90, sweepDeg: 45 },
      { startDeg: 180, sweepDeg: 45 },
      { startDeg: 270, sweepDeg: 45 }
    ])
  })
})

describe('orbitPoint', () => {
  it('is distance out at angle', () => {
    const point = orbitPoint(10, Math.PI / 2)

    expect(point.x).toBeCloseTo(0, 10)
    expect(point.y).toBeCloseTo(10, 10)
  })
})
