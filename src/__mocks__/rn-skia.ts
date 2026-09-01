// Extends @tastic/hud's src/__mocks__/rn-skia.ts (Canvas, Path, Skia) with the two additional
// primitives GravityWell needs. Circle is a leaf, like Canvas/Path — it renders null so a Skia
// canvas tree never actually mounts DOM under jsdom. Group is the odd one out: unlike every other
// mock here, it must render its own `children` through (not null), or the nested per-particle Circle
// calls a test wants to assert on would never happen at all.
export const Canvas = jest.fn(() => null)
export const Path = jest.fn(() => null)
export const Circle = jest.fn(() => null)
export const Group = jest.fn(({ children }) => children ?? null)

function makePath() {
  return { addArc: jest.fn() }
}

export const Skia = {
  Path: { Make: jest.fn(makePath) },
  XYWHRect: jest.fn((x: number, y: number, width: number, height: number) => ({ x, y, width, height }))
}
