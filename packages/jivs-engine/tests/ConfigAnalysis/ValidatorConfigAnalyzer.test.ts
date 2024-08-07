import {
    ConditionConfigCAResult,
    CAIssueSeverity, IConditionConfigAnalyzer, IValidatorConfigPropertyAnalyzer, ValidatorConfigCAResult,
    CAFeature
} from '../../src/Interfaces/ConfigAnalysisService';
import { ValidatorConfigAnalyzer } from '../../src/ConfigAnalysis/ValidatorConfigAnalyzer';
import { AnalysisResultsHelper } from '../../src/ConfigAnalysis/AnalysisResultsHelper';
import { IValidationServices } from '../../src/Interfaces/ValidationServices';
import { createServices, checkPropertyCAResultsFromArray, setupHelper, checkLocalizedPropertyResultFromArray } from './support';
import { ValidatorConfig } from '../../src/Interfaces/Validator';
import { ValueHostConfig } from '../../src/Interfaces/ValueHost';
import { ConditionConfig } from '../../src/Interfaces/Conditions';
import { AllMessagePropertiesConfigPropertyAnalyzer, ConditionCreatorConfigPropertyAnalyzer } from '../../src/ConfigAnalysis/ValidatorConfigPropertyAnalyzerClasses';

class TestValidatorConfigPropertyAnalyzer implements IValidatorConfigPropertyAnalyzer {
    public analyze(config: ValidatorConfig, results: ValidatorConfigCAResult): void {
        this.ranCount++;
    }
    public ranCount: number = 0;
}

/**
 * Mock of ValidatorConfigAnalyzer
 */
class MockConditionConfigAnalyzer implements IConditionConfigAnalyzer<IValidationServices> {
    analyze(config: ConditionConfig, valueHostConfig: ValueHostConfig | null, existingResults: ConditionConfigCAResult[]): ConditionConfigCAResult {
        this.ranCount++;
        return <ConditionConfigCAResult>{
            feature: CAFeature.condition,
            conditionType: config.conditionType ?? '[Missing]',
            config: config,
            properties: []
        };
    }

    public ranCount: number = 0;
    
}
function setupHelperForTheseTests(services: IValidationServices): AnalysisResultsHelper<IValidationServices>
{
    let helper = setupHelper(services);
    helper.analysisArgs.conditionConfigAnalyzer = new MockConditionConfigAnalyzer();
    return helper;
}        
function ranCountOfPropertyAnalyzers(propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer>): number {
    let ranCount = 0;
    propertyAnalyzers.forEach(pa => ranCount += (pa as TestValidatorConfigPropertyAnalyzer).ranCount);
    return ranCount;
}   
function ranCountOfMockConditionConfigAnalyzer(helper: AnalysisResultsHelper<IValidationServices>): number {
    return (helper.analysisArgs.conditionConfigAnalyzer as MockConditionConfigAnalyzer).ranCount;
} 
describe('ValidatorConfigAnalyzer', () => {
    // test with 0 property analyzers, 1 test config, the test config results should be initialized correctly and there are no property results
    describe('init results and errorCode assignment', () => {
        // testConfig.errorCode='TESTEC', a valid error code, which will not change results.properties
        it('with ValidatorConfig.errorCode="TESTEC" and conditionConfig = null, should initialize results correctly, result.errorCode=TESTEC and no changes to results.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: 'TESTEC',
                conditionConfig: null,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('TESTEC');
            expect(results.properties).toHaveLength(0);
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
        it('with ValidatorConfig.errorCode=undefined and conditionConfig = null, should initialize results correctly, result.errorCode=[Missing] and error message in result object', () => {
            const testConfig = <ValidatorConfig>{
                conditionConfig: null!,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('[Missing]');
            expect(results.message).toContain('Must supply an error code.');
            expect(results.severity).toBe(CAIssueSeverity.error);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });
        // same but errorCode=''
        it('with ValidatorConfig.errorCode="" and conditionConfig = null, should initialize results correctly, result.errorCode=[Missing] and error in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: '',
                conditionConfig: null!,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('[Missing]');
            expect(results.message).toContain('Must supply an error code.');
            expect(results.severity).toBe(CAIssueSeverity.error);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });
        // same but errorCode= '   '
        it('with ValidatorConfig.errorCode="   " and conditionConfig = null, should initialize results correctly, result.errorCode=[Missing] and error in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: '   ',
                conditionConfig: null!,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('[Missing]');
            expect(results.message).toContain('Must supply an error code.');
            expect(results.severity).toBe(CAIssueSeverity.error);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });

        // errorCode has whitespace: ' TESTEC '. Reports error in results.properties
        it('with ValidatorConfig.errorCode=" TESTEC " and conditionConfig = null, should initialize results correctly, result.errorCode="TESTEC" and whitespace error in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: ' TESTEC ',
                conditionConfig: null!,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('TESTEC');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'errorCode', 'Error code must not contain whitespace.', CAIssueSeverity.error);
        });
        // errorCode is not assigned and conditionConfig has conditionType. results.errorCode is set to conditionType and info message in results.properties
        it('with ValidatorConfig.errorCode=undefined and conditionConfig.conditionType="TestCondition", should initialize results correctly, result.errorCode="TestCondition" and info in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                conditionConfig: { conditionType: 'TestCondition' },
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeDefined();
            expect(results.errorCode).toBe('TestCondition');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'errorCode', 'Using the conditionType "TestCondition"', CAIssueSeverity.info);
        });
        // same with errorCode=null
        it('with ValidatorConfig.errorCode=null and conditionConfig.conditionType="TestCondition", should initialize results correctly, result.errorCode="TestCondition" and info in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: null!,
                conditionConfig: { conditionType: 'TestCondition' },
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeDefined();
            expect(results.errorCode).toBe('TestCondition');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'errorCode', 'Using the conditionType "TestCondition"', CAIssueSeverity.info);
        });

        // same with errorCode=''
        it('with ValidatorConfig.errorCode="" and conditionConfig.conditionType="TestCondition", should initialize results correctly, result.errorCode="TestCondition" and info in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: '',
                conditionConfig: { conditionType: 'TestCondition' },
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeDefined();
            expect(results.errorCode).toBe('TestCondition');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'errorCode', 'Using the conditionType "TestCondition"', CAIssueSeverity.info);
        });
        // errorCode=undefined, conditionConfig=null, and conditionCreator is assigned to a function. results.errorCode is set to '[Unknown at this time]' and warning in results.properties
        it('with ValidatorConfig.errorCode=undefined, conditionConfig=null, and conditionCreator assigned, should initialize results correctly, result.errorCode="[Unknown at this time]" and warning in result.properties', () => {
            const testConfig = <ValidatorConfig>{
                conditionConfig: null!,
                conditionCreator: () => { return {} as any; },
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.conditionResult).toBeUndefined();
            expect(results.errorCode).toBe('[Unknown at this time]');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'errorCode', 'conditionCreator is setup and will supply an error code when used.', CAIssueSeverity.warning);
        });
        // with an invalid validatorType="TEST", because its not in the ValidatorFactory,
        // results gets error message "The validatorType property is not valid"
        it('with validatorType="TEST", should initialize results correctly, result contains message and error', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: 'TESTEC',
                validatorType: 'TEST',
                conditionConfig: null!,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(CAFeature.validator);
            expect(results.message).toContain('The validatorType property is not valid');
            expect(results.severity).toBe(CAIssueSeverity.error);
        });
    });

    describe('duplicate errorCode', () => {
        // two ValidatorConfigs with different errorCodes should not report an error
        it('should not report duplicate config error after two ValidatorConfigs are added with different errorCode values', () => {
            const testConfig1 = { errorCode: 'TestEC1', conditionConfig: null };
            const testConfig2 = { errorCode: 'TestEC2', conditionConfig: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValidatorConfigCAResult> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(0);
        });

        // with no property analyzers, adding the same named config to existing results should result in a duplicate error
        it('should report duplicate config error after second ValidatorConfig is added with identical errorCode value', () => {
            const testConfig1 = { errorCode: 'TestEC', conditionConfig: null };
            const testConfig2 = { errorCode: 'TestEC', conditionConfig: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValidatorConfigCAResult> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results2.properties, 0,
                'errorCode',
                `Duplicate error code "${testConfig1.errorCode}". All must be unique.`, CAIssueSeverity.error);
        });

        // same but case insensitive duplicate match
        it('should report duplicate config error after the same-named config is added with a case insensitive match', () => {
            const testConfig1 = { errorCode: 'TestEC', conditionConfig: null };
            const testConfig2 = { errorCode: 'testec', conditionConfig: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValidatorConfigCAResult> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(1);
            checkPropertyCAResultsFromArray(results2.properties, 0,
                'errorCode',
                `Duplicate error code "${testConfig2.errorCode}". All must be unique.`, CAIssueSeverity.error);
        });
        // same with whitespace differences
        it('should report duplicate config error after the same-named config is added with whitespace differences', () => {
            const testConfig1 = { errorCode: 'TestEC', conditionConfig: null };
            const testConfig2 = { errorCode: ' TestEC ', conditionConfig: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValidatorConfigCAResult> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(2);
            // whitespaceerror in results2.properties[0]
            checkPropertyCAResultsFromArray(results2.properties, 0,
                'errorCode',
                `Error code must not contain whitespace.`, CAIssueSeverity.error);
            checkPropertyCAResultsFromArray(results2.properties, 1,
                'errorCode',
                `Duplicate error code "TestEC". All must be unique.`, CAIssueSeverity.error);   // whitespace trimmed here
        });
    });

    describe('validatorConfigs uses child Config feature', () => {

        // These require the helper to have analysisArgs.conditionConfigAnalyzer setup.
        // We are using MockConditionConfigAnalyzer which has a ranCount property to track 
        // calls to its analyze function.
    
        // with config.conditionConfig = undefined, the MockConditionConfigAnalyzer.ranCount should be 0
        it('should not call the conditionConfigAnalyzer if config.conditionConfig is undefined', () => {
            const testConfig = <ValidatorConfig> { conditionConfig: undefined! };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(ranCountOfMockConditionConfigAnalyzer(helper)).toBe(0);
        });
        // same with null
        it('should not call the conditionConfigAnalyzer if config.conditionConfig is null', () => {
            const testConfig = <ValidatorConfig> { conditionConfig: null! };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);

            expect(ranCountOfMockConditionConfigAnalyzer(helper)).toBe(0);
        });

        // with config.conditionConfig = { conditionType: 'TEST' }, the MockConditionConfigAnalyzer.ranCount should be 1
        it('should call the conditionConfigAnalyzer if config.conditionConfig is assigned', () => {
            const testConfig = <ValidatorConfig> { conditionConfig: { conditionType: 'TEST' } };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValidatorConfigPropertyAnalyzer> = [];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);

            expect(ranCountOfMockConditionConfigAnalyzer(helper)).toBe(1);
            expect(results.conditionResult!.conditionType).toBe('TEST');
        });

    });
    describe('Using ValidatorConfigPropertyAnalyzers', () => {
        // Using 3 MockValidatorConfigPropertyAnalyzers, we'll test that the property analyzers are called
        test('should call all registered property analyzers', () => {
            const testConfig = <ValidatorConfig>{ errorCode: 'TestEC', conditionConfig: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers = [
                new TestValidatorConfigPropertyAnalyzer(),
                new TestValidatorConfigPropertyAnalyzer(),
                new TestValidatorConfigPropertyAnalyzer()
            ];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(3);
        });


        // We'll initialize ValidatorConfigAnalyzer with all available IValidatorConfigPropertyAnalyzer classes
        // The ValidatorConfig object will be fully populated with all properties supported by those analyzers.
        // Two test cases: first has all valid data, resulting in no errors in results.properties.
        // The second has invalid data, resulting in errors in results.properties.
        // In both cases, there may be non-error entries in results.properties.

        test('using real property Analyzers and ValidatorConfig with no issues, should call all property analyzers and not report any errors', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: 'TestEC',    // not covered by any property analyzer
                conditionConfig: { conditionType: 'TestCondition' },    // not covered by any property analyzer
                conditionCreator: null!,    // ConditionCreatorConfigPropertyAnalyzer will not report an error
                errorMessage: 'Test Error Message',    // AllMessagePropertiesConfigPropertyAnalyzer
                summaryMessage: 'Test Summary Message',    // AllMessagePropertiesConfigPropertyAnalyzer
                errorMessagel10n: 'eml10n',    // AllMessagePropertiesConfigPropertyAnalyzer + TextLocalizerService supporting 'eml10n'
                summaryMessagel10n: 'sml10n',    // AllMessagePropertiesConfigPropertyAnalyzer + TextLocalizerService supporting 'sml10n'

            };
            let services = createServices();
            services.textLocalizerService.register('eml10n', { '*': 'Error Message Localized' });
            services.textLocalizerService.register('sml10n', { '*': 'Summary Message Localized' });
            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers = [
                new AllMessagePropertiesConfigPropertyAnalyzer(),
                new ConditionCreatorConfigPropertyAnalyzer(),
            ];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(2);
            // first property is 'errormessage' and has the cultureText for 'en'

            checkLocalizedPropertyResultFromArray(results.properties, 0, 'errorMessage',
                1, 'en', '*', 'Error Message Localized', undefined);
            // second property is 'summarymessage' and has the cultureText for 'en'
            checkLocalizedPropertyResultFromArray(results.properties, 1, 'summaryMessage',
                1, 'en', '*', 'Summary Message Localized', undefined);
        });
        test('using real property Analyzers and ValidatorConfig with issues for each property Analyzer, should call all property analyzers and report errors', () => {
            const testConfig = <ValidatorConfig>{
                errorCode: 'TestEC',    // not covered by any property analyzer
                conditionConfig: { conditionType: 'TestCondition' },    // not covered by any property analyzer
                conditionCreator: () => { return {} as any },    // ConditionCreatorConfigPropertyAnalyzer will report an error because conditionCOnfig is already used
                errorMessage: null,    // AllMessagePropertiesConfigPropertyAnalyzer will not report an error for this
                summaryMessage: null,    // AllMessagePropertiesConfigPropertyAnalyzer will not report an error for this
                errorMessagel10n: 'eml10n',    // AllMessagePropertiesConfigPropertyAnalyzer + TextLocalizerService NOT supporting 'eml10n'
                summaryMessagel10n: 'sml10n',    // AllMessagePropertiesConfigPropertyAnalyzer + TextLocalizerService NOT supporting 'sml10n'

            };
            let services = createServices();
            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers = [
                new AllMessagePropertiesConfigPropertyAnalyzer(),
                new ConditionCreatorConfigPropertyAnalyzer(),
            ];
            const analyzer = new ValidatorConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(3);
            checkLocalizedPropertyResultFromArray(results.properties, 0, 'errorMessage',
                1, 'en', '*', undefined, false);
            checkLocalizedPropertyResultFromArray(results.properties, 1, 'summaryMessage',
                1, 'en', '*', undefined, false);
            // checkPropertyCAResultsFromArray(results.properties, 0,
            //     'errorMessage', 'localization not declared in TextLocalizerService.', CAIssueSeverity.error);
            // checkPropertyCAResultsFromArray(results.properties, 1,
            //     'summaryMessage', 'localization not declared in TextLocalizerService.', CAIssueSeverity.error);
            checkPropertyCAResultsFromArray(results.properties, 2,
                'conditionCreator', 'Cannot supply both conditionCreator', CAIssueSeverity.error);
        });
 
    });

});