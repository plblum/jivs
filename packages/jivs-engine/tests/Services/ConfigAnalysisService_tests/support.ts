import {
    CAFeature,
    IConfigAnalysisResults, ConfigAnalysisServiceOptions, AnalysisArgs, IConditionConfigAnalyzer, IValidatorConfigAnalyzer, IValueHostConfigAnalyzer, ValueHostConfigCAResult, CAIssueSeverity,
    PropertyCAResult, ErrorCAResult, LocalizedPropertyCAResult, LookupKeyCAResult, MultiClassRetrieval, ServiceWithLookupKeyCAResultBase, ParsersByCultureCAResult, IssueForCAResultBase, ILookupKeyAnalyzer, CultureSpecificClassRetrieval
} from "../../../src/Interfaces/ConfigAnalysisService";
import { IValidationServices, ServiceName } from "../../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { AnalysisResultsHelper } from "../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper";
import { SampleValues } from "../../../src/Services/ConfigAnalysisService/SampleValues";
import { CultureService } from "../../../src/Services/CultureService";
import { createValidationServicesForTesting } from "../../TestSupport/createValidationServices";

/**
 * 
 * @param addCultures - When [], it starts without cultures, expecting the caller to add them
 * @returns 
 */
export function createServices(addCultures: Array<string> = ['en']): IValidationServices {
    let services = createValidationServicesForTesting();
    let cultureService = new CultureService();
    services.cultureService = cultureService;
    addCultures.forEach(culture => services.cultureService.register({cultureId: culture, fallbackCultureId: null}));
    return services;
}

export function setupHelper(services: IValidationServices, options: ConfigAnalysisServiceOptions = {}): AnalysisResultsHelper<IValidationServices>
{
    let args = createAnalysisArgs(services, [], options);            
    let helper = new AnalysisResultsHelper<IValidationServices>(args);
    return helper;
}   
export function createConfigAnalysisResults(valueHostNames: Array<string>): IConfigAnalysisResults {
    let results = <IConfigAnalysisResults>{
        cultureIds: ['en'],
        valueHostNames: valueHostNames,
        lookupKeyResults: [],
        conditionsInfo: [],
        valueHostResults: []
    };

    return results;
}

export function createAnalysisArgs(services: IValidationServices,
    valueHostConfigs: Array<ValueHostConfig>,
    options?: ConfigAnalysisServiceOptions
): AnalysisArgs<IValidationServices> {

    if (!options)
        options = {};

    let mockAnalysisArgs: AnalysisArgs<IValidationServices>;
    mockAnalysisArgs = {
        services: services,
        options: options,
        results: createConfigAnalysisResults(valueHostConfigs.map(vh => vh.name)),
        sampleValues: new SampleValues<IValidationServices>(services, options),
        valueHostConfigs: valueHostConfigs,
        conditionConfigAnalyzer: null!
    };
    mockAnalysisArgs.results.cultureIds = services.cultureService.availableCultures();
    mockAnalysisArgs.conditionConfigAnalyzer = <IConditionConfigAnalyzer<any>>{
        analyze: (conditionConfig, valueHostConfig, existingResults) => {
            return {
                feature: CAFeature.condition,
                conditionType: conditionConfig.conditionType,
                properties: [],
                config: conditionConfig
            }
        }
    };
    mockAnalysisArgs.validatorConfigAnalyzer = <IValidatorConfigAnalyzer>{
        
        analyze: (validatorConfig, valueHostConfig, existingResults) => {
            return {
                feature: CAFeature.validator,
                properties: [],
                config: validatorConfig,
                errorCode: 'anything'
            }
        }
    };
    mockAnalysisArgs.valueHostConfigAnalyzer = <IValueHostConfigAnalyzer<any>>{
        analyze: (valueHostConfig, alt, existingResults) => {
            return {
                feature: CAFeature.valueHost,
                properties: [],
                config: valueHostConfig,
                valueHostName: valueHostConfig.name
            }
        }
    };

    return mockAnalysisArgs;
}

export class MockAnalyzer implements ILookupKeyAnalyzer{
    constructor(feature: ServiceName | 'DataType',
        result: ServiceWithLookupKeyCAResultBase) {
        this._feature = feature;
        if (result.feature === undefined)
            result.feature = feature;
        let msg = result as IssueForCAResultBase;
        if (msg.message === undefined)
            msg.message = 'test' + feature;
        this._result = result;

    }
    private _counter: number = 0;
    private _result: ServiceWithLookupKeyCAResultBase;
    private _feature: ServiceName | 'DataType';
    protected get feature(): ServiceName | 'DataType' {
        return this._feature;
    }
    analyze(key: string, valueHostConfig: ValueHostConfig | null): ServiceWithLookupKeyCAResultBase {
        return { ...this._result, counter : this._counter++ } as any;
    }
}
export class MockAnalyzerWithFallback extends MockAnalyzer {
    constructor(feature: ServiceName | 'DataType', rejectedLookupKey: string,
        result: ServiceWithLookupKeyCAResultBase) {
        super(feature, result);
        this._rejectedLookupKey = rejectedLookupKey;

    }

    private _rejectedLookupKey: string;

    analyze(key: string, valueHostConfig: ValueHostConfig | null): ServiceWithLookupKeyCAResultBase {
        if (key === this._rejectedLookupKey) {
            return { feature: this.feature, tryFallback: true, message: 'testFallback' } as any;
        }
        
        return super.analyze(key, valueHostConfig);
    }
}    

export function sampleValueByLookupKey(services: IValidationServices, key: string): any {
    let dti = services.dataTypeIdentifierService.getAll().find(dti => dti.dataTypeLookupKey === key);
    if (dti)
        return dti.sampleValue();
    return undefined;
}
export function checkValueHostConfigResultsInArray(results: Array<ValueHostConfigCAResult>,
    index: number,
    expectedValueHostName: string): ValueHostConfigCAResult | undefined {
    let configIssue = results[index];
    expect(configIssue).toBeDefined();
    checkValueHostConfigResults(configIssue, expectedValueHostName);
    return configIssue;
}
export function checkValueHostConfigResults(result: ValueHostConfigCAResult | undefined,
    expectedValueHostName: string) : void {
    expect(result).toBeDefined();
    expect(result!.feature).toBe(CAFeature.valueHost);
    expect(result!.valueHostName).toBe(expectedValueHostName);
    expect(result!.config).toBeDefined();
}
export function checkPropertyCAResultsFromArray(results: Array<PropertyCAResult | ErrorCAResult>,
    index: number, expectedPropertyName: string,
    expectedPartialMessage: string | undefined,
    expectedSeverity: CAIssueSeverity | undefined): PropertyCAResult {
    let issue = results[index] as PropertyCAResult;
    expect(issue).toBeDefined();
    checkPropertyCAResults(issue, expectedPropertyName, expectedPartialMessage, expectedSeverity);
    return issue;
}
export function checkPropertyCAResults(result: PropertyCAResult | undefined,
    expectedPropertyName: string,
    expectedPartialMessage: string | undefined,
    expectedSeverity: CAIssueSeverity | undefined): PropertyCAResult {

    expect(result).toBeDefined();
    expect(result!.propertyName).toContain(expectedPropertyName);
    expect(result!.feature).toMatch(/^(Property|l10nProperty)$/);   // 
    expect(result!.severity).toBe(expectedSeverity);
    if (expectedPartialMessage === undefined)
        expect(result!.message).toBeUndefined();
    else
        expect(result!.message).toContain(expectedPartialMessage);
    return result!;
}
export function checkLookupKeyResults(lookupKeyResults: Array<LookupKeyCAResult>,
    expectedLookupKey: string): LookupKeyCAResult {

    let lkResult = lookupKeyResults.find(lk => lk.lookupKey === expectedLookupKey);
    expect(lkResult).toBeDefined();
    expect(lkResult!.feature).toBe(CAFeature.lookupKey);

    return lkResult!;
}
// function to take LookupKeyCAResult and determine if a ServiceName is present and if it has any messages
export function checkLookupKeyResultsForService(lookupKeyResults: Array<LookupKeyCAResult>,
    lookupKey: string, serviceName: ServiceName): ServiceWithLookupKeyCAResultBase {

    let lkResult = checkLookupKeyResults(lookupKeyResults, lookupKey);

    return checkLookupKeyResultForService(lkResult, serviceName);
}
export function checkLookupKeyResultForService(lkResult: LookupKeyCAResult,
    serviceName: ServiceName): ServiceWithLookupKeyCAResultBase {

    let serviceInfo = lkResult!.serviceResults.find(si => si.feature === serviceName);
    expect(serviceInfo).toBeDefined();
    expect(serviceInfo!.feature).toBe(serviceName);
    return serviceInfo!;
}
export function checkLookupKeyResultsForNoService(lookupKeyResults: Array<LookupKeyCAResult>,
    lookupKey: string, serviceName: ServiceName): void {

    let lkResult = checkLookupKeyResults(lookupKeyResults, lookupKey);

    let serviceInfo = lkResult!.serviceResults.find(si => si.feature === serviceName);
    expect(serviceInfo).toBeUndefined();
}

export function checkLookupKeyResultsForMultiClassRetrievalService(lookupKeyResult: LookupKeyCAResult,
    serviceName: ServiceName,
    expectedRequestCount: number = 0): MultiClassRetrieval {

    let serviceInfo = lookupKeyResult.serviceResults.find(si => si.feature === serviceName) as MultiClassRetrieval;

    expect(serviceInfo).toBeDefined();
    expect(serviceInfo!.feature).toBe(serviceName);   
    expect(serviceInfo!.results).toBeDefined();
    expect(serviceInfo!.results).toHaveLength(expectedRequestCount);

    return serviceInfo;
}        

export function checkServiceInfoForCultureSpecificParserRetrieval(serviceInfo: ServiceWithLookupKeyCAResultBase,
    indexIntoRequests: number,
    indexIntoMatches: number,
    expectedCultureId: string, expectedClassFound: string,
    expectedInstanceType: any): void {
    expect(serviceInfo.feature).toBe(CAFeature.parser);
    let mcr = serviceInfo as MultiClassRetrieval;
    let request = mcr.results[indexIntoRequests] as ParsersByCultureCAResult;
    expect(request).toBeDefined();
    expect(request.feature).toBe(CAFeature.parsersByCulture);
    expect(request.cultureId).toBe(expectedCultureId);
    let parserResult = request.parserResults[indexIntoMatches];
    expect(parserResult).toBeDefined();
    expect(parserResult.feature).toBe(CAFeature.parserFound);
    expect(parserResult.classFound).toBe(expectedClassFound);
    expect(parserResult.instance).toBeInstanceOf(expectedInstanceType);
}

export function checkLocalizedPropertyResultFromArray(pi: Array<PropertyCAResult | ErrorCAResult>,
    index: number,
    propertyNamePrefix: string,
    cultureTextCount: number,
    cultureId: string,
    actualCultureId: string,
    expectedCultureText: string | undefined,
    hasFallback: boolean | undefined): LocalizedPropertyCAResult {
    let result = pi[index] as LocalizedPropertyCAResult;
    expect(result).toBeDefined();
    checkLocalizedPropertyResult(result, propertyNamePrefix, cultureTextCount,
        cultureId, actualCultureId, expectedCultureText, hasFallback);
    return result;
}

export function checkLocalizedPropertyResult(pi: LocalizedPropertyCAResult,
    propertyNamePrefix: string,
    cultureTextSize: number,
    cultureId: string,
    actualCultureId: string,
    expectedCultureText: string | undefined,
    hasFallback: boolean | undefined): void {
    expect(pi.l10nPropertyName).toBe(propertyNamePrefix + 'l10n');
    expect(pi.cultureText).toBeDefined();
    expect(Object.keys(pi.cultureText)).toHaveLength(cultureTextSize);
    expect(pi.cultureText[cultureId]).toBeDefined();
    let ct = pi.cultureText[cultureId];
    if (expectedCultureText === undefined)
        expect(ct.text).toBeUndefined();
    else
        expect(ct.text).toContain(expectedCultureText);
    if (hasFallback === undefined) {
        expect(ct.severity).toBe(CAIssueSeverity.info);
        if (actualCultureId !== cultureId)
            expect(ct.message).toContain('Localized text was found');
        else
            expect(ct.message).toBeUndefined();
    }
    else {
        expect(ct.message).toContain('localization not declared in TextLocalizerService');
        if (hasFallback) {
            expect(ct.severity).toBe(CAIssueSeverity.warning);
            expect(ct.message).toContain(`found in the ${propertyNamePrefix} property`);
        }
        else {
            expect(ct.severity).toBe(CAIssueSeverity.error);
            expect(ct.message).toContain('No text will be used');
        }
    }
} 


export function checkCultureSpecificClassRetrievalFoundInService(
    serviceInfo: MultiClassRetrieval,
    expectedRequestFeature: string,
    cultureId: string, actualCultureId: string,
    expectedClassName: string,
    expectedInstanceType: any,  // expected instance type to check actual with instanceof
    ): void {
    let request = serviceInfo!.results.find(r => (r as CultureSpecificClassRetrieval).requestedCultureId === cultureId) as CultureSpecificClassRetrieval;
    expect(request).toBeDefined();
    expect(request!.feature).toBe(expectedRequestFeature);
    expect(request!.requestedCultureId).toBe(cultureId);
    expect(request!.actualCultureId).toBe(actualCultureId);
    expect(request!.severity).toBeUndefined();
    expect(request!.message).toBeUndefined();
    expect(request!.classFound).toEqual(expectedClassName);
    expect(request!.instance).toBeInstanceOf(expectedInstanceType);
}
export function checkCultureSpecificClassRetrievalNotFoundInService(
    serviceInfo: MultiClassRetrieval,
    expectedRequestFeature: string,
    expectedCultureId: string): void {
    let request: CultureSpecificClassRetrieval | undefined
        = serviceInfo!.results.find(r => (r as CultureSpecificClassRetrieval).requestedCultureId === expectedCultureId) as CultureSpecificClassRetrieval;
    expect(request).toBeDefined();
    expect(request!.feature).toBe(expectedRequestFeature);
    expect(request!.requestedCultureId).toBe(expectedCultureId);
    expect(request!.actualCultureId).toBeUndefined();
    expect(request!.severity).toBe(CAIssueSeverity.error);
    expect(request!.message).toContain('for LookupKey');
    expect(request!.classFound).toBeUndefined();
    expect(request!.instance).toBeUndefined();
}   

export function checkSyntaxError(propertyResult: PropertyCAResult,
    expectedPropertyName: string): void {

    expect(propertyResult.feature).toBe(CAFeature.property);
    expect(propertyResult.propertyName).toBe(expectedPropertyName);
    expect(propertyResult.severity).toBe(CAIssueSeverity.error);
    expect(propertyResult.message).toContain('Syntax error');
    }   
    
