module.exports = {
    globals: {
        'ts-jest': {
          tsConfig: 'tsconfig_root_compile.json'
        }
      },    
    transform: {
        "^.+\\.tsx?$": "ts-jest"
  },
 //   testMatch: ["**/*.test.ts"],
    testRegex: "/tests/.*\\.(test)\\.ts$",
    testPathIgnorePatterns: [
        "/node_modules/", "/build/", "TestSupport"],
    modulePaths: ["<rootDir>/packages/*/src/"],
    moduleFileExtensions: ["ts", "js" ],
    collectCoverage: true,
    verbose: false,
    coveragePathIgnorePatterns: ["/packages/jivs-examples/", "/starter_code", "TestSupport"]
};