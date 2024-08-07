import { CAPathedResult, CAFeature, ConfigAnalysisOutputReportData } from "../../src/Interfaces/ConfigAnalysisService";
import { CleanedObjectConfigAnalysisOutputFormatter, JsonConfigAnalysisOutputFormatter } from "../../src/ConfigAnalysis/ConfigAnalysisOutputFormatterClasses";
import { ConfigAnalysisResultsExplorerFactory } from "../../src/ConfigAnalysis/ConfigAnalysisResultsExplorer";
import { MockValidationServices } from "../TestSupport/mocks";
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

    describe('JsonConfigAnalysisOutputFormatter class', () => {
        // explore the JSON output including using the space parameter in various ways.
        // Ensure the JSON output has cleaned up dates (into strings), regexp (into strings), and
        // removed both undefined and unsupported object properties.

        describe('constructor', () => {
            test('does not throw', () => {
                expect(() => new JsonConfigAnalysisOutputFormatter()).not.toThrow();
            });
            // sets the property to true
            test('sets the space property to 2', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter(2);
                expect(formatter.space).toBe(2);
            });
            test('sets the space property to "X"', () => {
                let formatter = new JsonConfigAnalysisOutputFormatter('X');
                expect(formatter.space).toBe('X');
            });
        });

        describe('format', () => {
            // tests need functions to create each array and the data in
            // those arrays should be diverse enough to test the cloned completeResults
            // against originals.
            function executeFormat(
                reportData: ConfigAnalysisOutputReportData,
                space: number | string
            ): string {
                let formatter = new JsonConfigAnalysisOutputFormatter(space);

                let expectedResult = JSON.stringify(reportData, null, space);

                let result: string | undefined = undefined;
                expect(() => result = formatter.format(reportData)).not.toThrow();
                expect(result).not.toBeUndefined();
                expect(result).toEqual(expectedResult);
                return result!;
            }

            // test with nulls for both arrays and inclueCompleteResults = true with 2 spaces
            test('with valueHostQueryResults=undefined, lookupKeysQueryResults=undefined and completeResults=included, expect JSON output with only the completeResults', () => {
                let completeResults = createBasicConfigAnalysisResults();
    
                let reportData: ConfigAnalysisOutputReportData = {
                    completeResults: completeResults
                };
                executeFormat(reportData, 2);
            });

            test('with valueHostQueryResults=[], lookupKeysQueryResults=[] and completeResults=included, expect JSON output with all 3 properties', () => {
                let completeResults = createBasicConfigAnalysisResults();
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: [],
                    completeResults: completeResults
                };
                executeFormat(reportData, 2);
            });

            test('with valueHostQueryResults=data, lookupKeysQueryResults=data and completeResults=included, expect JSON output with all 3 properties', () => {
                let completeResults = createBasicConfigAnalysisResults();
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result],
                    completeResults: completeResults
                };
                executeFormat(reportData, 2);
            });

            test('with valueHostQueryResults=undefined, lookupKeysQueryResults=undefined and completeResults=undefined, expect JSON output no properties', () => {
                let reportData: ConfigAnalysisOutputReportData = {
                };
                executeFormat(reportData, 2);
            });

            test('with valueHostQueryResults=[], lookupKeysQueryResults=[] and completeResults=undefined, expect JSON output with valueHostQueryResults and lookupKeysQueryResults properties', () => {
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: []
                };
                executeFormat(reportData, 2);
            });
            test('with valueHostQueryResults=data, lookupKeysQueryResults=data and completeResults=undefined, expect JSON output with valueHostQueryResults and lookupKeysQueryResults properties', () => {
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result]
                };
                executeFormat(reportData, 2);
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
                // we omit the Explorer.completeResults to keep this simple

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
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: valueHostQueryResults,
                    lookupKeyQueryResults: lookupKeyQueryResults
                };
                expected = expected.replace(/\^/g, '  ');
                let formatter = new JsonConfigAnalysisOutputFormatter(2);
                let result = formatter.format(reportData);

                expect(result).toEqual(expected);
            });
        });
    });
    describe('CleanedObjectConfigAnalysisOutputFormatter class', () => {
        // Generates an object that contains up to all 3 result objects.
        // Ensure each object's properties has cleaned up dates (into strings), 
        // regexp(into strings), and
        // removed both undefined and unsupported object properties.

        describe('format', () => {
            // tests need functions to create each array and the data in
            // those arrays should be diverse enough to test the cloned completeResults
            // against originals.
            function executeFormat(
                reportData: ConfigAnalysisOutputReportData,
                expectedResult: any
            ): any {
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter();
 
                let result: any = undefined;
                expect(() => result = formatter.format(reportData)).not.toThrow();
                expect(result).not.toBeUndefined();
                expect(result).toEqual(expectedResult);
                return result;
            }
            test('with valueHostQueryResults=undefined, lookupKeysQueryResults=undefined and completeResults=included, expect object with only the completeResults property', () => {
                let completeResults = createBasicConfigAnalysisResults();
                let reportData: ConfigAnalysisOutputReportData = {
                    completeResults: completeResults
                };
                let expectedResult = {
                    completeResults: completeResults
                };
                executeFormat(reportData, expectedResult);
            });
            test('with valueHostQueryResults=[], lookupKeysQueryResults=[] and completeResults=included, expect object with all 3 properties', () => {
                let completeResults = createBasicConfigAnalysisResults();
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: [],
                    completeResults: completeResults
                };
                let expectedResult = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: [],
                    completeResults: completeResults
                };
                executeFormat(reportData, expectedResult);
            });
            test('with valueHostQueryResults=data, lookupKeysQueryResults=data and completeResults=included, expect object with all 3 properties', () => {
                let completeResults = createBasicConfigAnalysisResults();
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result],
                    completeResults: completeResults
                };
                let expectedResult = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result],
                    completeResults: completeResults
                };
                executeFormat(reportData, expectedResult);
            });
            test('with valueHostQueryResults=undefined, lookupKeysQueryResults=undefined and completeResults=undefined, expect object with no properties', () => {
                let reportData: ConfigAnalysisOutputReportData = {

                };
                let expectedResult = {

                };
                executeFormat(reportData, expectedResult);
            });
            test('with valueHostQueryResults=[], lookupKeysQueryResults=[] and completeResults=undefined, expect object with only the two empty arrays', () => {
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: []
                };
                let expectedResult = {
                    valueHostQueryResults: [],
                    lookupKeyQueryResults: []
                };
                executeFormat(reportData, expectedResult);
            });
            test('with valueHostQueryResults=data, lookupKeysQueryResults=data and completeResults=undefined, expect object with only the two populated arrays', () => {
                let reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result]
                };
                let expectedResult = {
                    valueHostQueryResults: [vh1Result, vh2Result],
                    lookupKeyQueryResults: [lk1Result, lk2Result]
                };
                executeFormat(reportData, expectedResult);
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
                const reportData: ConfigAnalysisOutputReportData = {
                    valueHostQueryResults: valueHostQueryResults,
                    lookupKeyQueryResults: lookupKeyQueryResults
                };
                // we omit the Explorer.completeResults to keep this simple
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
                let formatter = new CleanedObjectConfigAnalysisOutputFormatter();
                let analysisResults = createBasicConfigAnalysisResults();
                let result = formatter.format(reportData);
                expect(result).toEqual(expectedResult);
            });
        });
    });
});