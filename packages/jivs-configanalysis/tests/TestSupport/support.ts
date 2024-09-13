import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { InputValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/InputValueHost";
import { IValidationServices, ServiceName } from "@plblum/jivs-engine/build/Interfaces/ValidationServices";
import { ValueHostConfig } from "@plblum/jivs-engine/build/Interfaces/ValueHost";
import { ValueHostType } from "@plblum/jivs-engine/build/Interfaces/ValueHostFactory";
import { CultureService } from "@plblum/jivs-engine/build/Services/CultureService";
import { createValidationServicesForTesting, CvstOptions } from "@plblum/jivs-engine/build/Support/createValidationServicesForTesting";

import { SampleValues } from "../../src/SampleValues";
import { AnalysisResultsHelper } from "../../src/Analyzers/AnalysisResultsHelper";
import { AnalysisArgs, ConfigAnalysisOptions } from "../../src/Types/ConfigAnalysis";
import {
    IConditionConfigAnalyzer, IValidatorConfigAnalyzer, IValueHostConfigAnalyzer,
    ILookupKeyAnalyzer
} from "../../src/Types/Analyzers";
import {
    IConfigAnalysisResults, CAFeature, ServiceWithLookupKeyCAResultBase,
    IssueForCAResultBase, ValueHostConfigCAResult, PropertyCAResult, ErrorCAResult,
    CAIssueSeverity, LookupKeyCAResult, MultiClassRetrieval, ParsersByCultureCAResult,
    LocalizedPropertyCAResult, CultureSpecificClassRetrieval, ConditionConfigCAResult,
    ValidatorConfigCAResult, IdentifierServiceCAResult, ComparerServiceCAResult,
    ConverterServiceCAResult, FormatterServiceCAResult, FormattersByCultureCAResult,
    ParserServiceCAResult, ParserFoundCAResult
} from "../../src/Types/Results";

/**
 * 
 * @param options - When cultures = undefined, it adds 'en'.
 *  When cultures=[], it starts without cultures, expecting the caller to add them
 * @returns 
 */
export function createServices(options?: CvstOptions): IValidationServices {
    if (!options)
        options = {};
    if (!options.cultures)
        options.cultures = [{ cultureId: 'en', fallbackCultureId: null }];
    return createValidationServicesForTesting(options);
}

export function setupHelper(services: IValidationServices, options: ConfigAnalysisOptions = {}): AnalysisResultsHelper<IValidationServices> {
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
    options?: ConfigAnalysisOptions
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

export class MockAnalyzer implements ILookupKeyAnalyzer {
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
        return { ...this._result, counter: this._counter++ } as any;
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
    expectedValueHostName: string): void {
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

export function attachSeverity(result: IssueForCAResultBase, severity: CAIssueSeverity | undefined): boolean {
    if (severity &&
        [CAIssueSeverity.error, CAIssueSeverity.warning, CAIssueSeverity.info].includes(severity)) {
        result.severity = severity;
        result.message = 'message';
        return true;
    }
    return false;
}

export function createValueHostCAResult(name: string | null | undefined = 'Field1',
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
export function createPropertyCAResult(propertyName: string, severity?: CAIssueSeverity): PropertyCAResult {
    let result: PropertyCAResult = {
        feature: CAFeature.property,
        propertyName: propertyName,
    };
    attachSeverity(result, severity);
    return result;
}

export function createPropertiesWithErrorsResults(propertyNames: Array<string>): Array<PropertyCAResult> {
    let results: Array<PropertyCAResult> = [];
    propertyNames.forEach((name) => {
        let result = createPropertyCAResult(name, CAIssueSeverity.error);
        results.push(result);
    });
    return results;
}

export function createValidatorConfigResult(errorCode: string | undefined,
    propertyNamesWithErrors: Array<string> = [],
    condition?: string | ConditionConfigCAResult): ValidatorConfigCAResult {
    let condResult: ConditionConfigCAResult | undefined;
    if (condition === undefined) {
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
export function createConditionConfigResult(conditionType: string,
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
export function createLookupKeyCAResult(lookupKey: string): LookupKeyCAResult {
    return {
        feature: CAFeature.lookupKey,
        lookupKey: lookupKey,
        serviceResults: [],
        usedAsDataType: false
    };
}

export function createIdentifierServiceCAResult(severity: CAIssueSeverity): IdentifierServiceCAResult;
export function createIdentifierServiceCAResult(classFound: string): IdentifierServiceCAResult;
export function createIdentifierServiceCAResult(notFound: boolean): IdentifierServiceCAResult;
export function createIdentifierServiceCAResult(arg: CAIssueSeverity | string | boolean): IdentifierServiceCAResult {
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

export function createComparerServiceCAResult(severity: CAIssueSeverity): ComparerServiceCAResult;
export function createComparerServiceCAResult(classFound: string): ComparerServiceCAResult;
export function createComparerServiceCAResult(notFound: boolean): ComparerServiceCAResult;
export function createComparerServiceCAResult(arg: CAIssueSeverity | string | boolean): ComparerServiceCAResult {
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
export function createConverterServiceCAResult(severity: CAIssueSeverity): ConverterServiceCAResult;
export function createConverterServiceCAResult(classFound: string): ConverterServiceCAResult;
export function createConverterServiceCAResult(notFound: boolean): ConverterServiceCAResult;
export function createConverterServiceCAResult(arg: CAIssueSeverity | string | boolean): ConverterServiceCAResult {
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

export function createFormatterServiceCAResult(severity?: CAIssueSeverity): FormatterServiceCAResult {
    let result: FormatterServiceCAResult = {
        feature: CAFeature.formatter,
        results: []
    };
    attachSeverity(result, severity);
    return result;
}

export function createFormattersByCultureCAResult(requestedCultureId: string, severity: CAIssueSeverity): FormattersByCultureCAResult;
export function createFormattersByCultureCAResult(requestedCultureId: string, classFound: string): FormattersByCultureCAResult;
export function createFormattersByCultureCAResult(requestedCultureId: string, notFound: boolean): FormattersByCultureCAResult;
export function createFormattersByCultureCAResult(requestedCultureId: string, arg: CAIssueSeverity | string | boolean): FormattersByCultureCAResult {
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

export function createParserServiceCAResult(severity?: CAIssueSeverity): ParserServiceCAResult {
    let result: ParserServiceCAResult = {
        feature: CAFeature.parser,
        results: []
    };
    attachSeverity(result, severity);
    return result;
}

export function createParsersByCultureCAResult(cultureId: string): ParsersByCultureCAResult;
export function createParsersByCultureCAResult(cultureId: string, severity: CAIssueSeverity): ParsersByCultureCAResult;
export function createParsersByCultureCAResult(cultureId: string, notFound: boolean): ParsersByCultureCAResult;
export function createParsersByCultureCAResult(cultureId: string, arg?: CAIssueSeverity | boolean): ParsersByCultureCAResult {
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

export function createParserFoundCAResult(classFound: string): ParserFoundCAResult {
    let result: ParserFoundCAResult = {
        feature: CAFeature.parserFound,
        classFound: classFound
    };
    return result;
}

export function createBasicConfigAnalysisResults(): IConfigAnalysisResults {
    return {
        cultureIds: ['en'],
        valueHostNames: [],
        valueHostResults: [],
        lookupKeyResults: []
    };
}

// Create a ConfigAnalysisResults object with 2 of every type of result.
export function createExtensiveConfigAnalysisResults(): IConfigAnalysisResults {
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
    let enCultureFormatterIntegerLK = createFormattersByCultureCAResult('en', 'IntegerFormatter');
    let frCultureFormatterIntegerLK = createFormattersByCultureCAResult('fr', CAIssueSeverity.error);
    formatterIntegerLK.results = [enCultureFormatterIntegerLK, frCultureFormatterIntegerLK];
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