import { IConfigAnalysisResults, ConfigAnalysisServiceOptions, AnalysisArgs, IConditionConfigAnalyzer, IValidatorConfigAnalyzer, IValueHostConfigAnalyzer, ValueHostConfigResults, ConfigIssueSeverity, ConfigPropertyResult, ConfigErrorResult, LocalizedPropertyResult, LookupKeyIssue, LookupKeyInfo, MultiClassRetrieval, LookupKeyServiceInfoBase, ParserClassRetrieval, OneClassRetrieval, ConfigResultMessageBase, ILookupKeyAnalyzer, CultureSpecificClassRetrieval } from "../../../src/Interfaces/ConfigAnalysisService";
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
        lookupKeysInfo: [],
        lookupKeysIssues: [],
        conditionsInfo: [],
        configIssues: [],
        otherIssues: []
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
        vhConfigs: valueHostConfigs,
        conditionConfigAnalyzer: null!
    };
    mockAnalysisArgs.results.cultureIds = services.cultureService.availableCultures();
    mockAnalysisArgs.conditionConfigAnalyzer = <IConditionConfigAnalyzer<any>>{
        analyze: (conditionConfig, valueHostConfig, existingResults) => {
            return {
                feature: 'Condition',
                conditionType: conditionConfig.conditionType,
                properties: [],
                config: conditionConfig
            }
        }
    };
    mockAnalysisArgs.validatorConfigAnalyzer = <IValidatorConfigAnalyzer>{
        
        analyze: (validatorConfig, valueHostConfig, existingResults) => {
            return {
                feature: 'Validator',
                properties: [],
                config: validatorConfig,
                errorCode: 'anything'
            }
        }
    };
    mockAnalysisArgs.valueHostConfigAnalyzer = <IValueHostConfigAnalyzer<any>>{
        analyze: (valueHostConfig, alt, existingResults) => {
            return {
                feature: 'ValueHost',
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
        result: LookupKeyServiceInfoBase) {
        this._feature = feature;
        if (result.feature === undefined)
            result.feature = feature;
        let msg = result as ConfigResultMessageBase;
        if (msg.message === undefined)
            msg.message = 'test' + feature;
        this._result = result;

    }
    private _counter: number = 0;
    private _result: LookupKeyServiceInfoBase;
    private _feature: ServiceName | 'DataType';
    protected get feature(): ServiceName | 'DataType' {
        return this._feature;
    }
    analyze(key: string, valueHostConfig: ValueHostConfig | null): LookupKeyServiceInfoBase {
        return { ...this._result, counter : this._counter++ } as any;
    }
}
export class MockAnalyzerWithFallback extends MockAnalyzer {
    constructor(feature: ServiceName | 'DataType', rejectedLookupKey: string,
        result: LookupKeyServiceInfoBase) {
        super(feature, result);
        this._rejectedLookupKey = rejectedLookupKey;

    }

    private _rejectedLookupKey: string;

    analyze(key: string, valueHostConfig: ValueHostConfig | null): LookupKeyServiceInfoBase {
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
export function checkValueHostConfigResultsInArray(results: Array<ValueHostConfigResults>,
    index: number,
    expectedValueHostName: string): ValueHostConfigResults | undefined {
    let configIssue = results[index];
    expect(configIssue).toBeDefined();
    checkValueHostConfigResults(configIssue, expectedValueHostName);
    return configIssue;
}
export function checkValueHostConfigResults(result: ValueHostConfigResults | undefined,
    expectedValueHostName: string) : void {
    expect(result).toBeDefined();
    expect(result!.feature).toBe('ValueHost');
    expect(result!.valueHostName).toBe(expectedValueHostName);
    expect(result!.config).toBeDefined();
}
export function checkConfigPropertyResultsFromArray(results: Array<ConfigPropertyResult | ConfigErrorResult>,
    index: number, expectedPropertyName: string,
    expectedPartialMessage: string | undefined,
    expectedSeverity: ConfigIssueSeverity | undefined): ConfigPropertyResult {
    let issue = results[index] as ConfigPropertyResult;
    expect(issue).toBeDefined();
    checkConfigPropertyResults(issue, expectedPropertyName, expectedPartialMessage, expectedSeverity);
    return issue;
}
export function checkConfigPropertyResults(result: ConfigPropertyResult | undefined,
    expectedPropertyName: string,
    expectedPartialMessage: string | undefined,
    expectedSeverity: ConfigIssueSeverity | undefined): ConfigPropertyResult {

    expect(result).toBeDefined();
    expect(result!.propertyName).toContain(expectedPropertyName);
    expect(result!.feature).toMatch(/^(Property|l10nProperties)$/);   // 
    expect(result!.severity).toBe(expectedSeverity);
    if (expectedPartialMessage === undefined)
        expect(result!.message).toBeUndefined();
    else
        expect(result!.message).toContain(expectedPartialMessage);
    return result!;
}        
export function checkLookupKeyIssue(allResults: IConfigAnalysisResults,
    index: number, expectedLookupKey: string, expectedPartialMessage: string): LookupKeyIssue {
    let issue = allResults.lookupKeysIssues[index];
    expect(issue).toBeDefined();
    expect(issue.feature).toBe('LookupKey');
    expect(issue.lookupKey).toBe(expectedLookupKey);
    expect(issue.message).toContain(expectedPartialMessage);
    return issue;
}
export function checkLookupKeyInfo(lookupKeysInfo: Array<LookupKeyInfo>,
    expectedLookupKey: string): LookupKeyInfo {

    let lkInfo = lookupKeysInfo.find(lk => lk.lookupKey === expectedLookupKey);
    expect(lkInfo).toBeDefined();
    expect(lkInfo!.feature).toBe('LookupKey');

    return lkInfo!;
}
// function to take LookupKeyInfo and determine if a ServiceName is present and if it has any messages
export function checkLookupKeysInfoForService(lookupKeysInfo: Array<LookupKeyInfo>,
    lookupKey: string, serviceName: ServiceName): LookupKeyServiceInfoBase {

    let lkInfo = checkLookupKeyInfo(lookupKeysInfo, lookupKey);

    return checkLookupKeyInfoForService(lkInfo, serviceName);
}
export function checkLookupKeyInfoForService(lkInfo: LookupKeyInfo,
    serviceName: ServiceName): LookupKeyServiceInfoBase {

    let serviceInfo = lkInfo!.services.find(si => si.feature === serviceName);
    expect(serviceInfo).toBeDefined();
    expect(serviceInfo!.feature).toBe(serviceName);
    return serviceInfo!;
}
export function checkLookupKeyInfoForNoService(lookupKeysInfo: Array<LookupKeyInfo>,
    lookupKey: string, serviceName: ServiceName): void {

    let lkInfo = checkLookupKeyInfo(lookupKeysInfo, lookupKey);

    let serviceInfo = lkInfo!.services.find(si => si.feature === serviceName);
    expect(serviceInfo).toBeUndefined();
}

export function checkLookupKeyInfoForMultiClassRetrievalService(lookupKeyInfo: LookupKeyInfo,
    serviceName: ServiceName,
    expectedRequestCount: number = 0): MultiClassRetrieval {

    let serviceInfo = lookupKeyInfo.services.find(si => si.feature === serviceName) as MultiClassRetrieval;

    expect(serviceInfo).toBeDefined();
    expect(serviceInfo!.feature).toBe(serviceName);   
    expect(serviceInfo!.requests).toBeDefined();
    expect(serviceInfo!.requests).toHaveLength(expectedRequestCount);

    return serviceInfo;
}        

export function checkServiceInfoForParserClassRetrieval(serviceInfo: LookupKeyServiceInfoBase,
    indexIntoRequests: number,
    indexIntoMatches: number,
    expectedCultureId: string, expectedClassFound: string,
    expectedInstanceType: any): void {
    expect(serviceInfo.feature).toBe(ServiceName.parser);
    let mcr = serviceInfo as MultiClassRetrieval;
    let request = mcr.requests[indexIntoRequests] as ParserClassRetrieval;
    expect(request).toBeDefined();
    expect(request.cultureId).toBe(expectedCultureId);
    let match = request.matches[indexIntoMatches];
    expect(match).toBeDefined();
    expect(match.feature).toBe(ServiceName.parser);
    expect(match.classFound).toBe(expectedClassFound);
    expect(match.instance).toBeInstanceOf(expectedInstanceType);
}

export function checkLocalizedPropertyResultFromArray(pi: Array<ConfigPropertyResult | ConfigErrorResult>,
    index: number,
    propertyNamePrefix: string,
    cultureTextCount: number,
    cultureId: string,
    actualCultureId: string,
    expectedCultureText: string | undefined,
    hasFallback: boolean | undefined): LocalizedPropertyResult {
    let result = pi[index] as LocalizedPropertyResult;
    expect(result).toBeDefined();
    checkLocalizedPropertyResult(result, propertyNamePrefix, cultureTextCount,
        cultureId, actualCultureId, expectedCultureText, hasFallback);
    return result;
}

export function checkLocalizedPropertyResult(pi: LocalizedPropertyResult,
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
        expect(ct.severity).toBe(ConfigIssueSeverity.info);
        if (actualCultureId !== cultureId)
            expect(ct.message).toContain('Localized text was found');
        else
            expect(ct.message).toBeUndefined();
    }
    else {
        expect(ct.message).toContain('localization not declared in TextLocalizerService');
        if (hasFallback) {
            expect(ct.severity).toBe(ConfigIssueSeverity.warning);
            expect(ct.message).toContain(`found in the ${propertyNamePrefix} property`);
        }
        else {
            expect(ct.severity).toBe(ConfigIssueSeverity.error);
            expect(ct.message).toContain('No text will be used');
        }
    }
} 


export function checkCultureSpecificClassRetrievalFoundInService(serviceInfo: MultiClassRetrieval,
    cultureId: string, actualCultureId: string,
    expectedClassName: string,
    expectedInstanceType: any,  // expected instance type to check actual with instanceof
    ): void {
    let request = serviceInfo!.requests.find(r => (r as CultureSpecificClassRetrieval).requestedCultureId === cultureId) as CultureSpecificClassRetrieval;
    expect(request).toBeDefined();
    expect(request!.feature).toBe(serviceInfo.feature);
    expect(request!.requestedCultureId).toBe(cultureId);
    expect(request!.actualCultureId).toBe(actualCultureId);
    expect(request!.severity).toBeUndefined();
    expect(request!.message).toBeUndefined();
    expect(request!.classFound).toEqual(expectedClassName);
    expect(request!.instance).toBeInstanceOf(expectedInstanceType);
}
export function checkCultureSpecificClassRetrievalNotFoundInService(serviceInfo: MultiClassRetrieval,
    expectedCultureId: string): void {
    let request: CultureSpecificClassRetrieval | undefined
        = serviceInfo!.requests.find(r => (r as CultureSpecificClassRetrieval).requestedCultureId === expectedCultureId) as CultureSpecificClassRetrieval;
    expect(request).toBeDefined();
    expect(request!.feature).toBe(serviceInfo.feature);
    expect(request!.requestedCultureId).toBe(expectedCultureId);
    expect(request!.actualCultureId).toBeUndefined();
    expect(request!.severity).toBe(ConfigIssueSeverity.error);
    expect(request!.message).toContain('for LookupKey');
    expect(request!.classFound).toBeUndefined();
    expect(request!.instance).toBeUndefined();
}   

export function checkSyntaxError(propertyResult: ConfigPropertyResult,
    expectedPropertyName: string): void {

    expect(propertyResult.feature).toBe('Property');
    expect(propertyResult.propertyName).toBe(expectedPropertyName);
    expect(propertyResult.severity).toBe(ConfigIssueSeverity.error);
    expect(propertyResult.message).toContain('Syntax error');
}    