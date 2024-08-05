import { CAPathedResult, CAFeature, IConfigAnalysisResultsExplorer, IConfigAnalysisResults } from "../../../src/Interfaces/ConfigAnalysisService";
import { CleanedObjectConfigAnalysisOutputFormatter, ConfigAnalysisOutputFormatterBase, JsonConfigAnalysisOutputFormatter } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisOutputFormatterClasses";
import { ConfigAnalysisResultsExplorerFactory, ConfigAnalysisResultsExplorer } from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisResultsExplorer";
import { MockValidationServices } from "../../TestSupport/mocks";
import { createBasicConfigAnalysisResults } from "./support";

describe('IConfigAnalysisOutputFormatter implementations', () => {
    let factory = new ConfigAnalysisResultsExplorerFactory();
    let services = new MockValidationServices(false, false);

    const vh1Result: CAPathedResult<any> = {
        path: { [CAFeature.valueHost]: 'ValueHost1' },
        result: { feature: CAFeature.valueHost }
    };
    const vh2Result: CAPathedResult<any> = {
        path: { [CAFeature.valueHost]: 'ValueHost2' },
        result: { feature: CAFeature.valueHost }
    };
    const lk1Result: CAPathedResult<any> = {
        path: { [CAFeature.lookupKey]: 'LookupKey1' },
        result: { feature: CAFeature.lookupKey }
    };
    const lk2Result: CAPathedResult<any> = {
        path: { [CAFeature.lookupKey]: 'LookupKey2' },
        result: { feature: CAFeature.lookupKey }
    };
    describe('ConfigAnalysisOutputFormatterBase class', () => {
        // tests are based on this subclass implementation
        // and include support for testing intoObject
        class Publicify_ConfigAnalysisOutputFormatterBase extends ConfigAnalysisOutputFormatterBase {
            public format(): string {
                return 'TEST'
            }

            public publicify_intoObject(valueHostQueryResults: Array<CAPathedResult<any>> | null,
                lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
                explorer: IConfigAnalysisResultsExplorer): {
                    valueHostQueryResults?: Array<CAPathedResult<any>>,
                    lookupKeyQueryResults?: Array<CAPathedResult<any>>,
                    results?: IConfigAnalysisResults
                } {
                return this.intoObject(valueHostQueryResults, lookupKeyQueryResults, explorer);
            }
        }
        describe('constructor', () => {
            test('does not throw', () => {
                expect(() => new Publicify_ConfigAnalysisOutputFormatterBase(true)).not.toThrow();
            });
            // sets the property to true
            test('sets the property to true', () => {
                let formatter = new Publicify_ConfigAnalysisOutputFormatterBase(true);
                expect(formatter.includeAnalysisResults).toBe(true);
            });
            // sets the property to false
            test('sets the property to false', () => {
                let formatter = new Publicify_ConfigAnalysisOutputFormatterBase(false);
                expect(formatter.includeAnalysisResults).toBe(false);
            });
        });

        describe('intoObject', () => {
            // tests need functions to create each array and the data in
            // those arrays should be diverse enough to test the cloned results
            // against originals.
            function executeIntoObject(
                valueHostQueryResults: Array<CAPathedResult<any>> | null,
                lookupKeyQueryResults: Array<CAPathedResult<any>> | null
            ) {
                let formatter = new Publicify_ConfigAnalysisOutputFormatterBase(true);
                let analysisResults = createBasicConfigAnalysisResults();
                let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

                let result = formatter.publicify_intoObject(valueHostQueryResults, lookupKeyQueryResults, explorer);
                if (valueHostQueryResults === null) {
                    expect(result.valueHostQueryResults).toBeUndefined();
                } else {
                    expect(result.valueHostQueryResults).toEqual(valueHostQueryResults);
                    expect(result.valueHostQueryResults).not.toBe(valueHostQueryResults);
                }
                if (lookupKeyQueryResults === null) {
                    expect(result.lookupKeyQueryResults).toBeUndefined();
                } else {
                    expect(result.lookupKeyQueryResults).toEqual(lookupKeyQueryResults);
                    expect(result.lookupKeyQueryResults).not.toBe(lookupKeyQueryResults);
                }
                expect(result.results).not.toBeUndefined();
                expect(result.results).not.toBe(analysisResults);
                expect(result.results).toEqual(analysisResults);
            }

            // test with nulls for both arrays
            test('with nulls for both arrays, expect both properties to be undefined and results is defined with a clone', () => {
                executeIntoObject(null, null);
            });
            // test with empty arrays for both
            test('with empty arrays for both, expect both properties to be empty arrays that are clones', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
                executeIntoObject(valueHostQueryResults, lookupKeyQueryResults);
            });
            // test with populated arrays for both
            test('with populated arrays for both, expect both properties to be populated arrays that are clones', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                executeIntoObject(valueHostQueryResults, lookupKeyQueryResults);
            });
            test('with valueHostQueryResults populated and lookupKeyQueryResults null, expect valueHostQueryResults to be populated and lookupKeyQueryResults to be null', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                executeIntoObject(valueHostQueryResults, null);
            });
            test('with valueHostQueryResults null and lookupKeyQueryResults populated, expect valueHostQueryResults to be null and lookupKeyQueryResults to be populated', () => {
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                executeIntoObject(null, lookupKeyQueryResults);
            });
        });
    });
    describe('JsonConfigAnalysisOutputFormatter class', () => {
        // explore the JSON output including using the space parameter in various ways.
        // Ensure the JSON output has cleaned up dates (into strings), regexp (into strings), and
        // removed both undefined and unsupported object properties.

        describe('constructor', () => {
            test('does not throw', () => {
                expect(() => new JsonConfigAnalysisOutputFormatter(true)).not.toThrow();
            });
            // sets the property to true
            test('sets the property to true', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter(true);
                expect(formatter.includeAnalysisResults).toBe(true);
            });
            // sets the property to false
            test('sets the property to false', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter(false);
                expect(formatter.includeAnalysisResults).toBe(false);
            });
            test('sets the space property to 2', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter(true, 2);
                expect(formatter.space).toBe(2);
            });
            test('sets the space property to "X"', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter(true, 'X');
                expect(formatter.space).toBe('X');
            });
        });

        describe('format', () => {
            // tests need functions to create each array and the data in
            // those arrays should be diverse enough to test the cloned results
            // against originals.
            function executeFormat(
                valueHostQueryResults: Array<CAPathedResult<any>> | null,
                lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
                includeAnalysisResults: boolean,
                space: number | string
            ): string {
                let formatter = new JsonConfigAnalysisOutputFormatter(includeAnalysisResults, space);
                let analysisResults = createBasicConfigAnalysisResults();
                let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

                let obj: any = {
                    valueHostQueryResults: valueHostQueryResults,
                    lookupKeyQueryResults: lookupKeyQueryResults,
                    results: analysisResults
                };
                if (valueHostQueryResults === null)
                    delete obj.valueHostQueryResults;
                if (lookupKeyQueryResults === null)
                    delete obj.lookupKeyQueryResults;
                if (!includeAnalysisResults)
                    delete obj.results;

                let expectedResult = JSON.stringify(obj, null, space);

                let result: string | undefined = undefined;
                expect(() => result = formatter.format(valueHostQueryResults, lookupKeyQueryResults, explorer)).not.toThrow();
                expect(result).not.toBeUndefined();
                expect(result).toEqual(expectedResult);
                return result!;
            }

            // test with nulls for both arrays and includeAnalysisResults = true with 2 spaces
            test('with nulls for both arrays and includeAnalysisResults = true, expect JSON output to be valid', () => {
                executeFormat(null, null, true, 2);
            });
            // test with empty arrays for both and includeAnalysisResults = true with 2 spaces
            test('with empty arrays for both and includeAnalysisResults = true, expect JSON output to be valid', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, true, 2);
            });
            // test with populated arrays for both
            test('with populated arrays for both and includeAnalysisResults = true, expect JSON output to be valid', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, true, 2);
            });
            // test with nulls for both arrays and includeAnalysisResults = false with 2 spaces
            test('with nulls for both arrays and includeAnalysisResults = false, expect JSON output to be valid', () => {
                executeFormat(null, null, false, 2);
            });
            test('with populated arrays for both and includeAnalysisResults = false, expect JSON output to be valid', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, false, 2);
            });
            // we're going to add custom properties to the CAPathedResult objects
            // that represent values that are not supported in JSON.
            // They should be cleaned up following the rules of deepCleanForJson()
            // Those rules are:
            // Handles deep nesting of objects and arrays.
            // It makes changes to the value! So run it on a clone if you need the original.
            // It will undefined properties.
            // It will convert functions into a string of "[Function]" with the function name if available.
            // It will convert Date objects to their ISO string.
            // It will convert RegExp objects to a string that mimics its expression pattern.
            // It will discard any circular references.
            // It will discard most built-in objects like Map, Set, Error, etc.

            // only need one test for this. We'll add a custom property to the result
            // It will need to be matched to a manually created string that is the expected output.
            test('with custom properties in the CAPathedResult objects, expect JSON output to be valid', () => {
                // Local instances to allow modifications
                let vh1Result: CAPathedResult<any> = {
                    path: { [CAFeature.valueHost]: 'ValueHost1' },
                    result: {
                        feature: CAFeature.valueHost,
                        valueHostName: 'ValueHost1',
                        date: new Date('2020-01-01T00:00:00Z'),   // -> "2020-01-01T00:00:00.000Z"
                        regexp: /abc/i,   // -> "/abc/i"
                        func: function test() { return 'test'; }, // -> "[Function] test"
                        map: new Map() // -> removed
                    }
                };
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                let lk1Result: CAPathedResult<any> = {
                    path: { [CAFeature.lookupKey]: 'LookupKey1' },
                    result: {
                        feature: CAFeature.lookupKey,
                        lookupKey: 'LookupKey1',
                        set: new Set(), // -> removed
                        notHere: undefined, // -> removed
                        primitive: 1 // -> 1
                    }
                }
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                // we omit the Explorer.results to keep this simple

                // manually create the expected output with 2 space formatting
                // to deal with formatting, use the character ^ to represent 2 spaces
                // and after all is done, replace all ^ with 2 spaces.
                let expected = `{
^"valueHostQueryResults": [
^^{
^^^"path": {
^^^^"ValueHost": "ValueHost1"
^^^},
^^^"result": {
^^^^"feature": "ValueHost",
^^^^"valueHostName": "ValueHost1",
^^^^"date": "2020-01-01T00:00:00.000Z",
^^^^"regexp": "/abc/i",
^^^^"func": "[Function test]"
^^^}
^^}
^],
^"lookupKeyQueryResults": [
^^{
^^^"path": {
^^^^"LookupKey": "LookupKey1"
^^^},
^^^"result": {
^^^^"feature": "LookupKey",
^^^^"lookupKey": "LookupKey1",
^^^^"primitive": 1
^^^}
^^}
^]
}`;
                expected = expected.replace(/\^/g, '  ');
                let formatter = new JsonConfigAnalysisOutputFormatter(false, 2);
                let analysisResults = createBasicConfigAnalysisResults();
                let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);
                let result = formatter.format(valueHostQueryResults, lookupKeyQueryResults, explorer);

                expect(result).toEqual(expected);
            });
        });
    });
    describe('CleanedObjectConfigAnalysisOutputFormatter class', () => {
        // Generates an object that contains up to all 3 result objects.
        // Ensure each object's properties has cleaned up dates (into strings), 
        // regexp(into strings), and
        // removed both undefined and unsupported object properties.

        describe('constructor', () => {
            test('does not throw', () => {
                expect(() => new CleanedObjectConfigAnalysisOutputFormatter(true)).not.toThrow();
            });
            // sets the property to true
            test('sets the property to true', () => {
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter(true);
                expect(formatter.includeAnalysisResults).toBe(true);
            });
            // sets the property to false
            test('sets the property to false', () => {
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter(false);
                expect(formatter.includeAnalysisResults).toBe(false);
            });
        });

        describe('format', () => {
            // tests need functions to create each array and the data in
            // those arrays should be diverse enough to test the cloned results
            // against originals.
            function executeFormat(
                valueHostQueryResults: Array<CAPathedResult<any>> | null,
                lookupKeyQueryResults: Array<CAPathedResult<any>> | null,
                includeAnalysisResults: boolean,
                expectedResult: any
            ): any {
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter(includeAnalysisResults);
                let analysisResults = createBasicConfigAnalysisResults();
                let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);

                let obj: any = {
                    valueHostQueryResults: valueHostQueryResults,
                    lookupKeyQueryResults: lookupKeyQueryResults,
                    results: analysisResults
                };
                if (valueHostQueryResults === null)
                    delete obj.valueHostQueryResults;
                if (lookupKeyQueryResults === null)
                    delete obj.lookupKeyQueryResults;
                if (!includeAnalysisResults)
                    delete obj.results;

                let result: any = undefined;
                expect(() => result = formatter.format(valueHostQueryResults, lookupKeyQueryResults, explorer)).not.toThrow();
                expect(result).not.toBeUndefined();
                expect(result).toEqual(expectedResult);
                return result;
            }
            test('with nulls for both arrays and includeAnalysisResults = true, expected result has only a results property with empty content', () => {
                let expectedResult = {

                    results: createBasicConfigAnalysisResults()
                };
                executeFormat(null, null, true, expectedResult);
            });
            test('with empty arrays for both and includeAnalysisResults = true, expected result has all 3 properties with empty content', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
                let expectedResult = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: [],
                    results: createBasicConfigAnalysisResults()
                };
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, true, expectedResult);
            });
            test('with populated arrays for both and includeAnalysisResults = true, expected result has all 3 properties with populated content', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                let expectedResult = {
                    valueHostQueryResults: [vh1Result],
                    lookupKeyQueryResults: [lk1Result],
                    results: createBasicConfigAnalysisResults()
                };
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, true, expectedResult);
            });
            test('with nulls for both arrays and includeAnalysisResults = false, expected result is an empty object', () => {
                let expectedResult = {};
                executeFormat(null, null, false, expectedResult);
            });
            test('with empty arrays for both and includeAnalysisResults = false, expected result has the two empty arrays in properties', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [];
                let expectedResult = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: [],
                };
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, false, expectedResult);
            });
            test('with populated arrays for both and includeAnalysisResults = false, expected result has the two populated arrays in properties', () => {
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                let expectedResult = {
                    valueHostQueryResults: [vh1Result],
                    lookupKeyQueryResults: [lk1Result]
                };
                executeFormat(valueHostQueryResults, lookupKeyQueryResults, false, expectedResult);
            });
            test('with custom properties in the CAPathedResult objects, expect properties of date, regexp and function to be replaced by strings and undefined+undesired properties to be removed', () => {
                // Local instances to allow modifications
                let vh1Result: CAPathedResult<any> = {
                    path: { [CAFeature.valueHost]: 'ValueHost1' },
                    result: {
                        feature: CAFeature.valueHost,
                        valueHostName: 'ValueHost1',
                        date: new Date('2020-01-01T00:00:00Z'),   // -> "2020-01-01T00:00:00.000Z"
                        regexp: /abc/i,   // -> "/abc/i"
                        func: function test() { return 'test'; }, // -> "[Function] test"
                        map: new Map() // -> removed
                    }
                };
                const valueHostQueryResults: Array<CAPathedResult<any>> = [
                    vh1Result
                ];
                let lk1Result: CAPathedResult<any> = {
                    path: { [CAFeature.lookupKey]: 'LookupKey1' },
                    result: {
                        feature: CAFeature.lookupKey,
                        lookupKey: 'LookupKey1',
                        set: new Set(), // -> removed
                        notHere: undefined, // -> removed
                        primitive: 1 // -> 1
                    }
                }
                const lookupKeyQueryResults: Array<CAPathedResult<any>> = [
                    lk1Result
                ];
                // we omit the Explorer.results to keep this simple
                const expectedResult = {
                    valueHostQueryResults: [
                        {
                            path: {
                                [CAFeature.valueHost]: 'ValueHost1'
                            },
                            result: {
                                feature: CAFeature.valueHost,
                                valueHostName: 'ValueHost1',
                                date: "2020-01-01T00:00:00.000Z",
                                regexp: "/abc/i",
                                func: "[Function test]"
                            }
                        }
                    ],
                    lookupKeyQueryResults: [
                        {
                            path: { [CAFeature.lookupKey]: 'LookupKey1' },
                            result: {
                                feature: CAFeature.lookupKey,
                                lookupKey: 'LookupKey1',
                                primitive: 1
                            }
                        }
                    ]
                };
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter(false);
                let analysisResults = createBasicConfigAnalysisResults();
                let explorer = new ConfigAnalysisResultsExplorer(analysisResults, factory, services);
                let result = formatter.format(valueHostQueryResults, lookupKeyQueryResults, explorer);
                expect(result).toEqual(expectedResult);
            });
        });
    });
});