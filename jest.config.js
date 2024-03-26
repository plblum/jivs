module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: ["/lib/", "/node_modules/"],
    modulePaths: ["/src/", "/examples/", "/starter_code/"],
    moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
    collectCoverage: true,
    verbose: false,
    coveragePathIgnorePatterns: ["/examples/", "/starter_code"]
};