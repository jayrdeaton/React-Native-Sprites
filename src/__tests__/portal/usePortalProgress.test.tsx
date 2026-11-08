import { renderHook } from '@testing-library/react'
import { cancelAnimation } from 'react-native-reanimated'

import { usePortalProgress } from '../../portal/usePortalProgress'

// The reanimated mock resolves withRepeat/withTiming at once, so the clock reads its target (1) as
// soon as the effect has run; what's checked is that it starts, and stops on unmount.

describe('usePortalProgress', () => {
  it('starts the clock running on mount', () => {
    const { result } = renderHook(() => usePortalProgress(2000))

    expect(result.current.value).toBe(1)
  })

  it('keeps one clock across renders', () => {
    const { result, rerender } = renderHook(() => usePortalProgress())
    const first = result.current

    rerender()

    expect(result.current).toBe(first)
  })

  it('stops the clock on unmount', () => {
    const { result, unmount } = renderHook(() => usePortalProgress())

    unmount()

    expect(cancelAnimation).toHaveBeenCalledWith(result.current)
  })
})
