import { Circle, Group } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'
import type { SharedValue } from 'react-native-reanimated'

import { Disc, type DiscProps } from '../../shapes/Disc'

const defaults: DiscProps = { x: 50, y: 60, radius: 12, color: '#000000' }

function renderDisc(props: Partial<DiscProps> = {}) {
  return render(<Disc {...defaults} {...props} />)
}

function circleCalls() {
  return (Circle as jest.Mock).mock.calls
}

function groupCalls() {
  return (Group as jest.Mock).mock.calls
}

describe('Disc', () => {
  it('draws only the fill Circle, inside a single Group, when ringColor is omitted', () => {
    renderDisc()

    expect(circleCalls().length).toBe(1)
    expect(circleCalls()[0][0]).toMatchObject({ cx: 50, cy: 60, r: 12, color: '#000000' })
    expect(groupCalls().length).toBe(1)
  })

  it('leaves the outer Group opacity undefined when opacity is omitted', () => {
    renderDisc()

    expect(groupCalls()[0][0].opacity).toBeUndefined()
  })

  it('forwards a plain-number opacity straight to the outer Group, matching Pong', () => {
    renderDisc({ opacity: 0.5 })

    expect(groupCalls()[0][0].opacity).toBe(0.5)
  })

  it('forwards a SharedValue opacity straight through, unread', () => {
    const opacity = { value: 0.4 } as SharedValue<number>
    renderDisc({ opacity })

    expect(groupCalls()[0][0].opacity).toBe(opacity)
  })

  describe('ringColor given', () => {
    it('draws a second, stroked Circle at the same position/radius, in its own nested Group', () => {
      renderDisc({ ringColor: '#ffffff' })

      expect(circleCalls().length).toBe(2)
      expect(groupCalls().length).toBe(2)
      expect(circleCalls()[1][0]).toMatchObject({ cx: 50, cy: 60, r: 12, style: 'stroke', strokeWidth: 2, color: '#ffffff' })
    })

    it('uses an explicit ringWidth instead of the default when provided, matching AirHockey paddle passing 2.5', () => {
      renderDisc({ ringColor: '#ffffff', ringWidth: 2.5 })

      expect(circleCalls()[1][0].strokeWidth).toBe(2.5)
    })

    it('forwards ringOpacity to the inner Group, independent of the outer opacity', () => {
      renderDisc({ ringColor: '#ffffff', opacity: 1, ringOpacity: 0.7 })

      expect(groupCalls()[0][0].opacity).toBe(1)
      expect(groupCalls()[1][0].opacity).toBe(0.7)
    })
  })
})
