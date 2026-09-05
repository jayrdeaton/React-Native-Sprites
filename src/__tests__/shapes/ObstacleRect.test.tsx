import { Rect } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { ObstacleRect, type ObstacleRectProps } from '../../shapes/ObstacleRect'

const defaults: ObstacleRectProps = { x: 10, y: 20, width: 30, height: 40, color: '#123456' }

function renderObstacle(props: Partial<ObstacleRectProps> = {}) {
  return render(<ObstacleRect {...defaults} {...props} />)
}

function rectCalls() {
  return (Rect as jest.Mock).mock.calls
}

describe('ObstacleRect', () => {
  it('draws exactly one Rect, at the given geometry/color, when strokeColor is omitted', () => {
    renderObstacle()

    expect(rectCalls().length).toBe(1)
    expect(rectCalls()[0][0]).toMatchObject({ x: 10, y: 20, width: 30, height: 40, color: '#123456' })
  })

  it('leaves opacity undefined (Skia default: fully opaque) when omitted, matching BoxHockey/AirHockey', () => {
    renderObstacle()

    expect(rectCalls()[0][0].opacity).toBeUndefined()
  })

  it('forwards an explicit opacity straight through, matching LightCycles passing 0.85', () => {
    renderObstacle({ opacity: 0.85 })

    expect(rectCalls()[0][0].opacity).toBe(0.85)
  })

  it('draws a second, stroked Rect at the default width when strokeColor is given', () => {
    renderObstacle({ strokeColor: '#abcdef' })

    expect(rectCalls().length).toBe(2)
    expect(rectCalls()[1][0]).toMatchObject({ x: 10, y: 20, width: 30, height: 40, color: '#abcdef', style: 'stroke', strokeWidth: 1.5 })
  })

  it('uses an explicit strokeWidth instead of the default when provided', () => {
    renderObstacle({ strokeColor: '#abcdef', strokeWidth: 4 })

    expect(rectCalls()[1][0].strokeWidth).toBe(4)
  })
})
