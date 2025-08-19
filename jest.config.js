export default {
  preset: "ts-jest",
  testEnvironment: "jsdom", 
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  moduleNameMapper: {
    "^@/hooks/useDragAndDrop$": "<rootDir>/src/__mocks__/useDragAndDrop.ts",
    "^@/store$": "<rootDir>/src/__mocks__/store.ts", // Re-enabled for complete store mocking
    "^@/services/persistence$": "<rootDir>/src/__mocks__/persistenceService.ts",
    "^@/services/storage/(.*)$": "<rootDir>/src/__mocks__/persistenceService.ts",
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2|mp4|webm|wav|mp3|m4a|aac|oga)$": "jest-transform-stub",
  },
  transform: {
    "^.+\\.(ts|tsx)$": ["ts-jest", {
      tsconfig: "tsconfig.json",
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(.*\\.mjs$))"
  ],
  collectCoverageFrom: [
    "src/**/*.{ts,tsx}",
    "!src/**/*.d.ts",
    "!src/main.tsx", 
    "!src/vite-env.d.ts",
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    "<rootDir>/src/**/__tests__/**/*.{ts,tsx}",
    "<rootDir>/src/**/*.(test|spec).{ts,tsx}",
  ],
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
}
