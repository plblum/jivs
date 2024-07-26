import { DataTypeComparerAnalyzer } from './../../../src/Services/ConfigAnalysisService/DataTypeComparerAnalyzer';
import { ConfigIssueSeverity, IConditionConfigPropertyAnalyzer, IValidatorConfigAnalyzer, IValueHostConfigPropertyAnalyzer, ValidatorConfigResults, ValueHostConfigResults, conditionFeature, lookupKeyFeature, validatorFeature, valueHostFeature } from '../../../src/Interfaces/ConfigAnalysisService';
import { ValueHostConfigAnalyzer } from '../../../src/Services/ConfigAnalysisService/ValueHostConfigAnalyzer';
import { AnalysisResultsHelper } from '../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper';
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import {
    createServices,
    checkConfigPropertyResultsFromArray, checkLocalizedPropertyResultFromArray, checkLookupKeysInfoForService, checkServiceInfoForCultureSpecificParserRetrieval, setupHelper
} from './support';

import { ValueHostConfig } from '../../../src/Interfaces/ValueHost';
import { ValidatorConfig } from '../../../src/Interfaces/Validator';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { ValueHostType } from '../../../src/Interfaces/ValueHostFactory';
import { CalcFnPropertyAnalyzer, DataTypePropertyAnalyzer, LabelPropertiesAnalyzer, ParserLookupKeyPropertyAnalyzer, ValueHostNamePropertyAnalyzer, ValueHostTypePropertyAnalyzer } from '../../../src/Services/ConfigAnalysisService/ValueHostConfigPropertyAnalyzerClasses';
import { InputValueHostConfig } from '../../../src/Interfaces/InputValueHost';
import { NumberParser } from '../../../src/DataTypes/DataTypeParsers';
import { DataTypeParserLookupKeyAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeParserLookupKeyAnalyzer';
import { DataTypeParserService } from '../../../src/Services/DataTypeParserService';
import { ValidatorsValueHostBaseConfig } from '../../../src/Interfaces/ValidatorsValueHostBase';
import { registerAllConditions } from '../../TestSupport/createValidationServices';
import { ConditionType } from '../../../src/Conditions/ConditionTypes';
import { EqualToValueCondition, EqualToValueConditionConfig, RequireTextCondition, RequireTextConditionConfig } from '../../../src/Conditions/ConcreteConditions';
import { ConditionConfigAnalyzer } from '../../../src/Services/ConfigAnalysisService/ConditionConfigAnalyzer';

class MockValueHostConfigPropertyAnalyzer implements IValueHostConfigPropertyAnalyzer {
    public analyze(config: ValueHostConfig, results: ValueHostConfigResults): void {
        this.ranCount++;
    }
    public ranCount: number = 0;
}

class MockValidatorConfigAnalyzer implements IValidatorConfigAnalyzer {
    analyze(config: ValidatorConfig, valueHostConfig: ValueHostConfig | null, existingResults: ValidatorConfigResults[]): ValidatorConfigResults {
        this.ranCount++;
        return <ValidatorConfigResults>{
            feature: validatorFeature,
            errorCode: 'TESTEC',
            config: config,
            properties: []
        };
        
    }

    public ranCount: number = 0;
    
}
function setupHelperForTheseTests(services: IValidationServices): AnalysisResultsHelper<IValidationServices>
{
    let helper = setupHelper(services);
    helper.analysisArgs.validatorConfigAnalyzer = new MockValidatorConfigAnalyzer();
    return helper;
}        
function ranCountOfPropertyAnalyzers(propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer>): number {
    let ranCount = 0;
    propertyAnalyzers.forEach(pa => ranCount += (pa as MockValueHostConfigPropertyAnalyzer).ranCount);
    return ranCount;
}   
function ranCountOfMockValidatorConfigAnalyzer(helper: AnalysisResultsHelper<IValidationServices>): number {
    return (helper.analysisArgs.validatorConfigAnalyzer as MockValidatorConfigAnalyzer).ranCount;
} 
describe('ValueHostConfigAnalyzer', () => {
    // test with 0 property analyzers, 1 test config, the test config results should be initialized correctly and there are no property results
    describe('init results and config.name', () => {
        it('should initialize results correctly with 0 property analyzers', () => {
            const testConfig: ValueHostConfig = { name: 'Test' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(valueHostFeature);
            expect(results.valueHostName).toBe('Test');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
        // same but config.name is empty results in valueHostName being '[Missing]'
        it('should handle empty config.name with valueHostName=[Missing] and error message', () => {
            // NOTE: The ValueHostNamePropertyAnalyzer has more tests for a missing name
            // Here we are interested in Result.valueHostName. The propertyAnalyzer handles config.name.
            const testConfig: ValueHostConfig = { name: '' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.valueHostName).toBe('[Missing]');
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(valueHostFeature);
            expect(results.message).toContain('The ValueHostConfig name is missing. It is required.');
            expect(results.severity).toBe(ConfigIssueSeverity.error);
            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
        // same but config.name is null
        it('should handle null config.name with valueHostName=[Missing]', () => {

            const testConfig: ValueHostConfig = { name: null! };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.valueHostName).toBe('[Missing]');
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(valueHostFeature);
            expect(results.message).toContain('The ValueHostConfig name is missing. It is required.');
            expect(results.severity).toBe(ConfigIssueSeverity.error);
            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
        // same but config.name is whitespace
        it('should handle whitespace config.name with valueHostName=[Missing]', () => {

            const testConfig: ValueHostConfig = { name: '  ' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.valueHostName).toBe('[Missing]');
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(valueHostFeature);
            expect(results.message).toContain('The ValueHostConfig name is missing. It is required.');
            expect(results.severity).toBe(ConfigIssueSeverity.error);

            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
        // whitespace around name is stripped in resutls.valueHostName
        it('should strip whitespace around config.name in valueHostName', () => {
            const testConfig: ValueHostConfig = { name: '  Test  ' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.valueHostName).toBe('Test');
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(valueHostFeature);
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
    });
    describe('duplicate config name', () => {
        // with no property analyzers, adding the same named config to existing results should result in a duplicate error
        it('should report duplicate config error after the same-named config is added twice.', () => {
            const testConfig1: ValueHostConfig = { name: 'Test', dataType: LookupKey.Number };
            const testConfig2: ValueHostConfig = { name: 'Test', dataType: LookupKey.String };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValueHostConfigResults> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(results2.properties, 0,
                'valueHostName',
                `The ValueHostConfig name "${testConfig1.name}" is a case insensitive match to another. It must be unique.`, ConfigIssueSeverity.error);
        
            expect(results2.config).toBe(testConfig2);
            expect(results2.feature).toBe(valueHostFeature);
            expect(results2.valueHostName).toBe('Test');
            expect(results2.validators).toBeUndefined();

        });
        // same but case insensitive duplicate match
        it('should report duplicate config error after the same-named config is added twice with different case', () => {
            const testConfig1: ValueHostConfig = { name: 'Test', dataType: LookupKey.Number };
            const testConfig2: ValueHostConfig = { name: 'test', dataType: LookupKey.String };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValueHostConfigResults> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(results2.properties, 0,
                'valueHostName',
                `The ValueHostConfig name "${testConfig2.name}" is a case insensitive match to another. It must be unique.`, ConfigIssueSeverity.error);
        
            expect(results2.config).toBe(testConfig2);
            expect(results2.feature).toBe(valueHostFeature);
            expect(results2.valueHostName).toBe('test');
            expect(results2.validators).toBeUndefined();

        });
        // same with whitespace differences
        it('should report duplicate config error after the same-named config is added twice with whitespace differences', () => {
            const testConfig1: ValueHostConfig = { name: 'Test', dataType: LookupKey.Number };
            const testConfig2: ValueHostConfig = { name: ' Test ', dataType: LookupKey.String };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let cummulativeResults: Array<ValueHostConfigResults> = [];
            let results1 = analyzer.analyze(testConfig1, null, cummulativeResults);
            cummulativeResults.push(results1);  
            let results2 = analyzer.analyze(testConfig2, null, cummulativeResults);
            cummulativeResults.push(results2);
            expect(results1.properties).toHaveLength(0);
            expect(results2.properties).toHaveLength(1);
            checkConfigPropertyResultsFromArray(results2.properties, 0,
                'valueHostName',
                `The ValueHostConfig name "${testConfig2.name}" is a case insensitive match to another. It must be unique.`, ConfigIssueSeverity.error);
        
            expect(results2.config).toBe(testConfig2);
            expect(results2.feature).toBe(valueHostFeature);
            expect(results2.valueHostName).toBe('Test');    // trimmed
            expect(results2.validators).toBeUndefined();
        });
    });

    describe('validatorConfigs uses child Config feature', () => {

        // These require the helper to have analysisArgs.validatorConfigAnalyzer setup.
        // We are using MockValidatorConfigAnalyzer which has a ranCount property to track 
        // calls to its analyze function.
    
        // with config.validatorConfigs = undefined, the MockValidatorConfigAnalyzer.ranCount should be 0
        it('should not call the validatorConfigAnalyzer if config.validatorConfigs is undefined', () => {
            const testConfig: ValueHostConfig = { name: 'Test' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfMockValidatorConfigAnalyzer(helper)).toBe(0);
            expect(results.validators).toBeUndefined();
        });
        // same with null
        it('should not call the validatorConfigAnalyzer if config.validatorConfigs is null', () => {
            const testConfig: ValidatorsValueHostBaseConfig = { name: 'Test', validatorConfigs: null };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfMockValidatorConfigAnalyzer(helper)).toBe(0);
            expect(results.validators).toBeUndefined();
        });
        // with config.validatorConfigs = [], the MockValidatorConfigAnalyzer.ranCount should be 0
        it('should not call the validatorConfigAnalyzer if config.validatorConfigs is empty', () => {
            const testConfig: ValidatorsValueHostBaseConfig = { name: 'Test', validatorConfigs: [] };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfMockValidatorConfigAnalyzer(helper)).toBe(0);
            expect(results.validators).toHaveLength(0);
        });
        // with config.validatorConfigs = [{}], the MockValidatorConfigAnalyzer.ranCount should be 1
        it('should call the validatorConfigAnalyzer if config.validatorConfigs has a config', () => {
            const testConfig: ValidatorsValueHostBaseConfig = { name: 'Test', validatorConfigs: [{} as any] };            

            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfMockValidatorConfigAnalyzer(helper)).toBe(1);
            expect(results.validators).toHaveLength(1);
            expect(results.validators![0].errorCode).toBe('TESTEC');
        });
        // with config.validatorConfigs = [{}, {}], the MockValidatorConfigAnalyzer.ranCount should be 2
        it('should call the validatorConfigAnalyzer for each config in config.validatorConfigs', () => {
            const testConfig: ValidatorsValueHostBaseConfig = { name: 'Test', validatorConfigs: [{} as any, {} as any] };            
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfMockValidatorConfigAnalyzer(helper)).toBe(2);
            expect(results.validators).toHaveLength(2);
            expect(results.validators![0].errorCode).toBe('TESTEC');
            expect(results.validators![1].errorCode).toBe('TESTEC');
        });
    });
    describe('enablerConfig uses child Config feature', () => {
        // enablerConfig is similar to validatorConfigs property in that it is an optional value.
        // However, it represents a single Condition to be evaluated by ConditionConfigAnalyzer.
        // When that runs, expect results.enablerCondition to be set.

        test('should not call the conditionConfigAnalyzer if config.enablerConfig is undefined', () => {
            const testConfig: ValueHostConfig = { name: 'Test' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.enablerCondition).toBeUndefined();
        });
        test('should not call the conditionConfigAnalyzer if config.enablerConfig is null', () => {
            const testConfig: ValueHostConfig = {
                name: 'Test', 
                enablerConfig: null!
             };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.enablerCondition).toBeUndefined();
        });
        test('should call the conditionConfigAnalyzer if config.enablerConfig is defined', () => {
            const testConfig: ValueHostConfig = {
                name: 'Test', 
                dataType: LookupKey.String,
                enablerConfig: { conditionType: ConditionType.RequireText }
            };
            let services = createServices();
            services.conditionFactory.register<RequireTextConditionConfig>(
                ConditionType.RequireText, (config) => new RequireTextCondition(config));
            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const testItem = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = testItem.analyze(testConfig, null, []);
            expect(results.enablerCondition).toBeDefined();
            expect(results.enablerCondition!.feature).toBe(conditionFeature);
            expect(results.enablerCondition!.conditionType).toBe(ConditionType.RequireText);
        });
        // using EqualToValueConditionConfig, it will need to setup a comparer.
        // The LookupKeyInfo for service comparer should be setup without error
        // when dataType=String.
        test('Config.enablerConfig is defined with EqualToValueConditionConfig should have result.enablerCondition setup and LookupKeyInfo for String identifies the comparer service', () => {
            const testConfig: ValueHostConfig = {
                name: 'Test', 
                dataType: LookupKey.String,
                enablerConfig: <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    value: 'Test',
                    valueHostName: 'name'   // normally this would be a different valuehostname...
                }
            };
            let services = createServices();
            services.conditionFactory.register<EqualToValueConditionConfig>(
                ConditionType.EqualToValue, (config) => new EqualToValueCondition(config));
            let cpa: Array<IConditionConfigPropertyAnalyzer> = [

            ];
            let helper = setupHelperForTheseTests(services);
            helper.analysisArgs.conditionConfigAnalyzer = new ConditionConfigAnalyzer(helper, cpa);
            helper.analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer(helper);
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [
                new DataTypePropertyAnalyzer()  // ensures dataType is setup in LookupKeysInfo
            ];
            const testItem = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = testItem.analyze(testConfig, null, []);
            expect(results.enablerCondition).toBeDefined();
            expect(results.enablerCondition!.feature).toBe(conditionFeature);
            expect(results.enablerCondition!.conditionType).toBe(ConditionType.EqualToValue);
            checkLookupKeysInfoForService(helper.results.lookupKeysInfo, LookupKey.String, ServiceName.comparer);
        });
        // similar but now the comparer fails to be setup and adds a warning message
        // to the results.enablerCondition object.
        // It fails because the LookupKey is "Custom" which is unknown
        test('Config.enablerConfig is defined with EqualToValueConditionConfig should have result.enablerCondition setup and LookupKeyInfo for Custom identifies the comparer service', () => {
            const testConfig: ValueHostConfig = {
                name: 'Test', 
                dataType: 'Custom',
                enablerConfig: <EqualToValueConditionConfig>{
                    conditionType: ConditionType.EqualToValue,
                    value: 'Test',
                    valueHostName: 'name'   // normally this would be a different valuehostname...
                }
            };
            let services = createServices();
            services.conditionFactory.register<EqualToValueConditionConfig>(
                ConditionType.EqualToValue, (config) => new EqualToValueCondition(config));
            let cpa: Array<IConditionConfigPropertyAnalyzer> = [

            ];
            let helper = setupHelperForTheseTests(services);
            helper.analysisArgs.conditionConfigAnalyzer = new ConditionConfigAnalyzer(helper, cpa);
            helper.analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer(helper);
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [
                new DataTypePropertyAnalyzer()  // ensures dataType is setup in LookupKeysInfo
            ];
            const testItem = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = testItem.analyze(testConfig, null, []);
            expect(results.enablerCondition).toBeDefined();
            expect(results.enablerCondition!.feature).toBe(conditionFeature);
            expect(results.enablerCondition!.conditionType).toBe(ConditionType.EqualToValue);
            checkLookupKeysInfoForService(helper.results.lookupKeysInfo, 'Custom', ServiceName.comparer);
            expect(results.enablerCondition!.severity).toBe(ConfigIssueSeverity.warning);
            expect(results.enablerCondition!.message).toContain('No sample value found');
        });
    });
    describe('Various ValueHostConfigs', () => {
        // test with name='testValueHost' and dataType=LookupKey.Number. results.valueHostResults has one entry. No issues are reported
        test('when dataType assigned, should add its lookupKey to the results.lookupKeysInfo', () => {
            const testValueHostConfig: ValueHostConfig = {
                valueHostType: ValueHostType.Static,
                name: 'testValueHost',
                dataType: LookupKey.Number,
            };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers = [new DataTypePropertyAnalyzer()];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testValueHostConfig, null, []);

            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testValueHostConfig);
            expect(helper.results.lookupKeysInfo).toEqual([
                {
                    feature: lookupKeyFeature,
                    lookupKey: LookupKey.Number,
                    usedAsDataType: true,
                    services: []
                }
            ]);

        });
        // with all available ValueHostPropertyAnalyzers, check a fully populated InputValueHostConfig
        // Two tests: one without any issues, one with issues for every analyzer
        test('should analyze a fully populated InputValueHostConfig without any issues', () => {
            const testValueHostConfig: InputValueHostConfig = {
                valueHostType: ValueHostType.Input,
                name: 'testValueHost',
                dataType: LookupKey.Number,
                label: 'Test',
                labell10n: null,
                parserLookupKey: LookupKey.Number,  // need NumberParser to be setup in DataTypeParserService
                validatorConfigs: []
            };
            let services = createServices(['en']);
            let dtps = new DataTypeParserService();
            
            services.dataTypeParserService = dtps;
            dtps.services = services;
            dtps.register(new NumberParser(['en'], {
                decimalSeparator: '.', negativeSymbol: '-'
            }));
            let helper = setupHelperForTheseTests(services);
            helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(helper.analysisArgs));
            let propertyAnalyzers = [
                new DataTypePropertyAnalyzer(),
                new ValueHostTypePropertyAnalyzer(),
                new ValueHostNamePropertyAnalyzer(),
                new LabelPropertiesAnalyzer(),
                new ParserLookupKeyPropertyAnalyzer(),
                new CalcFnPropertyAnalyzer()
            ];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testValueHostConfig, null, []);
            expect(results.properties).toHaveLength(0);
            // get lookupKeyInfo for Number from helper
            let serviceInfo = checkLookupKeysInfoForService(helper.results.lookupKeysInfo,
                LookupKey.Number, ServiceName.parser);
            checkServiceInfoForCultureSpecificParserRetrieval(serviceInfo, 0, 0, 'en', 'NumberParser', NumberParser);

        });
        // same but with issues for each analyzer
        test('should analyze a fully populated InputValueHostConfig with issues for each analyzer', () => {
            const testValueHostConfig: any ={
                valueHostType: ' Input ',   // ValueHostTypePropertyAnalyzer
                name: ' whitespace ',   // ValueHostNamePropertyAnalyzer
                dataType: ' Number  ', // DataTypePropertyAnalyzer
                label: '{Token:bad',    // LabelPropertiesAnalyzer syntax error
                labell10n: 'Test',  // LabelPropertiesAnalyzer missing from TextLocalizerService
                parserLookupKey: 'Unknown',  // ParserLookupKeyPropertyAnalyzer no matching parser
                validatorConfigs: [],    // not worried about this because it does not have a property analyzer
                calcFn: 'Not a function'    // CalcFnPropertyAnalyzer syntax error
            };
            let services = createServices(['en']);
            let dtps = new DataTypeParserService();
            
            services.dataTypeParserService = dtps;
            dtps.services = services;
            dtps.register(new NumberParser(['en'], {
                decimalSeparator: '.', negativeSymbol: '-'
            }));
            let helper = setupHelperForTheseTests(services);
            helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(helper.analysisArgs));

            let propertyAnalyzers = [
                new ValueHostTypePropertyAnalyzer(),
                new ValueHostNamePropertyAnalyzer(),
                new DataTypePropertyAnalyzer(),

                new LabelPropertiesAnalyzer(),
                new ParserLookupKeyPropertyAnalyzer(),
                new CalcFnPropertyAnalyzer()
            ];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testValueHostConfig, null, []);
            expect(results.properties).toHaveLength(6);
            checkConfigPropertyResultsFromArray(results.properties, 0,
                'valueHostType', 'The ValueHostConfig is not recognized', ConfigIssueSeverity.error);
            checkConfigPropertyResultsFromArray(results.properties, 1,
                'valueHostName', 'leading or trailing whitespace.', ConfigIssueSeverity.error);
            checkConfigPropertyResultsFromArray(results.properties, 2,
                'dataType', 'not an exact match', ConfigIssueSeverity.error);

            checkLocalizedPropertyResultFromArray(results.properties, 3, 'label',
                1, 'en', 'en', undefined, true);

            // parserLookupKey is not associated with a parser object and no fallback
            checkConfigPropertyResultsFromArray(results.properties, 4,
                'parserLookupKey', 'Not found', ConfigIssueSeverity.error);
            // calcFn is not a function
            checkConfigPropertyResultsFromArray(results.properties, 5,
                'calcFn', 'Value must be a function', ConfigIssueSeverity.error);
        });
    });

});