module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "/tests/.*\\.(test)\\.ts$",
    testPathIgnorePatterns: [
        "/node_modules/", "/build/", "TestSupport"],
    modulePaths: ["/src/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
    verbose: false,
    coveragePathIgnorePatterns: ["tests", "TestSupport"]
};