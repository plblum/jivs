import { MockValidationServices } from './../../TestSupport/mocks';
import { LookupKey } from "../../../src/DataTypes/LookupKeys";
import {
    CAPathedResult, CAResultPath, ComparerServiceCAResult,
    ConditionConfigCAResult, ConverterServiceCAResult, ErrorCAResult,
    FormatterServiceCAResult, FormattersByCultureCAResult,
    ICAExplorerFactory, IConfigAnalysisResults, IdentifierServiceCAResult,
    LocalizedPropertyCAResult, LookupKeyCAResult, ParserFoundCAResult,
    ParserServiceCAResult, ParsersByCultureCAResult, ValidatorConfigCAResult,
    CAFeature, ValueHostConfigCAResult, PropertyCAResult,
    CAResultBase,
    IConfigAnalysisSearchCriteria,
    CAIssueSeverity, IssueForCAResultBase,
    ICASearcher
} from "../../../src/Interfaces/ConfigAnalysisService";
import {
    CAExplorerBase, CASearcher, ComparerServiceCAResultExplorer,
    ConditionConfigCAResultExplorer, ConfigAnalysisResultsExplorer,
    ConfigAnalysisResultsExplorerFactory, ConverterServiceCAResultExplorer,
    ErrorCAResultExplorer, FormatterServiceCAResultExplorer,
    FormattersByCultureCAResultExplorer, IdentifierServiceCAResultExplorer,
    LocalizedPropertyCAResultExplorer, LookupKeyCAResultExplorer,
    ParserFoundCAResultExplorer, ParserServiceCAResultExplorer,
    ParsersByCultureCAResultExplorer, PropertyCAResultExplorer,
    ValidatorConfigCAResultExplorer, ValueHostConfigCAResultExplorer
} from "../../../src/Services/ConfigAnalysisService/ConfigAnalysisResultsExplorer";
import { ValueHostType } from "../../../src/Interfaces/ValueHostFactory";
import { InputValueHostConfig } from '../../../src/Interfaces/InputValueHost';
import { IValueHostsServices } from '../../../src/Interfaces/ValueHostsServices';

describe('CASearcher class', () => {
    describe('matchFeature', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchFeature('TEST')).toBe(true);
        });
        test('returns undefined criteria.features is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchFeature('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.features is empty array', () => {
            let searcher = new CASearcher({features: []});
            expect(searcher.matchFeature('TEST')).toBe(undefined);
        });
        test('returns true when feature is in criteria.features', () => {
            let searcher = new CASearcher({features: ['TEST']});
            expect(searcher.matchFeature('TEST')).toBe(true);
        });
        test('returns true when feature is in criteria.features with multiple possible matches', () => {
            let searcher = new CASearcher({features: ['TEST', 'ABC']});
            expect(searcher.matchFeature('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.features', () => {
            let searcher = new CASearcher({features: ['test']});
            expect(searcher.matchFeature('TEST')).toBe(true);
        });
        test('returns false when feature is not in criteria.features', () => {
            let searcher = new CASearcher({features: ['ABC']});
            expect(searcher.matchFeature('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({features: ['TEST']});
            expect(searcher.matchFeature(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({features: ['TEST']});
            expect(searcher.matchFeature(undefined)).toBe(false);
        });

    });
    describe('matchSeverity', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(true);
        });
        test('returns undefined criteria.severities is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(undefined);
        });
        test('returns undefined when criteria.severities is empty array', () => {
            let searcher = new CASearcher({ severities: [] });
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(undefined);
        });
        test('returns true when severity is in criteria.severities', () => {
            let searcher = new CASearcher({ severities: [CAIssueSeverity.error] });
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(true);
        });
        test('returns true when severity is in criteria.severities with multiple possible matches', () => {
            let searcher = new CASearcher({ severities: [CAIssueSeverity.error, CAIssueSeverity.warning] });
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(true);
        });
        test('returns false when severity is not in criteria.severities', () => {
            let searcher = new CASearcher({ severities: [CAIssueSeverity.warning] });
            expect(searcher.matchSeverity(CAIssueSeverity.error)).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ severities: [CAIssueSeverity.error] });
            expect(searcher.matchSeverity(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ severities: [CAIssueSeverity.error] });
            expect(searcher.matchSeverity(undefined)).toBe(false);
        });

    });
    describe('matchValueHostName', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchValueHostName('TEST')).toBe(true);
        });
        test('returns undefined criteria.valueHostNames is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchValueHostName('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.valueHostNames is empty array', () => {
            let searcher = new CASearcher({ valueHostNames: [] });
            expect(searcher.matchValueHostName('TEST')).toBe(undefined);
        });
        test('returns true when valueHostName is in criteria.valueHostNames', () => {
            let searcher = new CASearcher({ valueHostNames: ['TEST'] });
            expect(searcher.matchValueHostName('TEST')).toBe(true);
        });
        test('returns true when valueHostName is in criteria.valueHostNames with multiple possible matches', () => {
            let searcher = new CASearcher({ valueHostNames: ['TEST', 'ABC'] });
            expect(searcher.matchValueHostName('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.valueHostNames', () => {
            let searcher = new CASearcher({ valueHostNames: ['test'] });
            expect(searcher.matchValueHostName('TEST')).toBe(true);
        });
        test('returns false when valueHostName is not in criteria.valueHostNames', () => {
            let searcher = new CASearcher({ valueHostNames: ['ABC'] });
            expect(searcher.matchValueHostName('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ valueHostNames: ['TEST'] });
            expect(searcher.matchValueHostName(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ valueHostNames: ['TEST'] });
            expect(searcher.matchValueHostName(undefined)).toBe(false);
        });

    });
    describe('matchPropertyName', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchPropertyName('TEST')).toBe(true);
        });
        test('returns undefined criteria.propertyNames is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchPropertyName('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.propertyNames is empty array', () => {
            let searcher = new CASearcher({ propertyNames: [] });
            expect(searcher.matchPropertyName('TEST')).toBe(undefined);
        });
        test('returns true when propertyName is in criteria.propertyNames', () => {
            let searcher = new CASearcher({ propertyNames: ['TEST'] });
            expect(searcher.matchPropertyName('TEST')).toBe(true);
        });
        test('returns true when propertyName is in criteria.propertyNames with multiple possible matches', () => {
            let searcher = new CASearcher({ propertyNames: ['TEST', 'ABC'] });
            expect(searcher.matchPropertyName('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.propertyNames', () => {
            let searcher = new CASearcher({ propertyNames: ['test'] });
            expect(searcher.matchPropertyName('TEST')).toBe(true);
        });
        test('returns false when propertyName is not in criteria.propertyNames', () => {
            let searcher = new CASearcher({ propertyNames: ['ABC'] });
            expect(searcher.matchPropertyName('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ propertyNames: ['TEST'] });
            expect(searcher.matchPropertyName(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ propertyNames: ['TEST'] });
            expect(searcher.matchPropertyName(undefined)).toBe(false);
        });

    });
    describe('matchLookupKey', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(true);
        });
        test('returns undefined criteria.lookupKeys is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(undefined);
        });
        test('returns undefined when criteria.lookupKeys is empty array', () => {
            let searcher = new CASearcher({ lookupKeys: [] });
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(undefined);
        });
        test('returns true when lookupKey is in criteria.lookupKeys', () => {
            let searcher = new CASearcher({ lookupKeys: [LookupKey.Number] });
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(true);
        });
        test('returns true when lookupKey is in criteria.lookupKeys with multiple possible matches', () => {
            let searcher = new CASearcher({ lookupKeys: [LookupKey.Number, LookupKey.String] });
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(true);
        });
        test('returns false when lookupKey is not in criteria.lookupKeys', () => {
            let searcher = new CASearcher({ lookupKeys: [LookupKey.String] });
            expect(searcher.matchLookupKey(LookupKey.Number)).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ lookupKeys: [LookupKey.Number] });
            expect(searcher.matchLookupKey(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ lookupKeys: [LookupKey.Number] });
            expect(searcher.matchLookupKey(undefined)).toBe(false);
        });

    });
    describe('matchServiceName', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchServiceName('TEST')).toBe(true);
        });
        test('returns undefined criteria.serviceNames is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchServiceName('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.serviceNames is empty array', () => {
            let searcher = new CASearcher({ serviceNames: [] });
            expect(searcher.matchServiceName('TEST')).toBe(undefined);
        });
        test('returns true when serviceName is in criteria.serviceNames', () => {
            let searcher = new CASearcher({ serviceNames: ['TEST'] });
            expect(searcher.matchServiceName('TEST')).toBe(true);
        });
        test('returns true when serviceName is in criteria.serviceNames with multiple possible matches', () => {
            let searcher = new CASearcher({ serviceNames: ['TEST', 'ABC'] });
            expect(searcher.matchServiceName('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.serviceNames', () => {
            let searcher = new CASearcher({ serviceNames: ['test'] });
            expect(searcher.matchServiceName('TEST')).toBe(true);
        });
        test('returns false when serviceName is not in criteria.serviceNames', () => {
            let searcher = new CASearcher({ serviceNames: ['ABC'] });
            expect(searcher.matchServiceName('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ serviceNames: ['TEST'] });
            expect(searcher.matchServiceName(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ serviceNames: ['TEST'] });
            expect(searcher.matchServiceName(undefined)).toBe(false);
        });

    });
    describe('matchErrorCode', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchErrorCode('TEST')).toBe(true);
        });
        test('returns undefined criteria.errorCodes is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchErrorCode('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.errorCodes is empty array', () => {
            let searcher = new CASearcher({ errorCodes: [] });
            expect(searcher.matchErrorCode('TEST')).toBe(undefined);
        });
        test('returns true when errorCode is in criteria.errorCodes', () => {
            let searcher = new CASearcher({ errorCodes: ['TEST'] });
            expect(searcher.matchErrorCode('TEST')).toBe(true);
        });
        test('returns true when errorCode is in criteria.errorCodes with multiple possible matches', () => {
            let searcher = new CASearcher({ errorCodes: ['TEST', 'ABC'] });
            expect(searcher.matchErrorCode('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.errorCodes', () => {
            let searcher = new CASearcher({ errorCodes: ['test'] });
            expect(searcher.matchErrorCode('TEST')).toBe(true);
        });
        test('returns false when errorCode is not in criteria.errorCodes', () => {
            let searcher = new CASearcher({ errorCodes: ['ABC'] });
            expect(searcher.matchErrorCode('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ errorCodes: ['TEST'] });
            expect(searcher.matchErrorCode(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ errorCodes: ['TEST'] });
            expect(searcher.matchErrorCode(undefined)).toBe(false);
        });

    });

    describe('matchConditionType', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchConditionType('TEST')).toBe(true);
        });
        test('returns undefined criteria.conditionTypes is undefined', () => {
            let searcher = new CASearcher({ errorCodes: ['TEST'] });
            expect(searcher.matchConditionType('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.conditionTypes is empty array', () => {
            let searcher = new CASearcher({ conditionTypes: [] });
            expect(searcher.matchConditionType('TEST')).toBe(undefined);
        });
        test('returns true when conditionType is in criteria.conditionTypes', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchConditionType('TEST')).toBe(true);
        });
        test('returns true when conditionType is in criteria.conditionTypes with multiple possible matches', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST', 'ABC'] });
            expect(searcher.matchConditionType('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.conditionTypes', () => {
            let searcher = new CASearcher({ conditionTypes: ['test'] });
            expect(searcher.matchConditionType('TEST')).toBe(true);
        });
        test('returns false when conditionType is not in criteria.conditionTypes', () => {
            let searcher = new CASearcher({ conditionTypes: ['ABC'] });
            expect(searcher.matchConditionType('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchConditionType(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchConditionType(undefined)).toBe(false);
        });

    });
    describe('matchCultureId', () => {
        test('returns true when criteria is null', () => {
            let searcher = new CASearcher(null);
            expect(searcher.matchCultureId('TEST')).toBe(true);
        });
        test('returns undefined criteria.cultureIds is undefined', () => {
            let searcher = new CASearcher({ conditionTypes: ['TEST'] });
            expect(searcher.matchCultureId('TEST')).toBe(undefined);
        });
        test('returns undefined when criteria.cultureIds is empty array', () => {
            let searcher = new CASearcher({ cultureIds: [] });
            expect(searcher.matchCultureId('TEST')).toBe(undefined);
        });
        test('returns true when cultureId is in criteria.cultureIds', () => {
            let searcher = new CASearcher({ cultureIds: ['TEST'] });
            expect(searcher.matchCultureId('TEST')).toBe(true);
        });
        test('returns true when cultureId is in criteria.cultureIds with multiple possible matches', () => {
            let searcher = new CASearcher({ cultureIds: ['TEST', 'ABC'] });
            expect(searcher.matchCultureId('TEST')).toBe(true);
        });
        test('returns true when case insensitive match is found in criteria.cultureIds', () => {
            let searcher = new CASearcher({ cultureIds: ['test'] });
            expect(searcher.matchCultureId('TEST')).toBe(true);
        });
        test('returns false when cultureId is not in criteria.cultureIds', () => {
            let searcher = new CASearcher({ cultureIds: ['ABC'] });
            expect(searcher.matchCultureId('TEST')).toBe(false);
        });
        test('returns false when value passed in is null', () => {
            let searcher = new CASearcher({ cultureIds: ['TEST'] });
            expect(searcher.matchCultureId(null)).toBe(false);
        });
        // same with undefined
        test('returns false when value passed in is undefined', () => {
            let searcher = new CASearcher({ cultureIds: ['TEST'] });
            expect(searcher.matchCultureId(undefined)).toBe(false);
        });

    });
    
});

describe('CAExplorerBase class', () => {
    const parentFeatureName = 'TEST';
    const childFeatureName = 'CHILDTEST';
    const grandChildFeatureName = 'GRANDCHILDTEST';

    let matchThisTrueCount: number = 0;
    let matchThisFalseCount: number = 0;
    let matchThisNotApplicableCount: number = 0;

    beforeEach(() => {
        matchThisTrueCount = 0;
        matchThisFalseCount = 0;
        matchThisNotApplicableCount = 0;
    });
    abstract class TestExplorerBase<T extends TestResultBase>
        extends CAExplorerBase<T>
    {
        public matchThis(searcher: ICASearcher): boolean | undefined {
            let result = super.matchThis(searcher);
            switch (result) {
                case true:
                    matchThisTrueCount++;
                    break;
                case false:
                    matchThisFalseCount++;
                    break;
                default:
                    matchThisNotApplicableCount++;
                    break;
            }
            return result;
        }

        public children(): CAResultBase[] {
            return this.result.children ?? [];
        }
    }

    class ParentTestExplorer extends TestExplorerBase<ParentTestResult>
    {
        public feature(): string {
            return parentFeatureName;
        }

        public identifier(): string | null {
            return this.result.valueHostName ?? null;
        }

        protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
            return searcher.matchValueHostName(this.result.valueHostName);
        }

    }
    class ChildTestExplorer extends TestExplorerBase<ChildTestResult>
    {
        public feature(): string {
            return childFeatureName;
        }

        public identifier(): string | null {
            return this.result.errorCode ?? null;
        }

        protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
            return searcher.matchErrorCode(this.result.errorCode);
        }

    }
    class GrandChildTestExplorer extends TestExplorerBase<GrandChildTestResult>
    {
        public feature(): string {
            return grandChildFeatureName;
        }

        public identifier(): string | null {
            return this.result.conditionType ?? null;
        }

        protected matchThisWorker(searcher: ICASearcher): boolean | undefined {
            return searcher.matchConditionType(this.result.conditionType);
        }

    }   

    interface TestResultBase extends CAResultBase, IssueForCAResultBase {
        children?: Array<TestResultBase>;
    }
    // We'll use valueHostName as the identifier and for
    // setting up the searcher to find a unique value.
    interface ParentTestResult extends TestResultBase {
        // Identifier and for searcher.
        valueHostName?: string;
        children?: Array<ChildTestResult>;
    }    
    // We'll use errorCode as the identifier and for
    // setting up the searcher to find a unique value.
    interface ChildTestResult extends TestResultBase {
        // Identifier and for searcher.
        errorCode?: string;
        children?: Array<GrandChildTestResult>;
    }
 
    // We'll use conditionType as the identifier and for
    // setting up the searcher to find a unique value.
    interface GrandChildTestResult extends TestResultBase {
        // Identifier and for searcher.
        conditionType?: string;
    }

    let factory = new ConfigAnalysisResultsExplorerFactory();
    // factory is prepopulated with the default explorers
    // We won't use them in these tests, and offer 3 mocks for the tests.
    factory.register<ParentTestResult>(parentFeatureName,
        (result) => new ParentTestExplorer(result));
    factory.register<ChildTestResult>(childFeatureName,
        (result) => new ChildTestExplorer(result));
    factory.register<GrandChildTestResult>(grandChildFeatureName,
        (result) => new GrandChildTestExplorer(result));
    

    function executeCollect(vhcResult: TestResultBase,
        searcher: CASearcher,
        expectedMatchCount: number,
        expectedMatchThisTrueCount: number,
        expectedMatchThisFalseCount: number,
        expectedMathThisNotApplicableCount: number): Array<CAPathedResult<CAResultBase>> {
    
        let explorer = factory.create(vhcResult);
        let matches: Array<CAPathedResult<CAResultBase>> = [];
        let path: CAResultPath = {};
        explorer.collect(searcher, matches, path, factory);
        expect(matches).toHaveLength(expectedMatchCount);
        expect(matchThisFalseCount).toBe(expectedMatchThisFalseCount);
        expect(matchThisTrueCount).toBe(expectedMatchThisTrueCount);
        expect(matchThisNotApplicableCount).toBe(expectedMathThisNotApplicableCount);
        return matches;
    }

    /**
     * Does not use CAExplorerBase.getByResultPath intentionally.
     * We are expected to supply the correct strings to the path.
     * @param matches 
     * @param index 
     * @param expectedPath 
     * @param expectedResult 
     */
    function testMatchResult(matches: Array<CAPathedResult<TestResultBase>>,
        index: number,
        expectedPath: CAResultPath,
        expectedResult: TestResultBase) {
        let match = matches[index];
        expect(match).toBeDefined();

        expect(match.result).toEqual(expectedResult);
        expect(match.path).toEqual(expectedPath);
    }    
    test('constructor initializes properties', () => {
        let vhcResult: ParentTestResult = {
            feature: parentFeatureName
        };
        let explorer: TestExplorerBase<TestResultBase> | null = null;
        expect(() => explorer = new ParentTestExplorer(vhcResult)).not.toThrow();
        expect(explorer!.result).toBe(vhcResult);
    });
    describe('matchThis', () => {
        // provide coverage for base class cases and do not repeat the same tests
        // in child Explorer tests
        // Additionally, we have already tested the CASearch class, so it covers some of the use cases.
        function executeMatchThis(vhcResult: TestResultBase,
            criteria: IConfigAnalysisSearchCriteria | null,
            expectedMatch: boolean | undefined,
            expectedMatchThisTrueCount: number,
            expectedMatchThisFalseCount: number,
            expectedMatchThisNotApplicableCount: number) {
            let explorer = factory.create(vhcResult);
            let searcher = new CASearcher(criteria);
            let result = explorer.matchThis(searcher);
            expect(result).toBe(expectedMatch);
            expect(matchThisTrueCount).toBe(expectedMatchThisTrueCount);
            expect(matchThisFalseCount).toBe(expectedMatchThisFalseCount);
            expect(matchThisNotApplicableCount).toBe(expectedMatchThisNotApplicableCount);
        }
        describe('parameter is null or empty object always returns true', () => {
            test('returns true when criteria parameter is null', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
                const criteria: IConfigAnalysisSearchCriteria | null = null;
                executeMatchThis(vhcResult, criteria, true, 1, 0, 0);
            
            });
            test('returns true when criteria parameter is an empty object (all criteria are undefined)', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
        
                const criteria: IConfigAnalysisSearchCriteria = {};
                executeMatchThis(vhcResult, criteria, true, 1, 0, 0);
            });
        });
        describe('feature criteria', () => {
            test('returns true when feature="TEST" and criteria.features=["TEST"]', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
 
                let criteria: IConfigAnalysisSearchCriteria = { features: [parentFeatureName] };
                executeMatchThis(vhcResult, criteria, true, 1, 0, 0);
            });
            test('returns false when feature="TEST" and criteria.features=["Condition"]', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
                let criteria: IConfigAnalysisSearchCriteria = { features: ['Condition'] };
                executeMatchThis(vhcResult, criteria, false, 0, 1, 0);
            });
            test('returns undefined when feature is not supplied in the criteria but there are other criteria available', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
                let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child1'] };
                executeMatchThis(vhcResult, criteria, undefined, 0, 0, 1);
            });
        });
        describe('severity criteria', () => {

            test('returns true when severity matches to criteria', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    severity: CAIssueSeverity.warning
                };
                let criteria: IConfigAnalysisSearchCriteria = { severities: [CAIssueSeverity.warning] };
                executeMatchThis(vhcResult, criteria, true, 1, 0, 0);
            });

            test('returns true when severity is undefined and criteria.severities contains null', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
                let criteria: IConfigAnalysisSearchCriteria = { severities: [null] };
                executeMatchThis(vhcResult, criteria, true, 1, 0, 0);
            });
            test('returns false when severity is undefined and criteria.severities does not contain null', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName
                };
                let criteria: IConfigAnalysisSearchCriteria = { severities: [CAIssueSeverity.error] };
                executeMatchThis(vhcResult, criteria, false, 0, 1, 0);
            });
            test('returns false when severity is assigned but not found in criteria', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    severity: CAIssueSeverity.error
                };
                let criteria: IConfigAnalysisSearchCriteria = { severities: [CAIssueSeverity.warning] };
                executeMatchThis(vhcResult, criteria, false, 0, 1, 0);
            });
            test('returns undefined and 1 not applicable when severity is defined but not in the criteria', () => {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    severity: CAIssueSeverity.error
                };
                let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child1'] };
                executeMatchThis(vhcResult, criteria, undefined, 0, 0, 1);
            });
        });

    });
    
    describe('findOne', () => {
        // again we've tested CASearch itself. So this is to ensure the findOne implementation
        // is correct.

        // The factory object is prepopulated with 2 explorers with feature names of
        // childFeatureName and child2FeatureName . We will use them in the tests.
        function executeFindOne(vhcResult: TestResultBase,
            criteria: IConfigAnalysisSearchCriteria,
            expectedMatch: CAPathedResult<CAResultBase> | null,
            expectedMatchTrueCount: number,
            expectedMatchFalseCount: number,
            expectedMatchNotApplicableCount: number) {
            let explorer = factory.create(vhcResult);
            let searcher = new CASearcher(criteria);
            let result = explorer.findOne(searcher, factory);
            expect(result).toEqual(expectedMatch);
            expect(matchThisTrueCount).toBe(expectedMatchTrueCount);
            expect(matchThisFalseCount).toBe(expectedMatchFalseCount);
            expect(matchThisNotApplicableCount).toBe(expectedMatchNotApplicableCount);
        }
        test('returns a PathedResult when feature is assigned and found in criteria and there are no children', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: []
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: [parentFeatureName] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult,
                path: { [parentFeatureName]: 'Parent' }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 0, 0);
        });
        test('returns null when feature is assigned and not found in criteria and there are no children', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: ['Condition'] };
            executeFindOne(vhcResult, criteria, null, 0, 1, 0);

        });
        test('returns a PathedResult when searching with child-specific criteria to match to 1st child', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child1'] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult.children![0],
                path: {
                    [parentFeatureName]: 'Parent',
                    [childFeatureName]: 'Child1'
                }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 0, 1);
        });

        test('returns a PathedResult when searching with child-specific criteria to match to 2nd child', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };

            let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child2'] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult.children![1],
                path: {
                    [parentFeatureName]: 'Parent',
                    [childFeatureName]: 'Child2'
                }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 1, 1);
        });

        test('returns null when feature is not found in children nor the parent due to criteria mismatch', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };
        // errorCode mismatch
            let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Unknown'] };
            executeFindOne(vhcResult, criteria, null, 0, 2, 1);
        });
        test('Returns null when criteria used is not applicable in any supplied result. All results report not applicable', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child1' }
                ]
            };
// conditionType n/a for all results
            let criteria: IConfigAnalysisSearchCriteria = { conditionTypes: ['Unknown'] };
            executeFindOne(vhcResult, criteria, null, 0, 0, 3);
        });
        // lets have a depth of 3, where the match is only in the grandchild
        test('returns first grandchild, and no prior results were applicable', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { conditionTypes: ['GrandChild1'] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult.children![0].children![0],
                path: { 
                    [parentFeatureName]: 'Parent',
                    [childFeatureName]: 'Child1',
                    [grandChildFeatureName]: 'GrandChild1'

                }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 0, 2);
        });
        // same but second
        test('returns 2nd grandchild, parent and child n/a', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { conditionTypes: ['GrandChild2'] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult.children![0].children![1],
                path: {
                    [parentFeatureName]: 'Parent',
                    [childFeatureName]: 'Child1',
                    [grandChildFeatureName]: 'GrandChild2'
                }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 1, 2);
        });
        // same but no match anywhere
        test('returns null when criteria supports all results but no matches', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { valueHostNames: ['Unknown'], errorCodes: ['Unknown'], conditionTypes: ['Unknown'] };
            executeFindOne(vhcResult, criteria, null, 0, 4, 0);
        });
        test('returns first child when criteria only childFeature and matches it', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child1'] };
            let expectedMatch: CAPathedResult<CAResultBase> = {
                result: vhcResult.children![0],
                path: {
                    [parentFeatureName]: 'Parent',
                    [childFeatureName]: 'Child1'
                }
            };
            executeFindOne(vhcResult, criteria, expectedMatch, 1, 0, 1);
        });        
        test('returns null when supports only parent but no matches', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { valueHostNames: ['Unknown'] };
            executeFindOne(vhcResult, criteria, null, 0, 1, 3);
        });       
        test('returns null when supports only grandchild but no matches', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    {
                        feature: childFeatureName,
                        errorCode: 'Child1',
                        children: [
                            { feature: grandChildFeatureName, conditionType: 'GrandChild1' },
                            { feature: grandChildFeatureName, conditionType: 'GrandChild2' }
                        ]
                    }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { conditionTypes: ['Unknown'] };
            executeFindOne(vhcResult, criteria, null, 0, 2, 2);
        });
    });
    describe('hasMatch()', () => {
        
        // most of the tests are covered by findOne which is used by hasMatch
        // Just need a few tests to ensure the method is working correctly.
        function executeHasMatch(vhcResult: TestResultBase,
            criteria: IConfigAnalysisSearchCriteria,
            expectedMatch: boolean,
            expectedMatchTrueCount: number,
            expectedMatchFalseCount: number,
            expectedMatchNotApplicableCount: number) {
            let explorer = factory.create(vhcResult);
            let searcher = new CASearcher(criteria);
            let result = explorer.hasMatch(searcher, factory);
            expect(result).toBe(expectedMatch);
            expect(matchThisTrueCount).toBe(expectedMatchTrueCount);
            expect(matchThisFalseCount).toBe(expectedMatchFalseCount);
            expect(matchThisNotApplicableCount).toBe(expectedMatchNotApplicableCount);
        }
        test('returns true when feature is assigned and found in criteria and there are no children', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: []
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: [parentFeatureName] };
            executeHasMatch(vhcResult, criteria, true, 1, 0, 0);
        });
        test('returns false when feature is assigned and not found in criteria and there are no children', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: ['Condition'] };
            executeHasMatch(vhcResult, criteria, false, 0, 1, 0);

        });
        test('returns true when searching with child-specific criteria to match to 1st child', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { errorCodes: ['Child1'] };
            executeHasMatch(vhcResult, criteria, true, 1, 0, 1);
        });
        test('returns false when searching with grandchild-specific criteria and no matches, no grandchildren', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName }
                ]
            };
            let criteria: IConfigAnalysisSearchCriteria = { conditionTypes: ['GrandChild1'] };
            executeHasMatch(vhcResult, criteria, false, 0, 0, 2);
        });
    });
    describe('collect', () => {
        // similar tests to hasMatch. Use the identifier property to differentiate the results data
        // and let jest check the identifier is the correct one.
        // REMINDER: If a parent is not a match, the children are never checked.

        test('returns empty array when parent does not match and has children because children are never checked', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };
            let searcher = new CASearcher({ features: ['Condition'], skipChildrenIfParentMismatch: true });
            let matches = executeCollect(vhcResult, searcher, 0, 0, 1, 0);
            
        });
        test('returns empty array when parent and children do not match and with criteria.skipChildrenIfParentMismatch', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
                children: [
                    { feature: childFeatureName, errorCode: 'Child1' },
                    { feature: childFeatureName, errorCode: 'Child2' }
                ]
            };
            let searcher = new CASearcher({ features: ['Condition'], skipChildrenIfParentMismatch: false });
            let matches = executeCollect(vhcResult, searcher, 0, 0, 3, 0);
            
        });        
        test('returns one match when found in the parent and there are no children', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                valueHostName: 'Parent',
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: [parentFeatureName] };
            let matches = executeCollect(vhcResult, new CASearcher(criteria), 1, 1, 0, 0);
            let match = matches[0];
            expect(match.result).toBe(vhcResult);
            expect(match.path).toEqual(
                { [parentFeatureName]: 'Parent' });

        });

        test('returns one match when found in the parent with no identifier and there are no children. The path identifier should use empty string value', () => {
            let vhcResult: ParentTestResult = {
                feature: parentFeatureName,
                /* no valueHostName so identifier='null */
            };
            let criteria: IConfigAnalysisSearchCriteria = { features: [parentFeatureName] };
            let matches = executeCollect(vhcResult, new CASearcher(criteria), 1, 1, 0, 0);
            let match = matches[0];
            expect(match.result).toBe(vhcResult);
            expect(match.path).toEqual({ [parentFeatureName]: null });

        });
        describe('Two children', () => {
            function createWithTwoChildren(): TestResultBase {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    valueHostName: 'Parent',
                    children: [
                        {
                            feature: childFeatureName,
                            errorCode: 'Child1'
                        },
                        {
                            feature: childFeatureName,
                            errorCode: 'Child2'
                        }
                    ]
                };
                return vhcResult;
            }

            test('returns 1 match when found in the parent and there are 2 non-matching children', () => {
                let searcher = new CASearcher({ features: [parentFeatureName] });
                let vhcResult = createWithTwoChildren();
                let matches = executeCollect(vhcResult, searcher, 1, 1, 2, 0);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' }, 
                    matches[0].result);
            });
            // all 3 match
            test('returns 3 matches when found in the parent and there are 2 matching children', () => {

                let searcher = new CASearcher({
                    features: [
                        parentFeatureName, childFeatureName, childFeatureName
                    ]
                });
                let vhcResult = createWithTwoChildren();
                let matches = executeCollect(vhcResult, searcher, 3, 3, 0, 0);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    { [parentFeatureName]: 'Parent', [childFeatureName]: 'Child1' },
                    matches[1].result);
                testMatchResult(matches, 2,
                    { [parentFeatureName]: 'Parent', [childFeatureName]: 'Child2' },
                    matches[2].result);
                
            });
            // only parent and CHILDTEST2 match
            test('returns 2 matches when found in the parent and one matching child', () => {
                let searcher = new CASearcher({
                    features:
                        [parentFeatureName, childFeatureName],
                    valueHostNames: ['Parent'],
                    errorCodes: ['Child2']
                });
                let vhcResult = createWithTwoChildren();
                let matches = executeCollect(vhcResult, searcher, 2, 2, 1, 0);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    { [parentFeatureName]: 'Parent', [childFeatureName]: 'Child2' },
                    matches[1].result);
                
            });
            // the parent is always a match (no criteria it supports is involved)
            // and one child is a match. To make this work, we'll have a different
            // explorer class that matches to conditionType as the children.
            test('parent is not applicable, one of two children are a match. Return only the child', () => {
                let searcher = new CASearcher({ errorCodes: ['TESTB'] });
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    valueHostName: 'Parent',
                    children: [
                        { feature: childFeatureName, errorCode: 'TESTA' } as any,
                        { feature: childFeatureName, errorCode: 'TESTB' } as any,
                    ]
                };
                let matches = executeCollect(vhcResult, searcher, 1, 1, 1, 1);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent', [childFeatureName]: 'TESTB' },
                    matches[0].result);
            });

        });
        // 3 levels deep on all paths. 
        // Parent->Child1 -> Child1A, Child1B, 
        // Parent->Child2 -> Child2A, Child2B, 
        // Parent->Child3 -> Child3A, Child3B
        describe('3 levels deep on all paths', () => {
            function createWithThreeChildren(): TestResultBase {
                let vhcResult: ParentTestResult = {
                    feature: parentFeatureName,
                    valueHostName: 'Parent',
                    children: [
                        {
                            feature: childFeatureName,
                            errorCode: 'Child1',
                            children: [
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child1A'
                                },
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child1B'
                                }
                            ]
                        },
                        {
                            feature: childFeatureName,
                            errorCode: 'Child2',
                            children: [
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child2A'
                                },
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child2B'
                                }
                            ]
                        },
                        {
                            feature: childFeatureName,
                            errorCode: 'Child3',
                            children: [
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child3A'
                                },
                                {
                                    feature: grandChildFeatureName,
                                    conditionType: 'Child3B'
                                }
                            ]
                        }   
                    ]
                };
                return vhcResult;
            }
            test('Everything matches. Use severity=null as criteria', () => {
                let searcher = new CASearcher({ severities: [null] });
                let vhcResult = createWithThreeChildren();
                let matches = executeCollect(vhcResult, searcher, 10, 10, 0, 0);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child1'
                    },
                    matches[1].result);
                testMatchResult(matches, 2,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child1',
                        [grandChildFeatureName]: 'Child1A'
                    },
                    matches[2].result);
                testMatchResult(matches, 3,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child1',
                        [grandChildFeatureName]: 'Child1B'
                    },
                    matches[3].result);
                testMatchResult(matches, 4,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child2'
                    },
                    matches[4].result);
                testMatchResult(matches, 5,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child2',
                        [grandChildFeatureName]: 'Child2A'
                    },
                    matches[5].result);
                testMatchResult(matches, 6,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child2',
                        [grandChildFeatureName]: 'Child2B'
                    },
                    matches[6].result);
                testMatchResult(matches, 7,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3'
                    },
                    matches[7].result);
                testMatchResult(matches, 8,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3',
                        [grandChildFeatureName]: 'Child3A'
                    },
                    matches[8].result);
                testMatchResult(matches, 9,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3',
                        [grandChildFeatureName]: 'Child3B'
                    },
                    matches[9].result);
            });

            test('parent and all children match but no grandchildren due to mismatch', () => {
                let searcher = new CASearcher({ features: [parentFeatureName, childFeatureName] });
                let vhcResult = createWithThreeChildren();
                let matches = executeCollect(vhcResult, searcher, 4, 4, 6, 0);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child1'
                    },
                    matches[1].result);
                testMatchResult(matches, 2,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child2'
                    },
                    matches[2].result);
                testMatchResult(matches, 3,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3'
                    },
                    matches[3].result);
        
            });
            test('parent and all children match but no grandchildren because they are not applicable', () => {
                let searcher = new CASearcher({ valueHostNames: ['Parent'], errorCodes: ['Child1', 'Child2', 'Child3'] });
                let vhcResult = createWithThreeChildren();
                let matches = executeCollect(vhcResult, searcher, 4, 4, 0, 6);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child1'
                    },
                    matches[1].result);
                testMatchResult(matches, 2,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child2'
                    },
                    matches[2].result);
                testMatchResult(matches, 3,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3'
                    },
                    matches[3].result);
        
            });            

            test('returns 2 matches when found in the parent and one matching grandchild', () => {
                let searcher = new CASearcher({ valueHostNames: ['Parent'], conditionTypes: ['Child3A'] });
                let vhcResult = createWithThreeChildren();
                let matches = executeCollect(vhcResult, searcher, 2, 2, 5, 3);
                testMatchResult(matches, 0,
                    { [parentFeatureName]: 'Parent' },
                    matches[0].result);
                testMatchResult(matches, 1,
                    {
                        [parentFeatureName]: 'Parent',
                        [childFeatureName]: 'Child3',
                        [grandChildFeatureName]: 'Child3A'
                    },
                    matches[1].result);
            });

        });

    });

});

// --------------------------------------------------------------------------------
function attachSeverity(result: IssueForCAResultBase, severity: CAIssueSeverity | undefined) : boolean {
    if (severity &&
        [CAIssueSeverity.error, CAIssueSeverity.warning, CAIssueSeverity.info].includes(severity)) {
        result.severity = severity;
        result.message = 'message';
        return true;
    }
    return false;
}

function createValueHostCAResult(name: string | null | undefined = 'Field1',
    valueHostType: string | null | undefined = ValueHostType.Static,
    dataType: string | null | undefined = LookupKey.Number,
    propertyNamesWithErrors: Array<string> = []): ValueHostConfigCAResult {
    return {
        feature: CAFeature.valueHost,
        valueHostName: name ?? '[Missing]',
        properties: createPropertiesWithErrorsResults(propertyNamesWithErrors),
        config: {
            name: name ?? '[Missing]',
            valueHostType: valueHostType ?? ValueHostType.Static,
            dataType: dataType ?? LookupKey.Number
        }
    };
};
function createPropertyCAResult(propertyName: string, severity?: CAIssueSeverity): PropertyCAResult {
    let result: PropertyCAResult = {
        feature: CAFeature.property,
        propertyName: propertyName,
    };
    attachSeverity(result, severity);
    return result;
}

function createPropertiesWithErrorsResults(propertyNames: Array<string>): Array<PropertyCAResult> {
    let results: Array<PropertyCAResult> = [];
    propertyNames.forEach((name) => {
        let result = createPropertyCAResult(name, CAIssueSeverity.error);
        results.push(result);
    });
    return results;
}

function createValidatorConfigResult(errorCode: string | undefined,
    propertyNamesWithErrors: Array<string> = [],
    condition?: string | ConditionConfigCAResult): ValidatorConfigCAResult {
    let condResult: ConditionConfigCAResult | undefined;
    if (condition === undefined)
    {
        condResult = createConditionConfigResult('ConditionType');   
    }
    else if (typeof condition === 'string') {
        if (errorCode === '[Missing]' || condition === '[Missing]')
            condResult = undefined;
        else
            condResult = createConditionConfigResult(condition);
    }
    else
        condResult = condition;
    if (!errorCode)
        if (condResult && condResult.conditionType)
            errorCode = condResult.conditionType;
        else
            errorCode = '[Missing]';
    return {
        feature: CAFeature.validator,
        errorCode: errorCode,
        properties: createPropertiesWithErrorsResults(propertyNamesWithErrors),
        conditionResult: condResult,
        config: {
            errorCode: errorCode,
            conditionConfig: condResult ? condResult!.config : undefined!
        }
    };
}
function createConditionConfigResult(conditionType: string,
    propertyNamesWithErrors: Array<string> = []
): ConditionConfigCAResult {
    return {
        feature: CAFeature.condition,
        conditionType: conditionType,
        properties: createPropertiesWithErrorsResults(propertyNamesWithErrors),
        config: {
            conditionType: conditionType
        }
    };
}
function createLookupKeyCAResult(lookupKey: string): LookupKeyCAResult {
    return {
        feature: CAFeature.lookupKey,
        lookupKey: lookupKey,
        serviceResults: [],
        usedAsDataType: false
    };
}

function createIdentifierServiceCAResult(severity: CAIssueSeverity): IdentifierServiceCAResult;
function createIdentifierServiceCAResult(classFound: string): IdentifierServiceCAResult;
function createIdentifierServiceCAResult(notFound: boolean): IdentifierServiceCAResult;
function createIdentifierServiceCAResult(arg: CAIssueSeverity | string | boolean): IdentifierServiceCAResult {
    let result: IdentifierServiceCAResult = {
        feature: CAFeature.identifier
    };
    if (typeof arg === 'string') {
        if (!attachSeverity(result, arg as any))
            result.classFound = arg;
    }
    else if (typeof arg === 'boolean') {
        result.notFound = arg;
    }
    else
        attachSeverity(result, arg);
    return result;
}

function createComparerServiceCAResult(severity: CAIssueSeverity): ComparerServiceCAResult;
function createComparerServiceCAResult(classFound: string): ComparerServiceCAResult;
function createComparerServiceCAResult(notFound: boolean): ComparerServiceCAResult;
function createComparerServiceCAResult(arg: CAIssueSeverity | string | boolean): ComparerServiceCAResult {
    let result: ComparerServiceCAResult = {
        feature: CAFeature.comparer
    };
    if (typeof arg === 'string') {
        if (!attachSeverity(result, arg as any))
            result.classFound = arg;
    }
    else if (typeof arg === 'boolean') {
        result.notFound = arg;
    }
    else {
        attachSeverity(result, arg);
    }
    return result;
}
// same for ConverterServiceCAResult function
function createConverterServiceCAResult(severity: CAIssueSeverity): ConverterServiceCAResult;
function createConverterServiceCAResult(classFound: string): ConverterServiceCAResult;
function createConverterServiceCAResult(notFound: boolean): ConverterServiceCAResult;
function createConverterServiceCAResult(arg: CAIssueSeverity | string | boolean): ConverterServiceCAResult {
    let result: ConverterServiceCAResult = {
        feature: CAFeature.converter
    };
    if (typeof arg === 'string') {
        if (!attachSeverity(result, arg as any))
            result.classFound = arg;
    }
    else if (typeof arg === 'boolean') {
        result.notFound = arg;
    }
    else {
        attachSeverity(result, arg);
    }
    return result;
}

function createFormatterServiceCAResult(severity?: CAIssueSeverity): FormatterServiceCAResult
{
    let result: FormatterServiceCAResult = {
        feature: CAFeature.formatter,
        results: []
    };
    attachSeverity(result, severity);
    return result;
}

function createFormattersByCultureCAResult(requestedCultureId: string, severity: CAIssueSeverity): FormattersByCultureCAResult;
function createFormattersByCultureCAResult(requestedCultureId: string, classFound: string): FormattersByCultureCAResult;
function createFormattersByCultureCAResult(requestedCultureId: string, notFound: boolean): FormattersByCultureCAResult;
function createFormattersByCultureCAResult(requestedCultureId: string, arg: CAIssueSeverity | string | boolean): FormattersByCultureCAResult {
    let result: FormattersByCultureCAResult = {
        feature: CAFeature.formattersByCulture,
        requestedCultureId: requestedCultureId
    };
    if (typeof arg === 'string') {
        if (!attachSeverity(result, arg as any))
            result.classFound = arg;
    }
    else if (typeof arg === 'boolean') {
        result.notFound = arg;
    }
    else {
        attachSeverity(result, arg);
    }
    return result;
}

function createParserServiceCAResult(severity?: CAIssueSeverity): ParserServiceCAResult
{
    let result: ParserServiceCAResult = {
        feature: CAFeature.parser,
        results: []
    };
    attachSeverity(result, severity);
    return result;
}

function createParsersByCultureCAResult(cultureId: string): ParsersByCultureCAResult;
function createParsersByCultureCAResult(cultureId: string, severity: CAIssueSeverity): ParsersByCultureCAResult;
function createParsersByCultureCAResult(cultureId: string, notFound: boolean): ParsersByCultureCAResult;
function createParsersByCultureCAResult(cultureId: string, arg?: CAIssueSeverity | boolean): ParsersByCultureCAResult
{
    let result: ParsersByCultureCAResult = {
        feature: CAFeature.parsersByCulture,
        cultureId: cultureId,
        parserResults: []
    };
    if (arg !== undefined) {
        if (typeof arg === 'boolean') {
            result.notFound = arg;
        }
        else {
            attachSeverity(result, arg);
        }
    }
    return result;
}

function createParserFoundCAResult(classFound: string): ParserFoundCAResult
{
    let result: ParserFoundCAResult = {
        feature: CAFeature.parserFound,
        classFound: classFound
    };
    return result;
}

describe('ValueHostConfigCAResultExplorer class', () => {

    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let vhcResult = createValueHostCAResult();
            let explorer: ValueHostConfigCAResultExplorer;
            expect(() => explorer = new ValueHostConfigCAResultExplorer(vhcResult)).not.toThrow();
            expect(explorer!.result).toBe(vhcResult);
            expect(explorer!.feature()).toBe(CAFeature.valueHost);
            expect(explorer!.identifier()).toBe(vhcResult.valueHostName);
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity.
        // CASearch class has been tested for numerous cases. So, we will not repeat them here.

        test('returns true when valueHostName is assigned and found in criteria', () => {
            let vhcResult = createValueHostCAResult('Field1');
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ valueHostNames: ['Field1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when valueHostName is assigned and not found in criteria', () => {
            let vhcResult = createValueHostCAResult('Field1');
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ valueHostNames: ['Field2'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when valueHostName is assigned and but criteria.valueHostName is undefined', () => {
            let vhcResult = createValueHostCAResult('Field1');
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ conditionTypes: ['Field1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        // Several sources for children:
        // 1. properties
        // 2. validatorResults
        // 3. enablerConditionResults
        test('returns empty array when there are no properties, validatorResults, or enablerConditionResults', () => {
            let vhcResult = createValueHostCAResult();
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 properties, with no other types of children', () => {
            let vhcResult = createValueHostCAResult();
            vhcResult.properties = [
                createPropertyCAResult('Property1'),
                createPropertyCAResult('Property2')
            ];
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(vhcResult.properties[0]);
            expect(children[1]).toBe(vhcResult.properties[1]);
        });
        test('returns 2 children when there are 2 validatorResults, with no other types of children', () => {
            let vhcResult = createValueHostCAResult();
            vhcResult.validatorResults = [
                createValidatorConfigResult('Error1'),
                createValidatorConfigResult('Error2')
            ];
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(vhcResult.validatorResults[0]);
            expect(children[1]).toBe(vhcResult.validatorResults[1]);
        });
        test('returns 1 child when there is an enablerConditionResults, with no other types of children', () => {
            let vhcResult = createValueHostCAResult();
            vhcResult.enablerConditionResult = createConditionConfigResult('Condition1');
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(1);
            expect(children[0]).toBe(vhcResult.enablerConditionResult);

        });
        // put it all together
        test('returns 5 children when there are 2 properties, 2 validatorResults, and 1 enablerConditionResults', () => {
            let vhcResult = createValueHostCAResult();
            vhcResult.properties = [
                createPropertyCAResult('Property1'),
                createPropertyCAResult('Property2')
            ];
            vhcResult.validatorResults = [
                createValidatorConfigResult('Error1'),
                createValidatorConfigResult('Error2')
            ];
            vhcResult.enablerConditionResult = createConditionConfigResult('Condition1');
            let explorer = new ValueHostConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(5);
            expect(children[0]).toBe(vhcResult.properties[0]);
            expect(children[1]).toBe(vhcResult.properties[1]);
            expect(children[2]).toBe(vhcResult.validatorResults[0]);
            expect(children[3]).toBe(vhcResult.validatorResults[1]);
            expect(children[4]).toBe(vhcResult.enablerConditionResult);
        });
    });

});
// for ValidatorConfigCAResultExplorer
describe('ValidatorConfigCAResultExplorer class', () => {

    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            let explorer: ValidatorConfigCAResultExplorer;
            expect(() => explorer = new ValidatorConfigCAResultExplorer(vhcResult)).not.toThrow();
            expect(explorer!.result).toBe(vhcResult);
            expect(explorer!.feature()).toBe(CAFeature.validator);
            expect(explorer!.identifier()).toBe('Error1');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity. So we will not repeat them here.            
        test('returns true when errorCode is assigned and found in criteria', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ errorCodes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when errorCode is assigned and not found in criteria', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ errorCodes: ['Error2'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when errorCode is assigned and but criteria.errorCode is undefined', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ conditionTypes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        // Several sources for children:
        // 1. properties
        // 2. conditionResult
        test('returns empty array when there are no properties or conditionResult', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            vhcResult.conditionResult = undefined;
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 properties and no conditionResult', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            vhcResult.conditionResult = undefined;
            vhcResult.properties = [
                createPropertyCAResult('Property1'),
                createPropertyCAResult('Property2')
            ];
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(vhcResult.properties[0]);
            expect(children[1]).toBe(vhcResult.properties[1]);
        });
        test('returns 1 child when there is a conditionResult', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            vhcResult.conditionResult = createConditionConfigResult('Condition1');
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(1);
            expect(children[0]).toBe(vhcResult.conditionResult);

        });
        // put it all together
        test('returns 3 children when there are 2 properties and 1 conditionResult', () => {
            let vhcResult = createValidatorConfigResult('Error1');
            vhcResult.properties = [
                createPropertyCAResult('Property1'),
                createPropertyCAResult('Property2')
            ];
            vhcResult.conditionResult = createConditionConfigResult('Condition1');
            let explorer = new ValidatorConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(3);
            expect(children[0]).toBe(vhcResult.properties[0]);
            expect(children[1]).toBe(vhcResult.properties[1]);
            expect(children[2]).toBe(vhcResult.conditionResult);
        });
    });

});

// for ConditionConfigCAResultExplorer
describe('ConditionConfigCAResultExplorer class', () => {

    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            let explorer: ConditionConfigCAResultExplorer;
            expect(() => explorer = new ConditionConfigCAResultExplorer(vhcResult)).not.toThrow();
            expect(explorer!.result).toBe(vhcResult);
            expect(explorer!.feature()).toBe(CAFeature.condition);
            expect(explorer!.identifier()).toBe('Condition1');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity. So we will not repeat them here.
        test('returns true when conditionType is assigned and found in criteria', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            let explorer = new ConditionConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ conditionTypes: ['Condition1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when conditionType is assigned and not found in criteria', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            let explorer = new ConditionConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ conditionTypes: ['Condition2'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when conditionType is assigned and but criteria.conditionType is undefined', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            let explorer = new ConditionConfigCAResultExplorer(vhcResult);
            let searcher = new CASearcher({ errorCodes: ['Condition1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        // Children are properties only.
        test('returns empty array when there are no properties', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            let explorer = new ConditionConfigCAResultExplorer(vhcResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 properties', () => {
            let vhcResult = createConditionConfigResult('Condition1');
            vhcResult.properties = [
                createPropertyCAResult('Property1'),
                createPropertyCAResult('Property2')
            ];
            let explorer = new ConditionConfigCAResultExplorer(vhcResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(vhcResult.properties[0]);
            expect(children[1]).toBe(vhcResult.properties[1]);
        });

    });

});

describe('LookupKeyCAResultExplorer class', () => {
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            let explorer: LookupKeyCAResultExplorer;
            expect(() => explorer = new LookupKeyCAResultExplorer(lkResult)).not.toThrow();
            expect(explorer!.result).toBe(lkResult);
            expect(explorer!.feature()).toBe(CAFeature.lookupKey);
            expect(explorer!.identifier()).toBe(LookupKey.Number);
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity. So we will not repeat them here.
        test('returns true when lookupKey is found in criteria', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            let explorer = new LookupKeyCAResultExplorer(lkResult);
            let searcher = new CASearcher({ lookupKeys: [LookupKey.Number] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when lookupKey is not found in criteria', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            let explorer = new LookupKeyCAResultExplorer(lkResult);
            let searcher = new CASearcher({ lookupKeys: [LookupKey.String] });
            expect(explorer.matchThis(searcher)).toBe(false);
        });
        test('returns undefined when criteria.lookupKeys is undefined', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            let explorer = new LookupKeyCAResultExplorer(lkResult);
            let searcher = new CASearcher({ conditionTypes: ['Field1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });

    describe('children', () => {
        // Several sources for children:
        // 1. serviceResults
        test('returns empty array when there are no serviceResults', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            let explorer = new LookupKeyCAResultExplorer(lkResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 serviceResults', () => {
            let lkResult = createLookupKeyCAResult(LookupKey.Number);
            lkResult.serviceResults = [
                <ParserServiceCAResult>{ feature: CAFeature.parser },
                <FormatterServiceCAResult>{ feature: CAFeature.formatter }
            ];
            let explorer = new LookupKeyCAResultExplorer(lkResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(lkResult.serviceResults[0]);
            expect(children[1]).toBe(lkResult.serviceResults[1]);
        });

    });
});

describe('IdentifierServiceCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of null, and no feature specific criteria.
    function createIdentifierServiceCAResult(): IdentifierServiceCAResult {
        return {
            feature: CAFeature.identifier
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createIdentifierServiceCAResult();
            let explorer: IdentifierServiceCAResultExplorer;
            expect(() => explorer = new IdentifierServiceCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.identifier);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createIdentifierServiceCAResult();
            let explorer = new IdentifierServiceCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
}); 

describe('ConverterServiceCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of null, and no feature specific criteria.
    function createConverterServiceCAResult(): ConverterServiceCAResult {
        return {
            feature: CAFeature.converter
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createConverterServiceCAResult();
            let explorer: ConverterServiceCAResultExplorer;
            expect(() => explorer = new ConverterServiceCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.converter);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createConverterServiceCAResult();
            let explorer = new ConverterServiceCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});

describe('ComparerServiceCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of null, and no feature specific criteria.
    function createComparerServiceCAResult(): ComparerServiceCAResult {
        return {
            feature: CAFeature.comparer
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createComparerServiceCAResult();
            let explorer: ComparerServiceCAResultExplorer;
            expect(() => explorer = new ComparerServiceCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.comparer);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createComparerServiceCAResult();
            let explorer = new ComparerServiceCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});

describe('ParserServiceCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has an identifier of null, and no feature specific criteria.
    // It has children in the ParserServiceCAResult.results property.
    function createParserServiceCAResult(): ParserServiceCAResult {
        return {
            feature: CAFeature.parser,
            results: []
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createParserServiceCAResult();
            let explorer: ParserServiceCAResultExplorer;
            expect(() => explorer = new ParserServiceCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.parser);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createParserServiceCAResult();
            let explorer = new ParserServiceCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 results', () => {
            let serviceResult = createParserServiceCAResult();
            serviceResult.results = [
                <ParsersByCultureCAResult>{ feature: CAFeature.parsersByCulture },
                <ParsersByCultureCAResult>{ feature: CAFeature.parsersByCulture }
            ];
            let explorer = new ParserServiceCAResultExplorer(serviceResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(serviceResult.results[0]);
            expect(children[1]).toBe(serviceResult.results[1]);
        });
    });
});

describe('ParsersByCultureCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has an identifier of cultureId, and matches to criteria.cultureIds.
    // It has children in the ParsersByCultureCAResult.parserResults property.
    function createParsersByCultureCAResult(cultureId: string = 'en'): ParsersByCultureCAResult {
        return {
            feature: CAFeature.parsersByCulture,
            parserResults: [],
            cultureId: cultureId
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createParsersByCultureCAResult('en');
            let explorer: ParsersByCultureCAResultExplorer;
            expect(() => explorer = new ParsersByCultureCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.parsersByCulture);
            expect(explorer!.identifier()).toBe('en');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity.
        // CASearch class has been tested for numerous cases. So, we will not repeat them here.

        test('returns true when cultureId is assigned and found in criteria', () => {
            let serviceResult = createParsersByCultureCAResult('en');
            let explorer = new ParsersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ cultureIds: ['en'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when cultureId is assigned and not found in criteria', () => {
            let serviceResult = createParsersByCultureCAResult('en');
            let explorer = new ParsersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ cultureIds: ['fr'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when cultureId is assigned and but criteria.cultureIds is undefined', () => {
            let serviceResult = createParsersByCultureCAResult('en');
            let explorer = new ParsersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ errorCodes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createParsersByCultureCAResult();
            let explorer = new ParsersByCultureCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 parsers', () => {
            let serviceResult = createParsersByCultureCAResult();
            serviceResult.parserResults = [
                <ParserFoundCAResult>{ feature: CAFeature.parserFound },
                <ParserFoundCAResult>{ feature: CAFeature.parserFound }
            ];
            let explorer = new ParsersByCultureCAResultExplorer(serviceResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(serviceResult.parserResults[0]);
            expect(children[1]).toBe(serviceResult.parserResults[1]);
        });
    });
});

describe('ParserFoundCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of null, and no feature specific criteria.
    function createParserFoundCAResult(): ParserFoundCAResult {
        return {
            feature: CAFeature.parserFound
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createParserFoundCAResult();
            let explorer: ParserFoundCAResultExplorer;
            expect(() => explorer = new ParserFoundCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.parserFound);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createParserFoundCAResult();
            let explorer = new ParserFoundCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});

describe('FormatterServiceCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has an identifier of null, and no feature specific criteria.
    // It has children in the FormatterServiceCAResult.results property.
    function createFormatterServiceCAResult(): FormatterServiceCAResult {
        return {
            feature: CAFeature.formatter,
            results: []
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createFormatterServiceCAResult();
            let explorer: FormatterServiceCAResultExplorer;
            expect(() => explorer = new FormatterServiceCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.formatter);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createFormatterServiceCAResult();
            let explorer = new FormatterServiceCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
        test('returns 2 children when there are 2 results', () => {
            let serviceResult = createFormatterServiceCAResult();
            serviceResult.results = [
                <FormattersByCultureCAResult>{ feature: CAFeature.formattersByCulture },
                <FormattersByCultureCAResult>{ feature: CAFeature.formattersByCulture }
            ];
            let explorer = new FormatterServiceCAResultExplorer(serviceResult);
            let children = explorer.children();
            expect(children).toHaveLength(2);
            expect(children[0]).toBe(serviceResult.results[0]);
            expect(children[1]).toBe(serviceResult.results[1]);
        });
    });
});

describe('FormattersByCultureCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has an identifier of cultureId, and matches to criteria.cultureIds.
    // It has no children.
    function createFormattersByCultureCAResult(cultureId: string = 'en'): FormattersByCultureCAResult {
        return {
            feature: CAFeature.formattersByCulture,
            requestedCultureId: cultureId
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let serviceResult = createFormattersByCultureCAResult('en');
            let explorer: FormattersByCultureCAResultExplorer;
            expect(() => explorer = new FormattersByCultureCAResultExplorer(serviceResult)).not.toThrow();
            expect(explorer!.result).toBe(serviceResult);
            expect(explorer!.feature()).toBe(CAFeature.formattersByCulture);
            expect(explorer!.identifier()).toBe('en');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity.
        // CASearch class has been tested for numerous cases. So, we will not repeat them here.

        test('returns true when cultureId is assigned and found in criteria', () => {
            let serviceResult = createFormattersByCultureCAResult('en');
            let explorer = new FormattersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ cultureIds: ['en'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when cultureId is assigned and not found in criteria', () => {
            let serviceResult = createFormattersByCultureCAResult('en');
            let explorer = new FormattersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ cultureIds: ['fr'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when cultureId is assigned and but criteria.cultureIds is undefined', () => {
            let serviceResult = createFormattersByCultureCAResult('en');
            let explorer = new FormattersByCultureCAResultExplorer(serviceResult);
            let searcher = new CASearcher({ errorCodes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        test('returns empty array', () => {
            let serviceResult = createFormattersByCultureCAResult();
            let explorer = new FormattersByCultureCAResultExplorer(serviceResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});
describe('PropertyCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of propertyName, and matches to criteria.propertyNames.
    function createPropertyCAResult(propertyName: string = 'Property1'): PropertyCAResult {
        return {
            feature: CAFeature.property,
            propertyName: propertyName
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let propertyResult = createPropertyCAResult('Property1');
            let explorer: PropertyCAResultExplorer;
            expect(() => explorer = new PropertyCAResultExplorer(propertyResult)).not.toThrow();
            expect(explorer!.result).toBe(propertyResult);
            expect(explorer!.feature()).toBe(CAFeature.property);
            expect(explorer!.identifier()).toBe('Property1');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity.
        // CASearch class has been tested for numerous cases. So, we will not repeat them here.

        test('returns true when propertyName is assigned and found in criteria', () => {
            let propertyResult = createPropertyCAResult('Property1');
            let explorer = new PropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        
        test('returns false when propertyName is assigned and not found in criteria', () => {
            let propertyResult = createPropertyCAResult('Property1');
            let explorer = new PropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property2'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns undefined when propertyName is assigned and but criteria.propertyNames is undefined', () => {
            let propertyResult = createPropertyCAResult('Property1');
            let explorer = new PropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ errorCodes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });

    });
    describe('children', () => {
        test('returns empty array', () => {
            let propertyResult = createPropertyCAResult();
            let explorer = new PropertyCAResultExplorer(propertyResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});

describe('LocalizedPropertyCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of l10nPropertyName, and matches to criteria.propertyNames
    // against both propertyName and l10nPropertyName.
    function createLocalizedPropertyCAResult(l10nPropertyName: string | undefined,
        propertyName: string | undefined): LocalizedPropertyCAResult {
        return {
            feature: CAFeature.l10nProperty,
            propertyName: propertyName!,
            l10nPropertyName: l10nPropertyName!,
            l10nKey: 'l10nKey',
            cultureText: { 'en': { text: 'result'} }
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer: LocalizedPropertyCAResultExplorer;
            expect(() => explorer = new LocalizedPropertyCAResultExplorer(propertyResult)).not.toThrow();
            expect(explorer!.result).toBe(propertyResult);
            expect(explorer!.feature()).toBe(CAFeature.l10nProperty);
            expect(explorer!.identifier()).toBe('l10nProperty1');
        });
    });
    describe('matchThis', () => {
        // base class has covered feature and severity.
        // Matches both the propertyName and l10nPropertyName properties against criteria.propertyNames.
        //  In this case, either match is sufficient to return true.        
        test('returns true when propertyName is assigned and found in criteria', () => {
            let propertyResult = createLocalizedPropertyCAResult(undefined, 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property1'] });
            let match = explorer.matchThis(searcher);
            expect(match).toBe(true);
        });
        test('returns true when l10nPropertyName is assigned and found in criteria', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', undefined);
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['l10nProperty1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        test('returns true when both propertyName and l10nPropertyName are assigned and matches to propertyName only', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        test('returns true when both propertyName and l10nPropertyName are assigned and matches to l10nPropertyName only', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['l10nProperty1'] });
            expect(explorer.matchThis(searcher)).toBe(true);
        });
        test('returns false when propertyName is assigned and not found in criteria', () => {
            let propertyResult = createLocalizedPropertyCAResult(undefined, 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property2'] });
            expect(explorer.matchThis(searcher)).toBe(false);

        });
        test('returns false when l10nPropertyName is assigned and not found in criteria', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', undefined);
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property1'] });
            expect(explorer.matchThis(searcher)).toBe(false);
        });
        test('returns false when both propertyName and l10nPropertyName are assigned but neither match', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ propertyNames: ['Property2'] });
            expect(explorer.matchThis(searcher)).toBe(false);
        });
        test('returns undefined when propertyName and l10nPropertyName are assigned and but criteria.propertyNames is undefined', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            let searcher = new CASearcher({ errorCodes: ['Error1'] });
            expect(explorer.matchThis(searcher)).toBe(undefined);
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let propertyResult = createLocalizedPropertyCAResult('l10nProperty1', 'Property1');
            let explorer = new LocalizedPropertyCAResultExplorer(propertyResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});

describe('ErrorCAResultExplorer class', () => {
    // base class covers most of the tests.
    // This class has no children, an identifier of null, and no feature-specific criteria to match
    function createErrorCAResult(): ErrorCAResult {
        return {
            feature: CAFeature.error,
            analyzerClassName: 'ClassName',
            severity: CAIssueSeverity.error
        };
    }
    describe('constructor and initial properties', () => {
        test('constructor initializes properties', () => {
            let errorResult = createErrorCAResult();
            let explorer: ErrorCAResultExplorer;
            expect(() => explorer = new ErrorCAResultExplorer(errorResult)).not.toThrow();
            expect(explorer!.result).toBe(errorResult);
            expect(explorer!.feature()).toBe(CAFeature.error);
            expect(explorer!.identifier()).toBeNull();
        });
    });
    describe('children', () => {
        test('returns empty array', () => {
            let errorResult = createErrorCAResult();
            let explorer = new ErrorCAResultExplorer(errorResult);
            expect(explorer.children()).toHaveLength(0);
        });
    });
});
describe('ConfigAnalysisResultExplorer class', () => {
    // Tests include:
    // group for "Constructor and setup"
        // constructor setup correctly checking properties that are inited
        // constructor throws for each parameter that is null
    // group for countConfigResults function
    // group for countLookupKeyResults function
    // group for hasMatchInConfigResults function
    // group for hasMatchInLookupKeyResults function
    // group for collectWithConfigs function
    // group for collectWithLookupKeys function
    let factory = new ConfigAnalysisResultsExplorerFactory();
    let services = new MockValidationServices(false, false);

    function createBasicConfigAnalysisResults(): IConfigAnalysisResults {
        return {
            cultureIds: ['en'],
            valueHostNames: [],
            valueHostResults: [],
            lookupKeyResults: [],
            lookupKeysIssues: []
        };
    }

    // Need helper functions to create the objects
    // I want 4 extensive objects with two of every type of result somewhere.

    // Create a ConfigAnalysisResults object with 2 of every type of result.
    function createConfigAnalysisResults(): IConfigAnalysisResults {
        let results: IConfigAnalysisResults = createBasicConfigAnalysisResults();
        results.valueHostNames = ['ValueHost1', 'ValueHost2'];
        results.cultureIds = ['en', 'fr'];

        // 'ValueHost1' is a static value host with a datetime lookup key
        // it has an info message
        let vh1Result = createValueHostCAResult('ValueHost1', ValueHostType.Static, LookupKey.DateTime);
        attachSeverity(vh1Result, CAIssueSeverity.info);

        let dataTypeVH1Result = createPropertyCAResult('dataType'); 
        attachSeverity(dataTypeVH1Result, CAIssueSeverity.warning);
        vh1Result.properties = [dataTypeVH1Result];

        // 'ValueHost2' is an input value host with an integer lookup key
        // It has 3 validators. One has an error message.
        // It has a warning message for l10nProperty.
        let vh2Result = createValueHostCAResult('ValueHost2', ValueHostType.Input, LookupKey.Integer,
            ['dataType', 'labell10n']);
        let ivhc = vh2Result.config as InputValueHostConfig;
        ivhc.parserLookupKey = LookupKey.Minutes;
        ivhc.label = 'ValueHost2Label';
        ivhc.labell10n = 'ValueHost2LabelL10n';

        results.valueHostResults = [vh1Result, vh2Result];

        // 4 validators for ValueHost2.
        // Start with their 3 conditionResults, where the 3rd has a property with an error
        // Then the 4th validator has an error at the validator level and does not have a conditionResult
        let requiredTextCondResult = createConditionConfigResult('RequireText');
        let dataTypeCheckCondResult = createConditionConfigResult('DataTypeCheck');
        let regExpCondResult = createConditionConfigResult('RegExp', ['expression']);// pretend expression is missing

        let requiredTextValResult = createValidatorConfigResult('Error1', [], requiredTextCondResult);
        let dataTypeCheckValResult = createValidatorConfigResult(undefined, [], dataTypeCheckCondResult);
        let regExpValResult = createValidatorConfigResult(undefined, ['l10nErrorMessage'], regExpCondResult);
        // this one is an error at the validatorconfig level emulating an invalid conditionType
        let invalidValResult = createValidatorConfigResult('[Missing]', [], 'INVALID');
        attachSeverity(invalidValResult, CAIssueSeverity.error);
        vh2Result.validatorResults = [requiredTextValResult, dataTypeCheckValResult, regExpValResult, invalidValResult];
        
        // LookupKey results: LookupKey.DateTime, LookupKey.Integer, LookupKey.Minutes, LookupKey.Number
        let dateTimeLKResult = createLookupKeyCAResult(LookupKey.DateTime);
        let integerLKResult = createLookupKeyCAResult(LookupKey.Integer);
        let minutesLKResult = createLookupKeyCAResult(LookupKey.Minutes);
        let numberLKResult = createLookupKeyCAResult(LookupKey.Number);

        // We'll add a custom lookup key that should have an Identifier, but does not.
        let customLKResult = createLookupKeyCAResult('CustomLookupKey');
        let customLKIdentifier = createIdentifierServiceCAResult(CAIssueSeverity.error);
        customLKResult.serviceResults = [customLKIdentifier];

        results.lookupKeyResults = [dateTimeLKResult, integerLKResult, minutesLKResult, numberLKResult, customLKResult];

        // For LookupKey.DateTime, there are 2 parsers (DateParser and DateTimeParser), 
        // 1 formatter(DateTimeFormatter)
        // identifier (DateIdentifier), 1 converter (DateTimeToMinutesConverter)
        // No errors to report

        let parserDateTimeLK = createParserServiceCAResult();
        let enCultureParserDateTimeLK = createParsersByCultureCAResult('en');
        let frCultureParserDateTimeLK = createParsersByCultureCAResult('fr');
        parserDateTimeLK.results = [enCultureParserDateTimeLK, frCultureParserDateTimeLK];
        let found_en_ParserDateTimeLK = createParserFoundCAResult('DateParser');
        let found2_en_ParserDateTimeLK = createParserFoundCAResult('DateTimeParser');
        enCultureParserDateTimeLK.parserResults = [found_en_ParserDateTimeLK, found2_en_ParserDateTimeLK];
        let found_fr_ParserDateTimeLK = createParserFoundCAResult('DateParser');
        let found2_fr_ParserDateTimeLK = createParserFoundCAResult('DateTimeParser');
        frCultureParserDateTimeLK.parserResults = [found_fr_ParserDateTimeLK, found2_fr_ParserDateTimeLK];

        let formatterDateTimeLK = createFormatterServiceCAResult();
        let enCultureFormatterDateTimeLK = createFormattersByCultureCAResult('en', 'DateTimeFormatter');
        let frCultureFormatterDateTimeLK = createFormattersByCultureCAResult('fr', 'DateTimeFormatter');
        formatterDateTimeLK.results = [enCultureFormatterDateTimeLK, frCultureFormatterDateTimeLK];

        let converterDateTimeLK = createConverterServiceCAResult('DateTimeToMinutesConverter');
        let identifierDateTimeLK = createIdentifierServiceCAResult('DateIdentifier');
        dateTimeLKResult.serviceResults = [parserDateTimeLK, formatterDateTimeLK, converterDateTimeLK, identifierDateTimeLK];

        // For LookupKey.Integer, there will be a formatter result with an error
        // It has a NumberIdentifier and a NumberConverter
        let formatterIntegerLK = createFormatterServiceCAResult();
        let fbc3Result = createFormattersByCultureCAResult('en', 'IntegerFormatter');
        let fbc4Result = createFormattersByCultureCAResult('fr', CAIssueSeverity.error);
        formatterIntegerLK.results = [fbc3Result, fbc4Result];
        let identifierIntegerLK = createIdentifierServiceCAResult('NumberIdentifier');
        let converterIntegerLK = createConverterServiceCAResult('NumberConverter');
        integerLKResult.serviceResults = [formatterIntegerLK, identifierIntegerLK, converterIntegerLK];

        // For LookupKey.Minutes, no issues. Just a NumberIdentifier and a NumberConverter
        let identifierMinutesLK = createIdentifierServiceCAResult('NumberIdentifier');
        let converterMinutesLK = createConverterServiceCAResult('NumberConverter');
        minutesLKResult.serviceResults = [identifierMinutesLK, converterMinutesLK];

        // For LookupKey.Number, no issues. Just a NumberIdentifier
        let numLKNumberIdentifier = createIdentifierServiceCAResult('NumberIdentifier');
        numberLKResult.serviceResults = [numLKNumberIdentifier];

        return results;
    }
    // these are the CAResultPaths for each case supplied above.
    const vh1ResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost1'
    };
    const vh2ResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2'
    };
    const requiredTextValResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'Error1'
    };
    const dataTypeCheckValResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'DataTypeCheck'
    };
    const regExpValResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'RegExp'
    };
    const invalidValResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: '[Missing]'
    };
    
    const requiredTextCondResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'Error1',
        [CAFeature.condition]: 'RequireText'
    };
    const dataTypeCheckCondResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'DataTypeCheck',
        [CAFeature.condition]: 'DataTypeCheck'
    };
    const regExpCondResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'RegExp',
        [CAFeature.condition]: 'RegExp'
    };
    const dataTypeVH1ResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost1',
        [CAFeature.property]: 'dataType'
    };
    const dataTypeVH2ResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.property]: 'dataType'
    };
    const labell10nVH2ResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.property]: 'labell10n'
    };
    const l10nErrorMessageRegExpValResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'RegExp',
        [CAFeature.property]: 'l10nErrorMessage'
    };    
    const expressionRegexpCondResultPath: CAResultPath = {
        [CAFeature.valueHost]: 'ValueHost2',
        [CAFeature.validator]: 'RegExp',
        [CAFeature.condition]: 'RegExp',
        [CAFeature.property]: 'expression'
    };


    const dateTimeLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime
    };
    const integerLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer
    };
    const minutesLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Minutes
    };
    const numberLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Number
    };
    const customLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: 'CustomLookupKey'
    };


    const converterDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.converter]: null
    };
    const formatterDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.formatter]: null
    };
    const identifierDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.identifier]: null
    };
    const parserDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.parser]: null
    };
    const enCultureParserDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.parsersByCulture]: 'en'
    };
    const found_en_ParserDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.parsersByCulture]: 'en',
        [CAFeature.parserFound]: null
    };
    const frCultureParserDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.parsersByCulture]: 'fr'
    };    
    const found2_en_ParserDateTimeLKResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.parsersByCulture]: 'fr',
        [CAFeature.parserFound]: null
    };
    const enCultureFormatterDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.formatter]: null,
        [CAFeature.formattersByCulture]: 'en'
    };
    const frCultureFormatterDateTimeLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.DateTime,
        [CAFeature.formatter]: null,
        [CAFeature.formattersByCulture]: 'fr'
    };
    const fbc3ResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer,
        [CAFeature.formatter]: null,
        [CAFeature.formattersByCulture]: 'en'
    };
    const fbc4ResultPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer,
        [CAFeature.formatter]: null,
        [CAFeature.formattersByCulture]: 'fr'
    };
    const formatterIntegerLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer,
        [CAFeature.formatter]: null
    };
    const converterIntegerLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer,
        [CAFeature.converter]: null
    };
    const identifierIntegerLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Integer,
        [CAFeature.identifier]: null
    };

    const converterMinutesLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Minutes,
        [CAFeature.converter]: null
    };
    const identifierMinutesLKPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Minutes,
        [CAFeature.identifier]: null
    };
    const numLKNumberIdentifierPath: CAResultPath = {
        [CAFeature.lookupKey]: LookupKey.Number,
        [CAFeature.identifier]: null
    };
    const customLKIdentifierPath: CAResultPath = {
        [CAFeature.lookupKey]: 'CustomLookupKey',
        [CAFeature.identifier]: null
    };



    const totalConfigResultCount = 14;
    const totalLookupKeyResultCount = 20;
    const totalResultCount = totalConfigResultCount + totalLookupKeyResultCount;

    describe('Constructor and setup', () => {
        class Publicify_ConfigAnalysisResultsExplorer extends ConfigAnalysisResultsExplorer<IValueHostsServices> {
            constructor(results: IConfigAnalysisResults, factory: ICAExplorerFactory, services: IValueHostsServices) {
                super(results, factory, services);
            }
            public get publicify_factory(): ICAExplorerFactory {
                return this.factory;
            }
            public get publicify_services(): IValueHostsServices {
                return this.services;
            }
        }
        
        // here is the constructor definition:
        // constructor(results: IConfigAnalysisResults, factory: ICAExplorerFactory, services: TServices)
        test('constructor initializes properties', () => {
            let results: IConfigAnalysisResults = {
                cultureIds: ['en'],
                valueHostNames: [],
                valueHostResults: [],
                lookupKeyResults: [],
                lookupKeysIssues: [],
            };
            let explorer: Publicify_ConfigAnalysisResultsExplorer;
            expect(() => explorer = new Publicify_ConfigAnalysisResultsExplorer(
                results, factory, services)).not.toThrow();
            expect(explorer!.results).toBe(results);
            expect(explorer!.publicify_factory).toBe(factory);
            expect(explorer!.publicify_services).toBe(services);
        });
        test('constructor throws when results is null', () => {
            let results: IConfigAnalysisResults = null as any;
            expect(() => new Publicify_ConfigAnalysisResultsExplorer(
                results, factory, services)).toThrow(/results/);
        });
        test('constructor throws when factory is null', () => {
            let factory: ICAExplorerFactory = null as any;
            expect(() => new Publicify_ConfigAnalysisResultsExplorer(
                createBasicConfigAnalysisResults(), factory, services)).toThrow(/factory/);
        });
        test('constructor throws when services is null', () => {
            let services: IValueHostsServices = null as any;
            expect(() => new Publicify_ConfigAnalysisResultsExplorer(
                createBasicConfigAnalysisResults(), factory, services)).toThrow(/services/);
        });

    });
    describe('getByResultPath', () => {
        // Test cases:
        // empty CAResultPath, no match
        // empty foundResults, no match
        // path[key1] found with 1 result
        // path with 3 keys found with 1 result
        // path with 3 keys found with 3 results, matching to the 2nd result
        // case insensitive path[key1] matching to key1 in result, both values are identical. Will match.
        // case sensitive key match, but values are case insensitive match. Will match.

        function createCAResultPath(path: CAResultPath, uniqueName: string = 'Unique1'): CAPathedResult<any> {
            return {
                path: path,
                result: {
                    feature: CAFeature.valueHost,   // anything
                    message: uniqueName
                }
            }
        }

        test('empty path always returns null', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1'})]; 

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        test('empty foundResults always returns null', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults: Array<CAPathedResult<any>> = [];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        test('path contains one entry. foundResults contains the same key and value. Match', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBe(foundResults[0].result);
        });
        test('path contains one entry. foundResults contains 1 entry with a different key but the same value. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'key2': 'ValueHost1'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        test('path contains one entry. foundResults contains 1 entry with the same key but a different value. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost2'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        test('path contains 3 entries. foundResults contains 1 entry with the same keys and values. Match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBe(foundResults[0].result);
        });

        // similar but foundResults contains 2 of the same keys. No match.
        test('path contains 3 entries. foundResults contains 1 entry with 2 of same keys and values. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1', 'key2': 'ValueHost2'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // similar but different keys in foundResults. No match.
        test('path contains 3 entries. foundResults contains 1 entry with 2 of same keys and values. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1', 'key3': 'ValueHost3'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // similar but 4 keys in foundResults, with 2 an exact match to path. No match.
        test('path contains 3 entries. foundResults contains 1 entry with 2 of same keys and values. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [createCAResultPath({'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3', 'key4': 'ValueHost4'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // case insensitive match cases
        test('path contains 1 entry. foundResults contains 1 entry with the case insensitive matchihng key and case sensitive matching value. Match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'KEY1': 'ValueHost1'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBe(foundResults[0].result);
        });
        test('path contains 1 entry. foundResults contains 1 entry with the case sensitive matching key and case insensitive matching value. Match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'key1': 'VALUEHOST1'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBe(foundResults[0].result);
        });
        // same but no match on values
        test('path contains 1 entry. foundResults contains 1 entry with the case insensitive matching key and case insensitive non-matching value. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'KEY1': 'ValueHost2'})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // same but identicle values except for whitespace. no match
        test('path contains 1 entry. foundResults contains 1 entry with the matching key and case insensitive non-matching value. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1'};
            let foundResults = [createCAResultPath({'key1': ' ValueHost1 '})];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // case insensitive with 3 keys and 3 foundResults. Several tests, for matches and non-matches
        test('path contains 3 entries. foundResults contains 3 entries with the case insensitive matching keys and case sensitive matching values. Match to 2nd result.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [
                createCAResultPath({'KEY1': 'ValueHost1', 'key2': 'ValueHost2'}, 'unique1'),
                createCAResultPath({'key1': 'ValueHost1', 'KEY2': 'ValueHost2', 'key3': 'ValueHost3'}, 'unique2'),
                createCAResultPath({'key1': 'ValueHost1', 'key2': 'ValueHost2', 'KEY3': 'ValueHost3A'}, 'unique3')
            ];

            let found = explorer.getByResultPath(path, foundResults);
            expect((found as any).message).toBe('unique2');
        });
        test('path contains 3 entries. foundResults contains 3 entries with the case insensitive matching keys and case sensitive non-matching values. No match.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [
                createCAResultPath({'KEY1': 'ValueHost1', 'key2': 'ValueHost2'}, 'unique1'),
                createCAResultPath({'key1': 'ValueHost1', 'KEY2': 'ValueHost2', 'key3': 'ValueHost3A'}, 'unique2'),
                createCAResultPath({ 'key1': 'ValueHost1', 'key2': 'ValueHost2', 'KEY3': 'ValueHost3', 'key4': 'ValueHost4' }, 'unique3')
            ];

            let found = explorer.getByResultPath(path, foundResults);
            expect(found).toBeNull();
        });
        // similar except there are two matches. Ensure the first one is returned.
        test('path contains 3 entries. foundResults contains 3 entries with the case insensitive matching keys and case sensitive matching values. Match to 1st result.', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let path: CAResultPath = {'key1': 'ValueHost1', 'key2': 'ValueHost2', 'key3': 'ValueHost3'};
            let foundResults = [
                createCAResultPath({'KEY1': 'ValueHost1', 'key2': 'ValueHost2'}, 'unique1'),
                createCAResultPath({'key1': 'ValueHost1', 'KEY2': 'ValueHost2', 'key3': 'ValueHost3'}, 'unique2'),
                createCAResultPath({'key1': 'ValueHost1', 'key2': 'ValueHost2', 'KEY3': 'ValueHost3'}, 'unique3')
            ];

            let found = explorer.getByResultPath(path, foundResults);
            expect((found as any).message).toBe('unique2');
        });

    });
    describe('countConfigResults', () => {
        let results = createConfigAnalysisResults();
        let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
        test('returns count of all results', () => {
            const expectedCount = totalConfigResultCount;   // this is the CURRENT count of all results. Expect changes to results to require changes here
            let count = explorer.countConfigResults(null);
            expect(count).toBe(expectedCount);
        });
        test('returns count of all results with severity of error', () => {
            const expectedCount = 5;   // this is the CURRENT count of all results with severity of error. Expect changes to results to require changes here
            let count = explorer.countConfigResults({ severities: [CAIssueSeverity.error], skipChildrenIfParentMismatch: false });
            expect(count).toBe(expectedCount);
        });
    });
    describe('collectWithConfigs', () => {
        // We'll inspect all results returned to ensure they are the expected results.
        // The test is independent of the order of the results.
        function testResults(explorer: ConfigAnalysisResultsExplorer<any>,
            collected: Array<CAPathedResult<any>>,
            expectedPaths: Array<CAResultPath>) {
            let matches: Array<CAResultPath> = []; // this is more for debugging

            for (let expected of expectedPaths) {
                let result = explorer.getByResultPath(expected, collected);
                expect(result).not.toBeNull();
                matches.push(expected);
            }
            expect(collected).toHaveLength(expectedPaths.length);
        }
        // DO NOT MODIFY THIS ARRAY WITHIN A TEST.
        // Clone it and use it as starting point for a test.
        const allConfigResultPaths: Array<CAResultPath> = [
            vh1ResultPath,
            vh2ResultPath,
            requiredTextValResultPath,
            dataTypeCheckValResultPath,
            regExpValResultPath,
            invalidValResultPath,
            requiredTextCondResultPath,
            dataTypeCheckCondResultPath,
            regExpCondResultPath,
            dataTypeVH1ResultPath,
            dataTypeVH2ResultPath,
            labell10nVH2ResultPath,
            l10nErrorMessageRegExpValResultPath,
            expressionRegexpCondResultPath
        ];
        // DO NOT MODIFY THIS ARRAY WITHIN A TEST.
        // Clone it and use it as starting point for a test.

        const allLookupKeyResultPaths: Array<CAResultPath> = [
            dateTimeLKResultPath,
            integerLKResultPath,
            minutesLKResultPath,
            numberLKResultPath,
            customLKResultPath,
            converterDateTimeLKPath,
            formatterDateTimeLKPath,
            identifierDateTimeLKPath,
            parserDateTimeLKPath,
            enCultureParserDateTimeLKPath,
            found_en_ParserDateTimeLKPath,
            frCultureParserDateTimeLKPath,
            found2_en_ParserDateTimeLKResultPath,
            enCultureFormatterDateTimeLKPath,
            frCultureFormatterDateTimeLKPath,
            fbc3ResultPath,
            fbc4ResultPath,
            formatterIntegerLKPath,
            converterIntegerLKPath,
            identifierIntegerLKPath,
            converterMinutesLKPath,
            identifierMinutesLKPath,
            numLKNumberIdentifierPath,
            customLKIdentifierPath
        ];
        test('returns all results when no criteria is provided', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs(null);
            // match all paths for configs. We don't care about the order
            let expectedPaths: Array<CAResultPath> = allConfigResultPaths.slice();
            testResults(explorer, collected, expectedPaths);

        });
        test('returns all results when criteria is empty', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({});
            // match all paths for configs. We don't care about the order
            let expectedPaths: Array<CAResultPath> = allConfigResultPaths.slice();
            testResults(explorer, collected, expectedPaths);
        });
        test('All feature=ValueHost, which should be 2 items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ features: [CAFeature.valueHost] });
            let expectedPaths: Array<CAResultPath> = [vh1ResultPath, vh2ResultPath];
            testResults(explorer, collected, expectedPaths);
        });
        test('All feature=Validator, which should be 4 items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ features: [CAFeature.validator] });
            let expectedPaths: Array<CAResultPath> = [requiredTextValResultPath, dataTypeCheckValResultPath, regExpValResultPath, invalidValResultPath];
            testResults(explorer, collected, expectedPaths);
        });
        // same but only those with an error. Should only return invalidValResultPath
        test('All feature=Validator with severity=error, which should be 1 item', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ features: [CAFeature.validator], severities: [CAIssueSeverity.error] });
            let expectedPaths: Array<CAResultPath> = [invalidValResultPath];
            testResults(explorer, collected, expectedPaths);
        });
        // now all with severity=info. Should return vh1ResultPath
        test('All with severity=info, which should be 1 item', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ severities: [CAIssueSeverity.info] });
            let expectedPaths: Array<CAResultPath> = [vh1ResultPath];
            testResults(explorer, collected, expectedPaths);
        });
        // all with severity=error, warning. Should return invalidValResultPath, dataTypeVH1ResultPath, dataTypeVH2ResultPath
        test('All with severity=error, warning, which should be 6 items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ severities: [CAIssueSeverity.error, CAIssueSeverity.warning] });
            let expectedPaths: Array<CAResultPath> = [invalidValResultPath, dataTypeVH1ResultPath, 
                dataTypeVH2ResultPath, labell10nVH2ResultPath, l10nErrorMessageRegExpValResultPath, expressionRegexpCondResultPath];
            
            testResults(explorer, collected, expectedPaths);
        });
        test('All that have no severity (severities=[null]), which should be all - 6 (error, warning) - 1 (info) items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ severities: [null] });
            let expectedPaths: Array<CAResultPath> =  [
 //               vh1ResultPath, = info
                vh2ResultPath,
                requiredTextValResultPath,
                dataTypeCheckValResultPath,
                regExpValResultPath,
 //               invalidValResultPath,
                requiredTextCondResultPath,
                dataTypeCheckCondResultPath,
                regExpCondResultPath,
 //               dataTypeVH1ResultPath,
 //               dataTypeVH2ResultPath,
 //               labell10nVH2ResultPath,
 //               l10nErrorMessageRegExpValResultPath,
 //               expressionRegexpCondResultPath
            ];
            testResults(explorer, collected, expectedPaths);
        });
        // conditionType=RequiredText. Should return requiredTextCondResultPath
        test('All with conditionType=RequiredText, which should be 2 items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ conditionTypes: ['RequireText'] });
            let expectedPaths: Array<CAResultPath> = [requiredTextCondResultPath];
            testResults(explorer, collected, expectedPaths);
        });
        // conditionType=RequireText, errorCode=RequireText. Should return requiredTextCondResultPath and requiredTextValResultPath
        test('All with conditionType=RequireText, errorCode=Error1, which should be 2 items', () => {
            let results = createConfigAnalysisResults();
            let explorer = new ConfigAnalysisResultsExplorer(results, factory, services);
            let collected = explorer.collectWithConfigs({ conditionTypes: ['RequireText'], errorCodes: ['Error1'] });
            let expectedPaths: Array<CAResultPath> = [requiredTextCondResultPath, requiredTextValResultPath];
            testResults(explorer, collected, expectedPaths);
        });
    });
});
