import { Circle } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { FaceoffCircle, type FaceoffCircleProps } from '../../hockey/FaceoffCircle'

const defaults: FaceoffCircleProps = { x: 30, y: 40, radius: 25, color: '#ff0000' }

function renderFaceoffCircle(props: Partial<FaceoffCircleProps> = {}) {
  return render(<FaceoffCircle {...defaults} {...props} />)
}

function circleCalls() {
  return (Circle as jest.Mock).mock.calls
}

describe('FaceoffCircle', () => {
  it('draws exactly a stroked outer ring and a filled center dot, both at the given position/color', () => {
    renderFaceoffCircle()

    expect(circleCalls().length).toBe(2)
    expect(circleCalls()[0][0]).toMatchObject({ cx: 30, cy: 40, r: 25, style: 'stroke', color: '#ff0000' })
    expect(circleCalls()[1][0]).toMatchObject({ cx: 30, cy: 40, color: '#ff0000' })
  })

  it('uses the confirmed shared default ring strokeWidth of 1.5', () => {
    renderFaceoffCircle()

    expect(circleCalls()[0][0].strokeWidth).toBe(1.5)
  })

  it('uses an explicit ringWidth instead of the default when provided', () => {
    renderFaceoffCircle({ ringWidth: 3 })

    expect(circleCalls()[0][0].strokeWidth).toBe(3)
  })

  it("defaults the dot radius to 8% of the ring radius, matching both apps' shared resting state", () => {
    renderFaceoffCircle({ radius: 25 })

    expect(circleCalls()[1][0].r).toBeCloseTo(2, 10)
  })

  it("uses an explicit dotRadius instead of the fraction default, matching BoxHockey's own live-state 0.32 multiplier", () => {
    renderFaceoffCircle({ radius: 25, dotRadius: 8 })

    expect(circleCalls()[1][0].r).toBe(8)
  })
})
