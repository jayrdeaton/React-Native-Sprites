import type { ReactNode } from 'react'

// Unlike Hangman's react-native-svg mock (bare host-type strings like `Circle: 'Circle'`, which
// only works with react-native-test-renderer), this package's tests run under jsdom +
// @testing-library/react — there's no host-type tree to query by string type. Svg is a jest.fn
// that renders its children straight through (so Burst/Particle's tree still mounts), and Circle
// is a leaf jest.fn so tests can assert on each particle's props via `Circle.mock.calls[i][0]`.
export const Svg = jest.fn(({ children }: { children?: ReactNode }) => children ?? null)
export const Circle = jest.fn(() => null)
