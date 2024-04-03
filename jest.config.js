module.exports = {
    transform: {
        "^.+\\.tsx?$": "ts-jest"
    },
    testRegex: "(/tests/.*|(\\.|/)(test|spec))\\.(jsx?|tsx?)$",
    testPathIgnorePatterns: [
        "/node_modules/", "/build/"],
    modulePaths: ["/packages/*/src/"],
    moduleFileExtensions: ["ts", "js" ],
    collectCoverage: true,
    verbose: false,
    coveragePathIgnorePatterns: ["/packages/jivs-examples/", "/starter_code"]
};