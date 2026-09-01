import React from 'react'

// Fireworks.tsx only touches two things from 'react-native' at runtime: View and StyleSheet
// (LayoutChangeEvent is a type-only import, erased at compile time — no runtime mock needed for
// it). Everything else HUD's own react-native mock carries (Appearance, Platform, StatusBar,
// ScrollView, Pressable, useWindowDimensions) is dropped here since nothing in this package uses
// it.

const StyleSheet = {
  create: <T extends object>(styles: T): T => styles,
  absoluteFill: {}
}

// forwardRef, not a bare `jest.fn(stub)` — mirrors HUD's react-native mock (src/__mocks__/react-native.ts).
// Fireworks itself never attaches a ref to its View, but the render function is still its own
// jest.fn (exported separately, since forwardRef's return value isn't itself callable/inspectable
// the way a plain jest.fn is) so tests can read the props a given render received — in particular
// `onLayout` — via `mockViewRender.mock.calls` and invoke it directly to simulate a layout event
// (jsdom never fires real RN layout events, so this is the only way tests can trigger one).
export const mockViewRender = jest.fn((props: { children?: React.ReactNode } & Record<string, unknown>, _ref: React.Ref<unknown>) => {
  return props.children ?? null
})
export const View = React.forwardRef(mockViewRender)

export { StyleSheet }
