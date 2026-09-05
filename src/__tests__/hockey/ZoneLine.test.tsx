import { Group, Line } from '@shopify/react-native-skia'
import { render } from '@testing-library/react'

import { ZoneLine, type ZoneLineProps } from '../../hockey/ZoneLine'

const defaults: ZoneLineProps = { x: 10, width: 200, y: 50, color: '#123456' }

function renderZoneLine(props: Partial<ZoneLineProps> = {}) {
  return render(<ZoneLine {...defaults} {...props} />)
}

function lineCalls() {
  return (Line as jest.Mock).mock.calls
}

function groupCalls() {
  return (Group as jest.Mock).mock.calls
}

describe('ZoneLine', () => {
  it('draws exactly one Line spanning x to x + width at y, in the given color', () => {
    renderZoneLine()

    expect(lineCalls().length).toBe(1)
    expect(lineCalls()[0][0]).toMatchObject({ p1: { x: 10, y: 50 }, p2: { x: 210, y: 50 }, color: '#123456' })
  })

  it('uses the confirmed shared default strokeWidth of 4, matching BoxHockey/AirHockey', () => {
    renderZoneLine()

    expect(lineCalls()[0][0].strokeWidth).toBe(4)
  })

  it('uses an explicit strokeWidth instead of the default when provided', () => {
    renderZoneLine({ strokeWidth: 6 })

    expect(lineCalls()[0][0].strokeWidth).toBe(6)
  })

  it('wraps the Line in a Group at the confirmed shared default opacity of 0.5 when omitted', () => {
    renderZoneLine()

    expect(groupCalls().length).toBe(1)
    expect(groupCalls()[0][0].opacity).toBe(0.5)
  })

  it('forwards an explicit opacity instead of the default when provided', () => {
    renderZoneLine({ opacity: 1 })

    expect(groupCalls()[0][0].opacity).toBe(1)
  })
})
