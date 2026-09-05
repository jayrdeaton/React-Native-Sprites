import { Circle } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { GoalPost, type GoalPostProps } from '../../shapes/GoalPost'

const defaults: GoalPostProps = { x: 15, y: 25, radius: 6, color: '#ff00ff' }

describe('GoalPost', () => {
  it('draws exactly one Circle at the given position/radius/color', () => {
    render(<GoalPost {...defaults} />)

    const calls = (Circle as jest.Mock).mock.calls
    expect(calls.length).toBe(1)
    expect(calls[0][0]).toMatchObject({ cx: 15, cy: 25, r: 6, color: '#ff00ff' })
  })
})
