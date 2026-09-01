# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

# @tastic/animations

Shared visual effects for React Native games — an SVG+Reanimated `Fireworks` celebration burst (ported from Hangman) and a Skia+Reanimated `GravityWell` particle-swirl marker (ported from BoxHockey/Swirlio's near-duplicate implementations). Part of the `@tastic` package ecosystem.

Two subpath exports (`./fireworks`, `./gravity`), deliberately no root `"."` export — the two effects have mutually exclusive optional native-rendering peers (`react-native-svg` vs `@shopify/react-native-skia`), and a shared barrel would force Metro to resolve both for any consumer.

TODO: fill in Commands / Release / Architecture / Public API / Peer Dependencies / Testing / Code Style sections once the implementation is complete — see /Users/jay/Developer/React-Native-Hud/.claude/CLAUDE.md for the target shape and level of detail to match.
