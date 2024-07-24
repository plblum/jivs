import { ConfigIssueSeverity, IValidatorConfigAnalyzer, IValueHostConfigPropertyAnalyzer, ValidatorConfigResults, ValueHostConfigResults } from '../../../src/Interfaces/ConfigAnalysisService';
import { ValueHostConfigAnalyzer } from '../../../src/Services/ConfigAnalysisService/ValueHostConfigAnalyzer';
import { AnalysisResultsHelper } from '../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper';
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import {
    createServices,
    checkConfigPropertyResultsFromArray, checkLocalizedPropertyResultFromArray, checkLookupKeysInfoForService, checkServiceInfoForParserClassRetrieval, setupHelper
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
            feature: 'Validator',
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
            const testConfig = { name: 'Test', type: 'Type', count: 1 };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe('ValueHost');
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
            const testConfig = { name: '' };
            let helper = setupHelperForTheseTests(createServices());
            let propertyAnalyzers: Array<IValueHostConfigPropertyAnalyzer> = [];
            const analyzer = new ValueHostConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.valueHostName).toBe('[Missing]');
            expect(results.properties).toHaveLength(0);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe('ValueHost');
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
            expect(results.feature).toBe('ValueHost');
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
            expect(results.feature).toBe('ValueHost');
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
            expect(results.feature).toBe('ValueHost');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
            expect(results.validators).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
        });
    });
    describe('duplicate config name', () => {
        // with no property analyzers, adding the same named config to existing results should result in a duplicate error
        it('should report duplicate config error after the same-named config is added twice.', () => {
            const testConfig1 = { name: 'Test', type: 'Type', count: 1 };
            const testConfig2 = { name: 'Test', type: 'AltType', count: 2 };
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
            expect(results2.feature).toBe('ValueHost');
            expect(results2.valueHostName).toBe('Test');
            expect(results2.validators).toBeUndefined();

        });
        // same but case insensitive duplicate match
        it('should report duplicate config error after the same-named config is added twice with different case', () => {
            const testConfig1 = { name: 'Test', type: 'Type', count: 1 };
            const testConfig2 = { name: 'test', type: 'AltType', count: 2 };
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
            expect(results2.feature).toBe('ValueHost');
            expect(results2.valueHostName).toBe('test');
            expect(results2.validators).toBeUndefined();

        });
        // same with whitespace differences
        it('should report duplicate config error after the same-named config is added twice with whitespace differences', () => {
            const testConfig1 = { name: 'Test', type: 'Type', count: 1 };
            const testConfig2 = { name: ' Test ', type: 'AltType', count: 2 };
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
            expect(results2.feature).toBe('ValueHost');
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
            const testConfig = { name: 'Test', type: 'Type', count: 1 };
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
            const testConfig = { name: 'Test', type: 'Type', count: 1, validatorConfigs: null };
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
            const testConfig = { name: 'Test', type: 'Type', count: 1, validatorConfigs: [] };
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
            const testConfig = { name: 'Test', type: 'Type', count: 1, validatorConfigs: [{}] };
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
            const testConfig = { name: 'Test', type: 'Type', count: 1, validatorConfigs: [{}, {}] };
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
    describe('Various ValueHostConfigs', () => {
        // test with name='testValueHost' and dataType=LookupKey.Number. results.configIssues has one entry. No issues are reported
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
                    feature: 'LookupKey',
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
            checkServiceInfoForParserClassRetrieval(serviceInfo, 0, 0, 'en', 'NumberParser', NumberParser);

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