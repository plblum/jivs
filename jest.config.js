module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/packages/*/build/", "/node_modules/"],
    modulePaths: ["/packages/*/src/", "/examples/", "/starter_code/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
    verbose: false,
    coveragePathIgnorePatterns: ["/examples/", "/starter_code"]
};