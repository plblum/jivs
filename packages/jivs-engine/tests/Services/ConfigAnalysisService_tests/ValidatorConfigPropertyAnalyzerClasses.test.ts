import { NumberFormatter } from "../../../src/DataTypes/DataTypeFormatters";
import { LookupKey } from "../../../src/DataTypes/LookupKeys";
import { PropertyCAResult, CAIssueSeverity, LocalizedPropertyCAResult, ValidatorConfigCAResult, IConfigAnalysisResults, validatorFeature, formattersByCultureFeature } from "../../../src/Interfaces/ConfigAnalysisService";
import { IValidationServices, ServiceName } from "../../../src/Interfaces/ValidationServices";
import { ValidatorConfig } from "../../../src/Interfaces/Validator";
import { ValidatorsValueHostBaseConfig } from "../../../src/Interfaces/ValidatorsValueHostBase";
import { AnalysisResultsHelper } from "../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper";
import { DataTypeFormatterLookupKeyAnalyzer } from "../../../src/Services/ConfigAnalysisService/DataTypeFormatterLookupKeyAnalyzer";
import { DataTypeFormatterService } from "../../../src/Services/DataTypeFormatterService";
import { checkPropertyCAResultsFromArray, checkCultureSpecificClassRetrievalFoundInService, checkCultureSpecificClassRetrievalNotFoundInService, checkLocalizedPropertyResultFromArray, checkLookupKeyResults, checkLookupKeyResultsForMultiClassRetrievalService, checkSyntaxError, createServices, setupHelper } from "./support";
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from "../../../src/Services/ConfigAnalysisService/ValidatorConfigPropertyAnalyzerClasses";

function createServicesForTheseTests(addCultures: Array<string> = ['en']): IValidationServices {
    let services = createServices(addCultures);
    let dtfs = new DataTypeFormatterService();
    services.dataTypeFormatterService = dtfs;
    dtfs.services = services;

    return services;
}
function setupHelperForTheseTests(services: IValidationServices): AnalysisResultsHelper<IValidationServices>
{
    let helper = setupHelper(services);
    helper.registerLookupKeyAnalyzer(ServiceName.formatter,
        new DataTypeFormatterLookupKeyAnalyzer(helper.analysisArgs)
    );    
    return helper;
}        
function createValidatorConfigResults(): ValidatorConfigCAResult {
    let vc: ValidatorConfig = {
        conditionConfig: { conditionType: 'Test' }
    };                
    return {
        feature: validatorFeature,
        properties: [],
        config: vc,
        errorCode: null!
    };
}
function createValueHostConfig(valC: ValidatorConfig): ValidatorsValueHostBaseConfig {
    return {
        name: 'testValueHost',
        dataType: LookupKey.Number,
        validatorConfigs: [valC]
    };
}    
describe('AllMessagePropertiesConfigPropertyAnalyzer class', () => {


    function executeFunction(services: IValidationServices,
        validatorConfig: Partial<ValidatorConfig>): {
            argResults: IConfigAnalysisResults,
            vcResults: ValidatorConfigCAResult
        }
    {
        let helper = setupHelperForTheseTests(services);
        let vcResults = createValidatorConfigResults();
        vcResults.config = { ...vcResults.config, ...validatorConfig };
        let vhc = createValueHostConfig(vcResults.config);
        let testItem = new AllMessagePropertiesConfigPropertyAnalyzer();
        testItem.analyze(vcResults.config, vcResults, vhc, helper);
        return { argResults: helper.results, vcResults: vcResults };
    }
    describe('errorMessage property', () => {
        describe('tokens in errorMessage', () => {
            // errorMessage is a string with no tokens
            test('should not add any lookupKeyResults when errorMessage is a string with no tokens', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { errorMessage: 'This is a test message' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(0);
            });

            // errorMessage is a string with a single token
            test('should add a lookupKeyResults when errorMessage is a string with a single token', () => {
                let services = createServicesForTheseTests();
                services.dataTypeFormatterService.register(new NumberFormatter(null));

                let results = executeFunction(services, { errorMessage: '{Token:Number}' });
                expect(results.vcResults.properties).toHaveLength(0);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, LookupKey.Number);
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);
                
            });
            // token has a custom lookup key that has no compatible Formatter reports Not found error

            test('token has a custom lookup key that has no compatible Formatter reports Not found error', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { errorMessage: '{Token:Custom}' });
                expect(results.vcResults.properties).toHaveLength(0);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, 'Custom');
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalNotFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en');
            });

            test('invalid token results in adding to ValidatorConfigCAResult.properties', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { errorMessage: '{Token:LookupKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                checkSyntaxError(prop, 'errorMessage');
            });

            // when errorMessage is a function, the only action is to add an info message "property is a function"
            test('should add an info message when errorMessage is a function', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { errorMessage: () => 'This is a test message' });
                expect(results.vcResults.properties).toHaveLength(1);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                expect(prop.severity).toBe(CAIssueSeverity.info);
                expect(prop.message).toBe('The errorMessage property is a function. It will not be analyzed.');
            });
            // same for summaryMessage
            test('should add an info message when summaryMessage is a function', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { summaryMessage: () => 'This is a test message' });
                expect(results.vcResults.properties).toHaveLength(1);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                expect(prop.severity).toBe(CAIssueSeverity.info);
                expect(prop.message).toBe('The summaryMessage property is a function. It will not be analyzed.');
            });
        });

    });

    describe('summaryMessage property', () => {
        describe('tokens in summaryMessage', () => {

            // summaryMessage is a string with no tokens
            test('should not add any lookupKeyResults when summaryMessage is a string with no tokens', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { summaryMessage: 'This is a test message' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(0);

            });

            // summaryMessage is a string with a single token
            test('should add a lookupKeyResults when summaryMessage is a string with a single token', () => {
                let services = createServicesForTheseTests();
                services.dataTypeFormatterService.register(new NumberFormatter(null));

                let results = executeFunction(services, { summaryMessage: '{Token:Number}' });
                expect(results.vcResults.properties).toHaveLength(0);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, LookupKey.Number);
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);

            });
            // token has a custom lookup key that has no compatible Formatter reports Not found error
            test('token has a custom lookup key that has no compatible Formatter reports Not found error', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { summaryMessage: '{Token:Custom}' });
                expect(results.vcResults.properties).toHaveLength(0);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, 'Custom');
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalNotFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en');
            });
            test('invalid token results in adding to ValidatorConfigCAResult.properties', () => {
                let services = createServicesForTheseTests();
   
                let results = executeFunction(services, { summaryMessage: '{Token:LookupKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                checkSyntaxError(prop, 'summaryMessage');

            });
        });    
    });
    describe('errorMessagel10n property', () => {
        describe('tokens in errorMessage110n', () => {

            // these will have only one culture, 'en', as we've tested culture support elsewhere
            // TextLocalizerService will have supporting messages reflecting the number of and type of tokens desired.
            // errorMessagel10n is a string with no tokens
            test('should not add any lookupKeyResults when errorMessagel10n is a string with no tokens.', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: 'This is a test message' });

                let results = executeFunction(services, { errorMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);

                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'errorMessage', 1, 'en', 'en', 'This is a test message', undefined);

            });
            // same with the errorMessage property also defined to different text
            // demonstrates that this code doesn't look at errorMessage
            test('should not add any lookupKeyResults when errorMessagel10n is a string with no tokens and errorMessage is a string with tokens', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: 'This is a test message' });

                let results = executeFunction(services, { errorMessage: 'Some other text', errorMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'errorMessage', 1, 'en', 'en', 'This is a test message', undefined);
            
            });
            // with null
            test('should not add any lookupKeyResults when errorMessagel10n is null', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { errorMessagel10n: null });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(0);

            });
            // with a valid token
            test('should add a lookupKeyResults when errorMessagel10n is a string with a single token', () => {
                let services = createServicesForTheseTests();
                services.dataTypeFormatterService.register(new NumberFormatter(null));
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Number}' });

                let results = executeFunction(services, { errorMessagel10n: 'l10nKey' });
                expect(results.vcResults.properties).toHaveLength(1);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, LookupKey.Number);
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'errorMessage', 1, 'en', 'en', '{Token:Number}', undefined);
            });
            // with custom token without a compatible Formatter
            test('token has a custom lookup key that has no compatible Formatter reports Not found error', () => {
                let services = createServicesForTheseTests();

                let helper = setupHelperForTheseTests(services);
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Custom}' });

                let results = executeFunction(services, { errorMessagel10n: 'l10nKey' });
                expect(results.vcResults.properties).toHaveLength(1);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, 'Custom');
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalNotFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en');
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'errorMessage', 1, 'en', 'en', '{Token:Custom}', undefined);                
            });
            test('invalid token results in adding to ValidatorConfigCAResult.properties', () => {
                let services = createServicesForTheseTests();
                let helper = setupHelperForTheseTests(services);
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Bad' });

                let results = executeFunction(services, { errorMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(2);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                checkSyntaxError(prop, 'errorMessagel10n');
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 1, 'errorMessage', 1, 'en', 'en', '{Token:Bad', undefined);                

            });
        });    

    });
    describe('summaryMessagel10n property', () => {
        describe('tokens in summaryMessagel10n', () => {

            // these will have only one culture, 'en', as we've tested culture support elsewhere
            // TextLocalizerService will have supporting messages reflecting the number of and type of tokens desired.
            // summaryMessagel10n is a string with no tokens
            test('should not add any lookupKeyResults when summaryMessagel10n is a string with no tokens.', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: 'This is a test message' });

                let results = executeFunction(services, { summaryMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'summaryMessage', 1, 'en', 'en', 'This is a test message', undefined);                
            });
            // same with the errorMessage property also defined to different text
            // demonstrates that this code doesn't look at errorMessage
            test('should not add any lookupKeyResults when summaryMessagel10n is a string with no tokens and errorMessage is a string with tokens', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: 'This is a test message' });

                let results = executeFunction(services, { summaryMessage: 'Some other text', summaryMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(1);
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'summaryMessage', 1, 'en', 'en', 'This is a test message', undefined);                   
            });
            // with null
            test('should not add any lookupKeyResults when summaryMessagel10n is null', () => {
                let services = createServicesForTheseTests();

                let results = executeFunction(services, { summaryMessagel10n: null });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(0);
            });
            // with a valid token
            test('should add a lookupKeyResults when summaryMessagel10n is a string with a single token', () => {
                let services = createServicesForTheseTests();
                services.dataTypeFormatterService.register(new NumberFormatter(null));
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Number}' });
 
                let results = executeFunction(services, { summaryMessagel10n: 'l10nKey' });
                expect(results.vcResults.properties).toHaveLength(1);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, LookupKey.Number);
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en', 'en', 'NumberFormatter', NumberFormatter);
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'summaryMessage', 1, 'en', 'en', '{Token:Number}', undefined);                   
            });
            // with custom token without a compatible Formatter
            test('token has a custom lookup key that has no compatible Formatter reports Not found error', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Custom}' });

                let results = executeFunction(services, { summaryMessagel10n: 'l10nKey' });
                expect(results.vcResults.properties).toHaveLength(1);
                expect(results.argResults.lookupKeyResults).toHaveLength(1);
                let lkResult = checkLookupKeyResults(results.argResults.lookupKeyResults, 'Custom');
                let serviceInfo = checkLookupKeyResultsForMultiClassRetrievalService(
                    lkResult, ServiceName.formatter, 1);
                checkCultureSpecificClassRetrievalNotFoundInService(
                    serviceInfo, formattersByCultureFeature, 'en');
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 0, 'summaryMessage', 1, 'en', 'en', '{Token:Custom}', undefined);                   
            });
            test('invalid token results in adding to ValidatorConfigCAResult.properties', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('l10nKey',
                    { en: '{Token:Bad' });

                let results = executeFunction(services, { summaryMessagel10n: 'l10nKey' });
                expect(results.argResults.lookupKeyResults).toHaveLength(0);
                expect(results.vcResults.properties).toHaveLength(2);
                let prop = results.vcResults.properties[0] as PropertyCAResult;
                checkSyntaxError(prop, 'summaryMessagel10n');
                checkLocalizedPropertyResultFromArray(
                    results.vcResults.properties, 1, 'summaryMessage', 1, 'en', 'en', '{Token:Bad', undefined);                   
            });
        });
        describe('localization results in LocalizedPropertyCAResult objects', () => {
            // these use helper.checkLocalization to check LocalizedPropertyCAResult objects.
            // It uses multiple cultures.
            // It has TextLocalizerService with supporting messages reflecting the
            // messages for multiple cultures.
            // NOTE: We have tested the underlying checkLocalization function elsewhere
            test('3 cultures, all with messages in TextLocalizerService creates 2 LocalizedPropertyResults for errormessage and summarymessage', () => {
                let services = createServicesForTheseTests();
                services.textLocalizerService.register('eml10nKey',
                    {
                        en: 'This is a test message',
                        fr: 'Ceci est un message de test',
                        es: 'Este es un mensaje de prueba'
                    });
                services.textLocalizerService.register('seml10nKey',
                    {
                        en: 'SEM This is a test message',
                        fr: 'SEM Ceci est un message de test',
                        es: 'SEM Este es un mensaje de prueba'
                    });                        
                services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
                services.cultureService.register({ cultureId: 'fr', fallbackCultureId: null });
                services.cultureService.register({ cultureId: 'es', fallbackCultureId: null });

                let results = executeFunction(services, { errorMessagel10n: 'eml10nKey', summaryMessagel10n: 'seml10nKey' });
                expect(results.vcResults.properties).toHaveLength(2);
                let prop = results.vcResults.properties[0] as LocalizedPropertyCAResult;
                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 0, 'errorMessage',
                    3, 'en', 'en', 'This is a test message', undefined);
                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 0, 'errorMessage',
                    3, 'fr', 'fr', 'Ceci est un message de test', undefined);
                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 0, 'errorMessage',
                    3, 'es', 'es', 'Este es un mensaje de prueba', undefined);

                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 1, 'summaryMessage',
                    3, 'en', 'en', 'SEM This is a test message', undefined);
                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 1, 'summaryMessage',
                    3, 'fr', 'fr', 'SEM Ceci est un message de test', undefined);
                checkLocalizedPropertyResultFromArray(results.vcResults.properties, 1, 'summaryMessage',
                    3, 'es', 'es', 'SEM Este es un mensaje de prueba', undefined);

            });
        });                        
    });
});
describe('ConditionCreatorConfigPropertyAnalyzer class', () => {
    function executeFunction(services: IValidationServices,
        validatorConfig: Partial<ValidatorConfig>): {
            argResults: IConfigAnalysisResults,
            vcResults: ValidatorConfigCAResult
        }
    {
        let helper = setupHelperForTheseTests(services);
        let vcResults = createValidatorConfigResults();
        vcResults.config = { ...vcResults.config, ...validatorConfig };
        let vhc = createValueHostConfig(vcResults.config);
        let testItem = new ConditionCreatorConfigPropertyAnalyzer();
        testItem.analyze(vcResults.config, vcResults, vhc, helper);
        return { argResults: helper.results, vcResults: vcResults };
    }    
    /**
     * If validatorConfig.conditionCreator is supplied, confirm it is a function or its an error.
     * Confirm that conditionConfig is not also assigned, or its an error.
     */
    test('should not add a property when conditionCreator is a function and conditionConfig is null', () => {
        let services = createServicesForTheseTests();

        let results = executeFunction(services, { conditionCreator: () => { return null; }, conditionConfig: null! });
        expect(results.vcResults.properties).toHaveLength(0);
    });
    test('should add a property when conditionCreator is a function and conditionConfig is not null', () => {
        let services = createServicesForTheseTests();

        let results = executeFunction(services, {
            conditionCreator: () => { return null; },
            conditionConfig: { conditionType: 'Test' }
        });
        expect(results.vcResults.properties).toHaveLength(1);
        checkPropertyCAResultsFromArray(results.vcResults.properties, 0,
            'conditionCreator', 
            'Cannot supply both conditionCreator and conditionConfig',
            CAIssueSeverity.error);
        
    });
    test('should add a property when conditionCreator is not a function and conditionConfig is null', () => {
        let services = createServicesForTheseTests();

        let results = executeFunction(services, {
            conditionCreator: 100 as any, // not a function
            conditionConfig: null!
         });
        expect(results.vcResults.properties).toHaveLength(1);
        checkPropertyCAResultsFromArray(results.vcResults.properties, 0,
            'conditionCreator', 
            'Must be a function.',
            CAIssueSeverity.error);
    });
});