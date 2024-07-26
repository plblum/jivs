import {
    ConditionConfigCAResult,
    CAIssueSeverity, IAnalysisResultsHelper, IConditionConfigPropertyAnalyzer,
    conditionFeature
} from '../../../src/Interfaces/ConfigAnalysisService';
import { ConditionConfigAnalyzer } from '../../../src/Services/ConfigAnalysisService/ConditionConfigAnalyzer';
import { AnalysisResultsHelper } from '../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper';
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import { createServices, checkPropertyCAResultsFromArray, setupHelper, MockAnalyzer } from './support';
import { ValueHostConfig } from '../../../src/Interfaces/ValueHost';
import { ConditionCategory, ConditionConfig } from '../../../src/Interfaces/Conditions';
import { EqualToCondition, EqualToConditionConfig } from '../../../src/Conditions/ConcreteConditions';
import { ConditionType } from '../../../src/Conditions/ConditionTypes';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { ConditionCategoryPropertyAnalyzer, ConditionTypeConfigPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer, ConditionWithSecondValueHostNamePropertyAnalyzer, ConditionWithValueHostNamePropertyAnalyzer } from '../../../src/Services/ConfigAnalysisService/ConditionConfigPropertyAnalyzerClasses';
import { AlwaysMatchesCondition } from '../../TestSupport/conditionsForTesting';
import { DataTypeComparerAnalyzer } from '../../../src/Services/ConfigAnalysisService/DataTypeComparerAnalyzer';

class TestConditionConfigPropertyAnalyzer implements IConditionConfigPropertyAnalyzer {
    analyze(config: ConditionConfig, results: ConditionConfigCAResult, valueHostConfig: ValueHostConfig | null, helper: IAnalysisResultsHelper<any>): void {
        this.ranCount++;
    }

    public ranCount: number = 0;
}

function createServicesForTheseTests(): IValidationServices {
    let services = createServices();
    services.conditionFactory.register<ConditionConfig>('TestCondition', (config)=> new AlwaysMatchesCondition(config));
    return services;

}

function setupHelperForTheseTests(services: IValidationServices): AnalysisResultsHelper<IValidationServices>
{
    let helper = setupHelper(services);
    return helper;
}        
function ranCountOfPropertyAnalyzers(propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer>): number {
    let ranCount = 0;
    propertyAnalyzers.forEach(pa => ranCount += (pa as TestConditionConfigPropertyAnalyzer).ranCount);
    return ranCount;
}   

describe('ConditionConfigAnalyzer', () => {
    // test with 0 property analyzers, 1 test config, the test config results should be initialized correctly and there are no property results
    describe('init results and conditionType assignment', () => {
        it('with ConditionConfig.conditionType="TestCondition", should initialize results correctly, result.conditionType="TestCondition" and no changes to results.properties', () => {
            const testConfig = <ConditionConfig>{
                conditionType: 'TestCondition',
            };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(conditionFeature);
            expect(results.conditionType).toBe('TestCondition');
            expect(results.properties).toHaveLength(0);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
        });
        it('with ConditionConfig.conditionType=undefined, should initialize results correctly, result.conditionType=[Missing] but no change to results.property', () => {
            const testConfig = <ConditionConfig>{
                conditionType: null!,
            };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(conditionFeature);
            expect(results.conditionType).toBe('[Missing]');
            expect(results.message).toContain('conditionType property not assigned');
            expect(results.severity).toBe(CAIssueSeverity.error);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);

        });
        // same but conditionType=''
        it('with ConditionConfig.conditionType="", should initialize results correctly, result.conditionType=[Missing] but no change to results.property', () => {
            const testConfig = <ConditionConfig>{
                conditionType: '',
            };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(conditionFeature);
            expect(results.conditionType).toBe('[Missing]');
            expect(results.message).toContain('conditionType property not assigned');
            expect(results.severity).toBe(CAIssueSeverity.error);            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });
        // same but conditionType= '   '
        it('with ConditionConfig.conditionType="   ", should initialize results correctly, result.conditionType=[Missing] but no change to results.property', () => {
            const testConfig = <ConditionConfig>{
                conditionType: '   ',
            };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(conditionFeature);
            expect(results.conditionType).toBe('[Missing]');
            expect(results.message).toContain('conditionType property not assigned');
            expect(results.severity).toBe(CAIssueSeverity.error);            
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });

        // conditionType has whitespace: ' TESTEC '. Whitespace is stripped in results.conditionType
        it('with ConditionConfig.conditionType=" TestCondition ", should initialize results correctly, result.conditionType="TESTEC" and no changes to results.properties', () => {
            const testConfig = <ConditionConfig>{
                conditionType: ' TestCondition ',
            };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(results.config).toBe(testConfig);
            expect(results.feature).toBe(conditionFeature);
            expect(results.conditionType).toBe('TestCondition');
            expect(results.message).toBeUndefined();
            expect(results.severity).toBeUndefined();
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(0);
            expect(results.properties).toHaveLength(0);
        });
    });

    describe('Using ConditionConfigPropertyAnalyzers', () => {
        // Using 3 MockConditionConfigPropertyAnalyzers, we'll test that the property analyzers are called
        test('should call all registered property analyzers', () => {
            const testConfig = <ConditionConfig>{ conditionType: 'TestCondition' };
            let services = createServicesForTheseTests();

            let helper = setupHelperForTheseTests(services);
            let propertyAnalyzers = [
                new TestConditionConfigPropertyAnalyzer(),
                new TestConditionConfigPropertyAnalyzer(),
                new TestConditionConfigPropertyAnalyzer()
            ];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, null, []);
            expect(ranCountOfPropertyAnalyzers(propertyAnalyzers)).toBe(3);
        });


        // We'll initialize ConditionConfigAnalyzer with all available IConditionConfigPropertyAnalyzer classes
        // The ConditionConfig object will be fully populated with all properties supported by those analyzers.
        // Two test cases: first has all valid data, resulting in no errors in results.properties.
        // The second has invalid data, resulting in errors in results.properties.
        // In both cases, there may be non-error entries in results.properties.

        test('using real property Analyzers and ConditionConfig with no issues, should call all property analyzers and not report any errors', () => {
            const testConfig = <EqualToConditionConfig>{
                conditionType: ConditionType.EqualTo, // ConditionCategoryPropertyAnalyzer
                valueHostName: 'TestValueHost',     // ConditionWithValueHostNamePropertyAnalyzer
                secondValueHostName: 'TestValueHost2',  // ConditionWithSecondValueHostNamePropertyAnalyzer
//                category: ConditionCategory.Comparison, // ConditionCategoryPropertyAnalyzer
                conversionLookupKey: null,  // ConditionWithConversionLookupKeyPropertyAnalyzer
                secondConversionLookupKey: LookupKey.Number,    // ConditionWithConversionLookupKeyPropertyAnalyzer
            };
            const vhc = <ValueHostConfig>{
                name: 'TestValueHost',
            };
            let services = createServicesForTheseTests();

            services.conditionFactory.register<EqualToConditionConfig>(ConditionType.EqualTo,(config)=> new EqualToCondition(config));
            let helper = setupHelperForTheseTests(services);
            helper.registerLookupKeyAnalyzer(ServiceName.converter,
                new MockAnalyzer(ServiceName.converter, {
                    feature: ServiceName.converter,
                }));
            helper.analysisArgs.results.valueHostNames = ['TestValueHost', 'TestValueHost2'];
            let propertyAnalyzers = [
                new ConditionTypeConfigPropertyAnalyzer(),
                new ConditionCategoryPropertyAnalyzer(),
                new ConditionWithValueHostNamePropertyAnalyzer(),
                new ConditionWithSecondValueHostNamePropertyAnalyzer(),
                new ConditionWithConversionLookupKeyPropertyAnalyzer(),
            ];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, vhc, []);
            expect(results.properties).toHaveLength(0);
        });
        test('using real property Analyzers and ConditionConfig with issues for each property Analyzer, should call all property analyzers and report errors', () => {
            const testConfig = <EqualToConditionConfig>{
                conditionType: 'testcondition', // ConditionTypeConfigPropertyAnalyzer. It must be viable, but not an exact match is an error
                valueHostName: 'TestValueHost',     // ConditionWithValueHostNamePropertyAnalyzer - unknown value host
                secondValueHostName: 'TestValueHost2',  // ConditionWithSecondValueHostNamePropertyAnalyzer - unknown value host
                category: ConditionCategory.Comparison, // ConditionCategoryPropertyAnalyzer info message
                conversionLookupKey: null,  // ConditionWithConversionLookupKeyPropertyAnalyzer
                secondConversionLookupKey: ' Number ',    // ConditionWithConversionLookupKeyPropertyAnalyzer - syntax error
            };
            const vhc = <ValueHostConfig>{
                name: 'TestValueHost',
            };
            let services = createServicesForTheseTests();

            services.conditionFactory.register<EqualToConditionConfig>(ConditionType.EqualTo,(config)=> new EqualToCondition(config));
            let helper = setupHelperForTheseTests(services);
            helper.registerLookupKeyAnalyzer(ServiceName.converter,
                new MockAnalyzer(ServiceName.converter, {
                    feature: ServiceName.converter,
                }));
            helper.analysisArgs.results.valueHostNames = [/*'TestValueHost', 'TestValueHost2'*/];   // none so names supplied are errors
            let propertyAnalyzers = [
                new ConditionTypeConfigPropertyAnalyzer(),
                new ConditionCategoryPropertyAnalyzer(),
                new ConditionWithValueHostNamePropertyAnalyzer(),
                new ConditionWithSecondValueHostNamePropertyAnalyzer(),
                new ConditionWithConversionLookupKeyPropertyAnalyzer(),
            ];
            const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
            let results = analyzer.analyze(testConfig, vhc, []);
            checkPropertyCAResultsFromArray(results.properties, 0,
                'conditionType', 'Change to TestCondition', CAIssueSeverity.info);
            checkPropertyCAResultsFromArray(results.properties, 1,
                'category', 'The category property is present', CAIssueSeverity.info);
            checkPropertyCAResultsFromArray(results.properties, 2,
                'valueHostName', 'ValueHostName does not exist', CAIssueSeverity.error);
            checkPropertyCAResultsFromArray(results.properties, 3,
                'secondValueHostName', 'ValueHostName does not exist', CAIssueSeverity.error);
            checkPropertyCAResultsFromArray(results.properties, 4,
                'secondConversionLookupKey', 'Value is not an exact match', CAIssueSeverity.error);
        });
 
        describe('Conditions that use Comparers may report an error message if the comparer is not available', () => {
            // Test cases:
            // 1. ConditionConfig.conditionType = 'TestCondition', no comparer needed. result message and severity are undefined.
            // 2. ConditionConfig.conditionType = EqualTo + DataType=Number, comparer needed and is resolved. result message and severity are undefined.
            // 3. ConditionConfig.conditionType = EqualTo + DataType=Custom, comparer needed but not resolved. result message and severity are set. "The condition needs a DataTypeComparer"

            test('with ConditionConfig.conditionType="TestCondition", no comparer needed, should not report an error', () => {
                const testConfig = <ConditionConfig>{
                    conditionType: 'TestCondition',
                };
                const testValueHostConfig = <ValueHostConfig>{
                    name: 'TestValueHost',
                };
                let services = createServicesForTheseTests();

                let helper = setupHelperForTheseTests(services);
                helper.analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer(helper);
                let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
                const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
                let results = analyzer.analyze(testConfig, testValueHostConfig, []);
                expect(results.message).toBeUndefined();
                expect(results.severity).toBeUndefined();
            });
            test('with ConditionConfig.conditionType=EqualTo, DataType=Number, comparer resolved, should not report an error', () => {
                const testConfig = <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    conversionLookupKey: LookupKey.Number,
                };
                const testValueHostConfig = <ValueHostConfig>{
                    name: 'TestValueHost',
                };                
                let services = createServicesForTheseTests();

                services.conditionFactory.register<EqualToConditionConfig>(ConditionType.EqualTo,(config)=> new EqualToCondition(config));
                let helper = setupHelperForTheseTests(services);
                helper.analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer(helper);
                let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
                const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
                let results = analyzer.analyze(testConfig, testValueHostConfig, []);
                expect(results.message).toBeUndefined();
                expect(results.severity).toBeUndefined();
            });
            test('with ConditionConfig.conditionType=EqualTo, DataType=Custom, comparer not resolved, should report an error', () => {
                const testConfig = <EqualToConditionConfig>{
                    conditionType: ConditionType.EqualTo,
                    conversionLookupKey: 'Custom',
                };
                const testValueHostConfig = <ValueHostConfig>{
                    name: 'TestValueHost',
                };                
                let services = createServicesForTheseTests();

                services.conditionFactory.register<EqualToConditionConfig>(ConditionType.EqualTo,(config)=> new EqualToCondition(config));
                let helper = setupHelperForTheseTests(services);
                helper.analysisArgs.comparerAnalyzer = new DataTypeComparerAnalyzer(helper);                
                helper.analysisArgs.sampleValues.registerSampleValue('Custom', new Date());
                let propertyAnalyzers: Array<IConditionConfigPropertyAnalyzer> = [];
                const analyzer = new ConditionConfigAnalyzer(helper, propertyAnalyzers);
                let results = analyzer.analyze(testConfig, testValueHostConfig, []);
                expect(results.message).toContain('Comparison configuration');
                expect(results.severity).toBe(CAIssueSeverity.warning);
            });

        });
    });

});