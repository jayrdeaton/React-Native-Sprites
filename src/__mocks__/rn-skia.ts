// Extends @tastic/hud's src/__mocks__/rn-skia.ts (Canvas, Path, Skia) with the additional
// primitives GravityWell, the shapes subpath, and the hockey subpath need. Circle/Rect/Line are
// leaves, like Canvas/Path — they render null so a Skia canvas tree never actually mounts DOM under
// jsdom. Group is the odd one out: unlike every other mock here, it must render its own `children`
// through (not null), or the nested per-particle/per-ring/per-wedge Circle/Path calls a test wants
// to assert on would never happen at all.
export const Canvas = jest.fn(() => null)
export const Path = jest.fn(() => null)
export const Circle = jest.fn(() => null)
export const Rect = jest.fn(() => null)
export const Line = jest.fn(() => null)
export const Group = jest.fn(({ children }) => children ?? null)

// vec() is a plain data constructor in the real library, not a rendered primitive — mocked as a
// pass-through object (rather than null) so a test can assert on the actual x/y a <Line> received.
export const vec = jest.fn((x: number, y: number) => ({ x, y }))

function makePath() {
  return { addArc: jest.fn() }
}

// PathBuilder.Make()'s real return value is chainable — addArc/close return the same builder,
// .detach() finalizes it into an immutable SkPath. addArc/close below are plain `function`s (not
// arrows) so `this` resolves to whichever builder instance called them, even though the same
// jest.fn is shared by every Make() call — that sharing is deliberate, the same "one shared mock,
// calls accumulate across every instance" convention as Circle/Group above: a test can reach any
// returned builder's own `.addArc.mock.calls` to see every arc ANY component built this render, in
// call order, since they all point at the identical shared function.
const pathBuilderAddArc = jest.fn(function (this: unknown) {
  return this
})
const pathBuilderClose = jest.fn(function (this: unknown) {
  return this
})
const pathBuilderDetach = jest.fn(() => ({}))

export const Skia = {
  Path: { Make: jest.fn(makePath) },
  PathBuilder: {
    Make: jest.fn(() => ({
      addArc: pathBuilderAddArc,
      close: pathBuilderClose,
      detach: pathBuilderDetach
    }))
  },
  XYWHRect: jest.fn((x: number, y: number, width: number, height: number) => ({ x, y, width, height }))
}
