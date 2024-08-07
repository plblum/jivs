import { DataTypeParserLookupKeyAnalyzer } from "../../src/ConfigAnalysis/DataTypeParserLookupKeyAnalyzer";
import { IValidationServices } from "../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../src/Interfaces/ValueHost";
import { createValidationServicesForTesting } from "../TestSupport/createValidationServices";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
import { createAnalysisArgs } from "./support";
import { IDataTypeParser } from '../../src/Interfaces/DataTypeParsers';
import { DataTypeResolution } from '../../src/Interfaces/DataTypes';
import { CultureService } from '../../src/Services/CultureService';
import {
    CAIssueSeverity, IssueForCAResultBase, ParsersByCultureCAResult,
    CAFeature, ParserFoundCAResult, ParserServiceCAResult
} from "../../src/Interfaces/ConfigAnalysisService";

const toNumberParserLookupKey = 'toNumber';
class ToNumberParser implements IDataTypeParser<number> {
    constructor(caseIdentifier: string, cultureIds: string[] = ['en'],
        dataTypeLookupKey: string = toNumberParserLookupKey
    ) {
        this._cultureIds = cultureIds;
        this._caseIdentifier = caseIdentifier;
        this._dataTypeLookupKey = dataTypeLookupKey;
    }
    supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
        return this.isCompatible(dataTypeLookupKey, cultureId);
    }
    isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
        return dataTypeLookupKey === this.dataTypeLookupKey &&
            this.cultureIds.includes(cultureId);
    }
    parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number | null> {
        throw new Error('Method not implemented.');
    }

    protected get cultureIds(): string[] {
        return this._cultureIds;
    }
    private _cultureIds: string[] = ['en'];

    /**
     * A way to distinguish the instance returned. Each 
     * instance should have a unique identifier.
     */
    public get caseIdentifier(): string {
        return this._caseIdentifier;
    }
    private _caseIdentifier: string;

    protected get dataTypeLookupKey(): string {
        return this._dataTypeLookupKey;
    }
    private _dataTypeLookupKey: string;
}
class ToNumberParser2 extends ToNumberParser {

}
class ToNumberParser3 extends ToNumberParser {

}
const parserThatThrowsLookupKey = 'throwsError';
class ParserThatThrowsError implements IDataTypeParser<number> {
    isCompatible(dataTypeLookupKey: string, cultureId: string): boolean {
        if (dataTypeLookupKey === parserThatThrowsLookupKey)
            throw new Error('ERROR');
        return false;
    }
    supports(dataTypeLookupKey: string, cultureId: string, text: string): boolean {
        throw new Error('ERROR');
    }
    parse(text: string, dataTypeLookupKey: string, cultureId: string): DataTypeResolution<number | null> {
        throw new Error('Method not implemented.');
    }
}

function oneCulture(services: IValidationServices) {
    let cultureService = new CultureService();
    services.cultureService = cultureService;
    cultureService.register({ cultureId: 'en', fallbackCultureId: null });
}

function manyCultures(services: IValidationServices) {
    let cultureService = new CultureService();
    services.cultureService = cultureService;
    cultureService.register({ cultureId: 'en', fallbackCultureId: null });
    cultureService.register({ cultureId: 'en-US', fallbackCultureId: 'en' });
    cultureService.register({ cultureId: 'fr', fallbackCultureId: null });
}
function manyParsers(services: IValidationServices) {
    let dtps = services.dataTypeParserService;
    dtps.register(new ToNumberParser('en'));
    dtps.register(new ToNumberParser2('2:en'));
    dtps.register(new ToNumberParser3('3:en'));
    dtps.register(new ToNumberParser('fr', ['fr']));
    dtps.register(new ToNumberParser('all', ['en-US', 'en', 'fr']));
    dtps.register(new ToNumberParser2('2:all', ['en-US', 'en', 'fr']));
    dtps.register(new ToNumberParser3('3:all', ['en-US', 'en', 'fr']));
}
function verifyResults(result: ParserServiceCAResult,
    expectedRequestsCount: number, expectedTryFallback: boolean | undefined): ParserServiceCAResult {
    expect(result).toBeDefined();
    expect(result.feature).toBe(CAFeature.parser);
    expect(result.results).toBeDefined();
    expect(result.results).toHaveLength(expectedRequestsCount);
    expect(result.tryFallback).toBe(expectedTryFallback);
    return result;
}

function verifyParserForCultureClassRetrieval(plk: ParsersByCultureCAResult,
    cultureId: string, expectedParsersCount: number,
    expectedErrorMessage?: string, expectedSeverity?: CAIssueSeverity) {
    expect(plk).toBeDefined();
    expect(plk.feature).toBe(CAFeature.parsersByCulture);
    expect(plk.cultureId).toEqual(cultureId);
    expect(plk.severity).toEqual(expectedSeverity);
    expect(plk.message).toEqual(expectedErrorMessage);
    expect(plk.parserResults).toHaveLength(expectedParsersCount);
}
function verifyParserFoundCAResult(
    plk: ParsersByCultureCAResult,
    scmlkIndex: number,
    expectedClassFound: string, expectedInstance: any, expectedCaseIdentifier: string) {
    let scmlk = plk.parserResults[scmlkIndex] as ParserFoundCAResult;
    expect(scmlk).toBeDefined();
    expect(scmlk.feature).toBe(CAFeature.parserFound);
    expect(scmlk.classFound).toEqual(expectedClassFound);
    expect(scmlk.instance).toBeInstanceOf(expectedInstance);
    expect(scmlk.instance.caseIdentifier).toEqual(expectedCaseIdentifier);
}   

describe('DataTypeParserLookupKeyAnalyzer', () => {

    describe('analyze', () => {
        test('parserKey is unknown. Returns ParserServiceCAResult with \"not found\" error and no requests', () => {
            let services = createValidationServicesForTesting();
            oneCulture(services);
            let dataTypeLookupKey = LookupKey.Number;
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: dataTypeLookupKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
            const result = testItem.analyze('TestKey', valueHostConfig) as ParserServiceCAResult;
            verifyResults(result, 1, true);
            let match = result.results[0] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(match, 'en', 0, 'No DataTypeParser for LookupKey "TestKey" with culture "en"', CAIssueSeverity.error);

        });

        // Add more tests here to cover additional scenarios and edge cases
        // toNumberParser found with culture 'en' and lookup key 'toNumber'
        test('parserKey is known and is unique amongst all registered. One culture available. Returns one matching parser', () => {
            let dataTypeLookupKey = 'uniqueParser';
            let services = createValidationServicesForTesting();
            oneCulture(services);
            services.dataTypeParserService.register(new ToNumberParser('en_custom', ['en'], dataTypeLookupKey));            
            manyParsers(services);
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: dataTypeLookupKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
            const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
            verifyResults(result, 1, false);
            let match = result.results[0] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(match, 'en', 1);
            verifyParserFoundCAResult(match, 0, 'ToNumberParser', ToNumberParser, 'en_custom');
        });
        // same as previous but with 3 cultures available, and all are supported by the same registered Parser
        test('parserKey is known and is unique amongst all registered. Three cultures available. Returns one parser per culture', () => {
            let dataTypeLookupKey = 'uniqueParser';
            const culturesSupported = ['en', 'en-US', 'fr'];
            let services = createValidationServicesForTesting();
            manyCultures(services);
            services.dataTypeParserService.register(new ToNumberParser('all_custom', culturesSupported, dataTypeLookupKey));
            manyParsers(services);
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: dataTypeLookupKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
            const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
            verifyResults(result, 3, false);
            let plk = result.results[0] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');
            plk = result.results[1] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');
            plk = result.results[2] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');

        });

        // same but the analyzer lookupkey = null and the analyze function will use valueHostConfig.dataType
        test('parser LookupKey comes from valueHostConfig.dataType, not directly as a parameter in analyze. Returns one parser per culture', () => {
            let dataTypeLookupKey = 'uniqueParser';
            const culturesSupported = ['en', 'en-US', 'fr'];
            let services = createValidationServicesForTesting();
            manyCultures(services);
            services.dataTypeParserService.register(new ToNumberParser('all_custom', culturesSupported, dataTypeLookupKey));
            manyParsers(services);
            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: dataTypeLookupKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
            const result = testItem.analyze(null!, valueHostConfig) as ParserServiceCAResult;
            verifyResults(result, 3, false);
            let plk = result.results[0] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');
            plk = result.results[1] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');
            plk = result.results[2] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 1);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'all_custom');

        });

        // same as previous but with multiple parsers registered for each culture, each with its own caseIdentifier
        test('3 parser instances with their own case name, 3 cultures, all will match to toNumberParserLookupKey results in 3 cultures each with 3 parsers found', () => {
            let dataTypeLookupKey = toNumberParserLookupKey;
            const culturesSupported = ['en', 'en-US', 'fr'];
            let services = createValidationServicesForTesting();
            manyCultures(services);
            let dtps = services.dataTypeParserService;
            // all will use the same lookup key and parser class,
            // but each has its own caseIdentifier
            // Each will support all 3 cultures
            // Results in 9 parsers to find, each for each culture.
            dtps.register(new ToNumberParser('case1', culturesSupported, dataTypeLookupKey));
            dtps.register(new ToNumberParser('case2', culturesSupported, dataTypeLookupKey));
            dtps.register(new ToNumberParser('case3', culturesSupported, dataTypeLookupKey));

            let valueHostConfig: ValueHostConfig = {
                name: 'ValueHost1',
                dataType: dataTypeLookupKey
            };

            let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
            let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
            const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
            verifyResults(result, 3, false);
            let plk = result.results[0] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 3);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case1');
            verifyParserFoundCAResult(plk, 1, 'ToNumberParser', ToNumberParser, 'case2');
            verifyParserFoundCAResult(plk, 2, 'ToNumberParser', ToNumberParser, 'case3');
            plk = result.results[1] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 3);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case1');
            verifyParserFoundCAResult(plk, 1, 'ToNumberParser', ToNumberParser, 'case2');
            verifyParserFoundCAResult(plk, 2, 'ToNumberParser', ToNumberParser, 'case3');
            plk = result.results[2] as ParsersByCultureCAResult;
            verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 3);
            verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case1');
            verifyParserFoundCAResult(plk, 1, 'ToNumberParser', ToNumberParser, 'case2');
            verifyParserFoundCAResult(plk, 2, 'ToNumberParser', ToNumberParser, 'case3');
        });
    });
    // similar to previous but each case supports one culture and that culture differs from the others
    test('3 parser instances with their own case name, 3 cultures, each case supports one culture, results in 3 cultures each with 1 parser found', () => {
        let dataTypeLookupKey = toNumberParserLookupKey;
        const culturesSupported = ['en', 'en-US', 'fr'];
        let services = createValidationServicesForTesting();
        manyCultures(services);
        let dtps = services.dataTypeParserService;
        // all will use the same lookup key and parser class,
        // but each has its own caseIdentifier
        // Each will support only one culture
        // Results in 3 parsers to find, each for each culture.
        dtps.register(new ToNumberParser('case1', [culturesSupported[0]], dataTypeLookupKey));
        dtps.register(new ToNumberParser('case2', [culturesSupported[1]], dataTypeLookupKey));
        dtps.register(new ToNumberParser('case3', [culturesSupported[2]], dataTypeLookupKey));

        let valueHostConfig: ValueHostConfig = {
            name: 'ValueHost1',
            dataType: dataTypeLookupKey
        };

        let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
        let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
        const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
        verifyResults(result, 3, false);
        let plk = result.results[0] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 1);
        verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case1');
        plk = result.results[1] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 1);
        verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case2');
        plk = result.results[2] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 1);
        verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'case3');
    });

    // 3 cultures, but no parsers match, resulting in \"no found\" error on each culture
    test('parserKey is known but no parsers match. Three cultures available. Returns one parser per culture with no requests', () => {
        let dataTypeLookupKey = 'unknownParser';
        const culturesSupported = ['en', 'en-US', 'fr'];
        let services = createValidationServicesForTesting();
        manyCultures(services);
        manyParsers(services);
        let valueHostConfig: ValueHostConfig = {
            name: 'ValueHost1',
            dataType: dataTypeLookupKey
        };

        let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
        let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
        const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
        verifyResults(result, 3, true);
        let plk = result.results[0] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 0, 'No DataTypeParser for LookupKey "unknownParser" with culture "en"', CAIssueSeverity.error);
        plk = result.results[1] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 0, 'No DataTypeParser for LookupKey "unknownParser" with culture "en-US"', CAIssueSeverity.error);
        plk = result.results[2] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 0, 'No DataTypeParser for LookupKey "unknownParser" with culture "fr"', CAIssueSeverity.error);
    });
    // similar but there is a match for one culture, but not the others
    test('parserKey is known, 3 cultures exist, and parser is only supported on one culture. Returns one parser per culture with no requests', () => {
        let dataTypeLookupKey = 'uniqueParser';
        const culturesSupported = ['en', 'en-US', 'fr'];
        let services = createValidationServicesForTesting();
        manyCultures(services);
        let dtps = services.dataTypeParserService;
        dtps.register(new ToNumberParser('fr', ['fr'], dataTypeLookupKey));
        let valueHostConfig: ValueHostConfig = {
            name: 'ValueHost1',
            dataType: dataTypeLookupKey
        };

        let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
        let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
        const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
        verifyResults(result, 3, false);
        let plk = result.results[0] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[0], 0, 'No DataTypeParser for LookupKey "uniqueParser" with culture "en"', CAIssueSeverity.error);
        plk = result.results[1] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[1], 0, 'No DataTypeParser for LookupKey "uniqueParser" with culture "en-US"', CAIssueSeverity.error);
        plk = result.results[2] as ParsersByCultureCAResult;
        verifyParserForCultureClassRetrieval(plk, culturesSupported[2], 1);
        verifyParserFoundCAResult(plk, 0, 'ToNumberParser', ToNumberParser, 'fr');
    });

    // parser throws an error when isCompatible is called gets caught and reported as an error
    test('parser throws an error when isCompatible is called. Returns an error message', () => {
        let dataTypeLookupKey = parserThatThrowsLookupKey;

        let services = createValidationServicesForTesting();
        oneCulture(services);
        let dtps = services.dataTypeParserService;
        dtps.register(new ParserThatThrowsError());
        let valueHostConfig: ValueHostConfig = {
            name: 'ValueHost1',
            dataType: dataTypeLookupKey
        };

        let mockAnalysisArgs = createAnalysisArgs(services, [valueHostConfig]);
        let testItem = new DataTypeParserLookupKeyAnalyzer(mockAnalysisArgs);
        const result = testItem.analyze(dataTypeLookupKey, valueHostConfig) as ParserServiceCAResult;
        verifyResults(result, 1, false);
        let crm = result.results[0] as IssueForCAResultBase;
        expect(crm).toBeDefined();
        expect(crm.severity).toEqual(CAIssueSeverity.error);
        expect(crm.message).toBe('ERROR');

    });
});