module.exports = require('@infinitetoken/jest-config/react-native')({
  moduleNameMapper: {
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^react-native-reanimated$': '<rootDir>/src/__mocks__/react-native-reanimated.ts',
    '^react-native-svg$': '<rootDir>/src/__mocks__/react-native-svg.ts',
    '^@shopify/react-native-skia$': '<rootDir>/src/__mocks__/rn-skia.ts'
  },
  overrides: { clearMocks: true }
})
