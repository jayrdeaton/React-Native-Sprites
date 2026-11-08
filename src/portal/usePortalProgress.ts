import { useEffect } from 'react'
import { cancelAnimation, Easing, type SharedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'

// One loop of a portal's clock: the vortex and the warp gate's outer ring turn once in it.
export const DEFAULT_PORTAL_PERIOD_MS = 4000

// A portal's clock: 0 to 1 at an even pace every `periodMs`, forever, starting over from 0 (Portal's
// spins and pulses are whole turns per loop, so the restart never shows). Hand one clock to every
// portal that should move in step, both ends of a linked pair for one. Stopped when the caller
// unmounts; a new period restarts it from 0.
export function usePortalProgress(periodMs: number = DEFAULT_PORTAL_PERIOD_MS): SharedValue<number> {
  const progress = useSharedValue(0)
  useEffect(() => {
    progress.value = 0
    progress.value = withRepeat(withTiming(1, { duration: periodMs, easing: Easing.linear }), -1, false)
    return () => cancelAnimation(progress)
  }, [periodMs, progress])
  return progress
}
