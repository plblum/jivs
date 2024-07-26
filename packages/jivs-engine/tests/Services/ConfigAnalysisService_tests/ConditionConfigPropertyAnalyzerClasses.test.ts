import { CompareToValueConditionBaseConfig } from './../../../src/Conditions/CompareToValueConditionBase';
import { ConditionCategoryPropertyAnalyzer, ConditionTypeConfigPropertyAnalyzer, ConditionWithChildrenPropertyAnalyzer, ConditionWithOneChildPropertyAnalyzer, ConditionWithConversionLookupKeyPropertyAnalyzer, ConditionWithValueHostNamePropertyAnalyzer, ConditionWithSecondValueHostNamePropertyAnalyzer, ConditionWithSecondValuePropertyAnalyzer } from './../../../src/Services/ConfigAnalysisService/ConditionConfigPropertyAnalyzerClasses';
import { ConditionConfigAnalyzer } from './../../../src/Services/ConfigAnalysisService/ConditionConfigAnalyzer';
import { CompareToSecondValueHostConditionBaseConfig } from './../../../src/Conditions/CompareToSecondValueHostConditionBase';
import { ConditionCategory, SupportsDataTypeConverter } from './../../../src/Interfaces/Conditions';
import { DataTypeConverterLookupKeyAnalyzer } from './../../../src/Services/ConfigAnalysisService/DataTypeConverterLookupKeyAnalyzer';
import { LookupKey } from '../../../src/DataTypes/LookupKeys';
import { ConditionConfigResults, ConditionConfigWithChildrenResults, ConfigIssueSeverity, conditionFeature } from '../../../src/Interfaces/ConfigAnalysisService';
import { IValidationServices, ServiceName } from '../../../src/Interfaces/ValidationServices';
import { AnalysisResultsHelper } from '../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper';
import { checkConfigPropertyResultsFromArray, createServices, setupHelper } from './support';
import { ValueHostConfig } from '../../../src/Interfaces/ValueHost';
import { ConditionConfig } from '../../../src/Interfaces/Conditions';
import { IntegerConverter, NumericStringToNumberConverter } from '../../../src/DataTypes/DataTypeConverters';
import { AlwaysMatchesCondition } from '../../TestSupport/conditionsForTesting';
import { ConditionFactory } from '../../../src/Conditions/ConditionFactory';
import { ConditionWithChildrenBaseConfig } from '../../../src/Conditions/ConditionWithChildrenBase';
import { ConditionWithOneChildBaseConfig } from '../../../src/Conditions/ConditionWithOneChildBase';
import { OneValueConditionBaseConfig } from '../../../src/Conditions/OneValueConditionBase';
import { ValueHostNamePropertyAnalyzer } from '../../../src/Services/ConfigAnalysisService/ValueHostConfigPropertyAnalyzerClasses';
import { ConditionType } from '../../../src/Conditions/ConditionTypes';

function createServicesForTheseTests(addCultures: Array<string> = ['en']): IValidationServices {
    let services = createServices(addCultures);

    let conditionFactory = new ConditionFactory();
    services.conditionFactory = conditionFactory;
    conditionFactory.register<ConditionConfig>('testCondition', (config)=> new AlwaysMatchesCondition(config));
    conditionFactory.register<ConditionConfig>('testCondition2', (config) => new AlwaysMatchesCondition(config));
    conditionFactory.register<ConditionConfig>('testCondition3', (config)=> new AlwaysMatchesCondition(config));
    return services;
}
// Includes analyzer for DataTypeConverterService
function setupHelperForTheseTests(services: IValidationServices): AnalysisResultsHelper<IValidationServices>
{
    let helper = setupHelper(services);
    helper.analysisArgs.conditionConfigAnalyzer = new ConditionConfigAnalyzer(helper,
        [new ConditionTypeConfigPropertyAnalyzer()]);
    helper.registerLookupKeyAnalyzer(ServiceName.converter,
        new DataTypeConverterLookupKeyAnalyzer(helper.analysisArgs)
    );    
    return helper;
}        

function createValueHostConfig(): ValueHostConfig {
    return {
        name: 'testValueHost',
        dataType: LookupKey.Number,

    };
}    
function createConditionResults(config: ConditionConfig): ConditionConfigResults {
    return {
        feature: conditionFeature,
        conditionType: config.conditionType ?? '[Missing]',
        config: config,
        properties: []
    };
}


describe('ConversionLookupKeyAnalyzer class', () => {
    // test cases:
    // 1. analyze with no conversionLookupKey or secondConversionLookupKey
    // 2. analyze with conversionLookupKey
    // 3. analyze with secondConversionLookupKey
    // 4. analyze with both conversionLookupKey and secondConversionLookupKey
    // 5. analyze with conversionLookupKey that is not in the DataTypeConverterService
    // 6. analyze with secondConversionLookupKey that is not in the DataTypeConverterService
    // 7. LookupKey has whitespace reported as a property error
    // 8. LookupKey is case insensitive match reported as a property error
    // 9. LookupKey is null same as #1
    // 10. LookupKey is empty string same as #1

    test('analyze with no conversionLookupKey or secondConversionLookupKey', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with conversionLookupKey = Number finds matching converter and does not change the results', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: LookupKey.Number
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with secondConversionLookupKey = Number finds matching converter and does not change the results', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondConversionLookupKey: LookupKey.Number,
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with both conversionLookupKey = Number and secondConversionLookupKey = Integer finds matching converter and does not change the results', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        services.dataTypeConverterService.register(new IntegerConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            conversionLookupKey: LookupKey.Number,
            secondConversionLookupKey: LookupKey.Integer,
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with conversionLookupKey = Number does not find matching converter and reports property error', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: LookupKey.Number
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conversionLookupKey',
            'Not found. Please register',
            ConfigIssueSeverity.error);

    });
    test('analyze with secondConversionLookupKey = Number does not find matching converter and reports property error', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondConversionLookupKey: LookupKey.Number,
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'secondConversionLookupKey',
            'Not found. Please register',
            ConfigIssueSeverity.error);

    });
    test('analyze with conversionLookupKey = " " does not change results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: ' '
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    test('analyze with conversionLookupKey = null does not change results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    test('analyze with conversionLookupKey = "" does not change results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: ''
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    test('analyze with conversionLookupKey = "number" reports "Value is not an exact match" error', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: 'number'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conversionLookupKey',
            'Value is not an exact match',
            ConfigIssueSeverity.error);

    });

    test('analyze with conversionLookupKey = "  Number  " reports "Value is not an exact match" error', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: SupportsDataTypeConverter = {
            conditionType: 'testCondition',
            conversionLookupKey: '  Number  '
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conversionLookupKey',
            'Value is not an exact match',
            ConfigIssueSeverity.error);

    });
    // same cases using secondConversionLookupKey
    test('analyze with secondConversionLookupKey = "number" reports "Value is not an exact match" error', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondConversionLookupKey: 'number',
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'secondConversionLookupKey',
            'Value is not an exact match',
            ConfigIssueSeverity.error);

    });
    // null and empty string cases
    test('analyze with secondConversionLookupKey = null does not change results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondConversionLookupKey: null,
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    test('analyze with secondConversionLookupKey = "" does not change results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithConversionLookupKeyPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondConversionLookupKey: '',
            secondValueHostName: 'testValueHost2',
            valueHostName: 'testValueHost' 
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });

});
describe('ConditionTypeConfigPropertyAnalyzer class', () => {
    // test cases:
    // All have the ConditionFactory with a single condition type registered as 'testCondition'

    // 1. analyze with conditionType that is registered does not change the results
    // 2. analyze with conditionType = null reports "conditionType must be assigned" error
    // 3. analyze with conditionType = "" reports "conditionType must be assigned" error
    // 4. analyze with conditionType not found in the ConditionFactory reports an error from the exception thrown
    // 5. analyze with conditionType that has whitespace reports "Remove whitespace" error
    test('analyze with conditionType that is registered does not change the results', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with conditionType = null reports "conditionType must be assigned" error', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: null!
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionType',
            'conditionType must be assigned',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionType = "" reports "conditionType must be assigned" error', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: ''
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionType',
            'conditionType must be assigned',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionType that is not registered reports "ConditionType not registered:" error', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'notRegistered'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionType',
            'The condition type is not found in the ConditionFactory.',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionType that has whitespace reports "Remove whitespace" error', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: ' testCondition '
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionType',
            'Remove whitespace',
            ConfigIssueSeverity.error);

    });
    // case insensitive match is reported as "Change to " error
    test('analyze with conditionType that is a case insensitive match reports "Change to" info', () => {
        let services = createServicesForTheseTests();   // contains 'testCondition'
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionTypeConfigPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'TESTCONDITION'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionType',
            'Change to testCondition.',
            ConfigIssueSeverity.info);

    });

});

describe('ConditionCategoryPropertyAnalyzer class', () => {
    // test cases:
    // 1. analyze with no category does not change the results
    // 2. analyze with category = null does not change the results
    // 3. analyze with category = "" does not change the results
    // 4. analyze with a category that is known adds an info message "override the default category"
    // 5. analyze with a category that is not known reports "The category property is not recognized." error
    // 6. analyze with a category that is not known but is a case insensitive match reports "Change to" info message

    test('analyze with no category does not change the results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with category = null does not change the results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition',
            category: null!
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with category = "" does not change the results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition',
            category: '' as any
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with a category that is known adds an info message "override the default category"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = { 
            conditionType: 'testCondition',
            category: ConditionCategory.Contents
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'category',
            'override the default category',
            ConfigIssueSeverity.info);

    });
    test('analyze with a category that is not known reports "The category property is not recognized." error', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = {
            conditionType: 'testCondition',
            category: 'notKnown' as any
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'category',
            'The category property is not recognized.',
            ConfigIssueSeverity.error);

    });
    test('analyze with a category that is not known but is a case insensitive match reports "Change to" info message', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionCategoryPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = {
            conditionType: 'testCondition',
            category: 'contents' as any
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'category',
            'Change to Contents.',
            ConfigIssueSeverity.info);

    });

});

describe('ConditionWithChildrenPropertyAnalyzer class', () => {
    // test cases:
    // 1. analyze with conditionConfigs === undefined does not change the results
    // 2. analyze with conditionConfigs = null is an error with message "Must be an array with at least one condition"
    // 3. analyze with conditionConfigs = [] is an error with message "Must be an array with at least one condition"
    // 4. analyze with conditionConfigs = a number is an error with message "Must be an array with at least one condition"
    // 5. analyze with conditionConfigs containing a single ConditionConfig that has no errors creates an entry for that condition in results.children
    // 6. same with 3 ConditionConfigs has 3 entries in results.children
    // 7. analyze with conditionConfigs containing a single ConditionConfig that has an error creates an entry for that condition in results.children

    test('analyze with conditionConfigs === undefined does not change the results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionConfig = {
            conditionType: 'testCondition'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with conditionConfigs = null is an error with message "Must be an array with at least one condition"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: null!
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionConfigs',
            'Must be an array with at least one condition',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionConfigs = [] is an error with message "Must be an array with at least one condition"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: []
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionConfigs',
            'Must be an array with at least one condition',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionConfigs = a number is an error with message "Must be an array with at least one condition"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: 3 as any
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'conditionConfigs',
            'Must be an array with at least one condition',
            ConfigIssueSeverity.error);

    });
    test('analyze with conditionConfigs containing a single ConditionConfig that has no errors creates an entry for that condition in results.children', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: [{ conditionType: 'testCondition' }]
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(1);
        expect(chdConfigResults.children[0].conditionType).toBe('testCondition');

    });
    test('analyze with conditionConfigs containing 3 ConditionConfigs has 3 entries in results.children', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: [{ conditionType: 'testCondition' },
                                { conditionType: 'testCondition2' },
                                { conditionType: 'testCondition3' }]
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(3);
        expect(chdConfigResults.children[0].conditionType).toBe('testCondition');
        expect(chdConfigResults.children[1].conditionType).toBe('testCondition2');
        expect(chdConfigResults.children[2].conditionType).toBe('testCondition3');

    });
    test('analyze with conditionConfigs containing a single ConditionConfig that has an error creates an entry for that condition in results.children', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: [{ conditionType: ' testCondition2 ' }]
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(1);
        expect(chdConfigResults.children[0].conditionType).toBe('testCondition2');
        checkConfigPropertyResultsFromArray(chdConfigResults.children[0].properties, 0,
            'conditionType',
            'whitespace',
            ConfigIssueSeverity.error);

    });
    // similar with 3 test cases, only the second has an error with a property result for conditionType
    test('analyze with conditionConfigs containing 3 ConditionConfigs where the 2nd has a minor issue with conditionType name', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: [{ conditionType: 'testCondition' },
                                { conditionType: ' testCondition2 ' },
                                { conditionType: 'testCondition3' }]
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(3);
        expect(chdConfigResults.children[0].conditionType).toBe('testCondition');
        expect(chdConfigResults.children[1].conditionType).toBe('testCondition2');
        expect(chdConfigResults.children[2].conditionType).toBe('testCondition3');
        checkConfigPropertyResultsFromArray(chdConfigResults.children[1].properties, 0,
            'conditionType',
            'whitespace',
            ConfigIssueSeverity.error);

        expect(chdConfigResults.children[0].properties).toHaveLength(0);
        expect(chdConfigResults.children[2].properties).toHaveLength(0);

    });
    // similar with 3 test cases, only the second has an error blocking further analysis
    test('analyze with conditionConfigs containing 3 ConditionConfigs where the 2nd has a unknown conditiontype', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithChildrenPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithChildrenBaseConfig = {
            conditionType: 'testCondition',
            conditionConfigs: [{ conditionType: 'testCondition' },
                                { conditionType: 'notRegistered' },
                                { conditionType: 'testCondition3' }]
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(3);
        let chdConfigResults1 = chdConfigResults.children[1] as ConditionConfigWithChildrenResults;
        expect(chdConfigResults1.properties).toHaveLength(0);
        expect(chdConfigResults1.conditionType).toBe('notRegistered');
        expect(chdConfigResults1.children).toBeUndefined();
        expect(chdConfigResults1.message).toContain('ConditionType not registered');
        expect(chdConfigResults1.severity).toBe(ConfigIssueSeverity.error);

        expect(chdConfigResults.children[0].conditionType).toBe('testCondition');
        expect(chdConfigResults.children[2].conditionType).toBe('testCondition3');

        expect(chdConfigResults.children[0].properties).toHaveLength(0);
        expect(chdConfigResults.children[2].properties).toHaveLength(0);

    });    
});

describe('ConditionWithOneChildPropertyAnalyzer class', () => {
    // test cases:
    // 1. analyze with childConditionConfig === undefined does not change the results
    // 2. analyze with childConditionConfig = null is an error with message "Must be a condition object"
    // 4. analyze with childConditionConfig = a number is an error with message "Must be a condition object"
    // 5. analyze with childConditionConfig containing a ConditionConfig that has no errors creates an entry for that condition in results.child
    // 6. analyze with childConditionConfig containing a ConditionConfig that has an error creates an entry for that condition in results.child

    test('analyze with childConditionConfig === undefined does not change the results', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithOneChildPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithOneChildBaseConfig = {
            conditionType: 'testCondition',
            childConditionConfig: undefined!
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);

        expect(results.properties).toHaveLength(0);
    });
    test('analyze with childConditionConfig = null is an error with message "Must be a condition object"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithOneChildPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithOneChildBaseConfig = {
            conditionType: 'testCondition',
            childConditionConfig: null!
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'childConditionConfig',
            'Must be a condition object',
            ConfigIssueSeverity.error);

    });
    test('analyze with childConditionConfig = a number is an error with message "Must be a condition object"', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithOneChildPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithOneChildBaseConfig = {
            conditionType: 'testCondition',
            childConditionConfig: 3 as any
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'childConditionConfig',
            'Must be a condition object',
            ConfigIssueSeverity.error);

    });
    test('analyze with childConditionConfig containing a ConditionConfig that has no errors creates an entry for that condition in results.child', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithOneChildPropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: ConditionWithOneChildBaseConfig = {
            conditionType: 'testCondition',
            childConditionConfig: { conditionType: 'testCondition' }
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        let chdConfigResults = results as ConditionConfigWithChildrenResults;
        expect(chdConfigResults.children).toBeDefined();
        expect(chdConfigResults.children).toHaveLength(1);
        expect(chdConfigResults.children[0].conditionType).toBe('testCondition');
        expect(chdConfigResults.children[0].properties).toHaveLength(0);

    });
});

describe('ConditionWithValueHostNamePropertyAnalyzer class', () => {
    // this uses AnalysisResultsHelper.checkValueHostNameExists
    // which is fully tested elsewhere.
    // Here we ensure that when a ConditionPropertyResult is created,
    // it has the correct property name, 'valueHostName'
    // There will be these tests:
    // 1. valueHostName is valid syntax but does not exist adds a ConditionPropertyResult
    // 2. valueHostName is valid syntax and exists in results.valueHostNames array does not add a ConditionPropertyResult

    test('valueHostName is valid syntax but does not exist adds a ConditionPropertyResult', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithValueHostNamePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: OneValueConditionBaseConfig = {
            conditionType: 'testCondition',
            valueHostName: 'testValueHost'
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'valueHostName',
            'ValueHostName does not exist',
            ConfigIssueSeverity.error);

    });
    test('valueHostName is valid syntax and exists in results.valueHostNames array does not add a ConditionPropertyResult', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithValueHostNamePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: OneValueConditionBaseConfig = {
            conditionType: 'testCondition',
            valueHostName: 'testValueHost'
        };
        let results = createConditionResults(config);
        helper.results.valueHostNames = ['testValueHost'];
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    
});
describe('ConditionWithSecondValueHostNamePropertyAnalyzer class', () => {
    // this uses AnalysisResultsHelper.checkValueHostNameExists
    // which is fully tested elsewhere.
    // Here we ensure that when a ConditionPropertyResult is created,
    // it has the correct property name, 'valueHostName'
    // There will be these tests:
    // 1. valueHostName is valid syntax but does not exist adds a ConditionPropertyResult
    // 2. valueHostName is valid syntax and exists in results.valueHostNames array does not add a ConditionPropertyResult
    test('secondValueHostName is valid syntax but does not exist adds a ConditionPropertyResult', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValueHostNamePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValueHostName: 'testValueHost2',
            valueHostName: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'secondValueHostName',
            'ValueHostName does not exist',
            ConfigIssueSeverity.error);

    });
    test('secondValueHostName is valid syntax and exists in results.valueHostNames array does not add a ConditionPropertyResult', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValueHostNamePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValueHostName: 'testValueHost2',
            valueHostName: null
        };
        let results = createConditionResults(config);
        helper.results.valueHostNames = ['testValueHost2'];
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });

    // write a function that will test the secondvalueHostName is undefined based on conditionType.
    // Parameter for expected result. If conditionType is expected, undefined is illegal and reports an error.
    // If not, no errors.

    function testSecondValueHostNameUndefined(conditionType: string, expectedError: boolean) {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValueHostNamePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        let config: CompareToSecondValueHostConditionBaseConfig = {
            conditionType: conditionType,
            secondValueHostName: undefined!,
            valueHostName: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        if (expectedError) {
            checkConfigPropertyResultsFromArray(results.properties, 0,
                'secondValueHostName',
                'Value must be defined',
                ConfigIssueSeverity.error);
        } else {
            expect(results.properties).toHaveLength(0);
        }
    }
    // tests cases all in one function.
    // These conditiontypes will have an error: EqualTo, NotEqualTo, GreaterThan, GreaterThanOrEqualTo, LessThan, LessThanOrEqualTo
    // These will not have an error: EqualToValue, NotEqualToValue, Range, NotNull
    test('secondValueHostName is undefined, reports "Value must be defined" error for EqualTo, NotEqualTo, GreaterThan, GreaterThanOrEqualTo, LessThan, LessThanOrEqualTo', () => {
        testSecondValueHostNameUndefined(ConditionType.EqualTo, true);
        testSecondValueHostNameUndefined(ConditionType.NotEqualTo, true);
        testSecondValueHostNameUndefined(ConditionType.GreaterThan, true);
        testSecondValueHostNameUndefined(ConditionType.GreaterThanOrEqual, true);
        testSecondValueHostNameUndefined(ConditionType.LessThan, true);
        testSecondValueHostNameUndefined(ConditionType.LessThanOrEqual, true);
        testSecondValueHostNameUndefined(ConditionType.EqualToValue, false);
        testSecondValueHostNameUndefined(ConditionType.NotEqualToValue, false);
        testSecondValueHostNameUndefined(ConditionType.Range, false);
        testSecondValueHostNameUndefined(ConditionType.NotNull, false);
    });
});

describe('ConditionWithSecondValuePropertyAnalyzer class', () => {
    // With dataType=LookupKey.String and secondValue assigned to "ABC", no issues to report

    test('secondValue is assigned to "ABC" and dataType=LookupKey.String, no issues to report', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValuePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToValueConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValue: 'ABC',
            valueHostName: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });
    // With dataType=LookupKey.Number and the secondValue="123",
    // use conversionLookupKey = Number and NumericStringToNumberConverter to 
    // prove teh value is OK and no issues to report
    test('secondValue is assigned to "123" and dataType=LookupKey.Number, no issues to report', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValuePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.Number;
        let config: CompareToValueConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValue: '123',
            valueHostName: null,
            conversionLookupKey: LookupKey.Number
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        expect(results.properties).toHaveLength(0);

    });

    // Same but no possible conversion is an error. secondValue=true, dataType=LookupKey.Boolean, and no conversionLookupKey
    test('secondValue = true and dataType=LookupKey.Boolean, secondConversionLookupKey=Number, reports "Value cannot be converted to Lookup Key" error', () => {
        let services = createServicesForTheseTests();
        services.dataTypeConverterService.register(new NumericStringToNumberConverter());
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValuePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.Boolean;
        let config: CompareToValueConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValue: true,
            valueHostName: null,
            secondConversionLookupKey: LookupKey.Number
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'secondValue',
            'Value cannot be converted to Lookup Key',
            ConfigIssueSeverity.error);

    });
    // secondValue = null, reports an error
    test('secondValue = null, reports "Value must be defined" warning', () => {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValuePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToValueConditionBaseConfig = {
            conditionType: 'testCondition',
            secondValue: null,
            valueHostName: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        checkConfigPropertyResultsFromArray(results.properties, 0,
            'secondValue',
            'Value should not be null.',
            ConfigIssueSeverity.warning);

    });
    function testSecondValueUndefined(conditionType: string, expectedError: boolean) {
        let services = createServicesForTheseTests();
        let helper = setupHelperForTheseTests(services);

        let testItem = new ConditionWithSecondValuePropertyAnalyzer();
        let valueHostConfig = createValueHostConfig();
        valueHostConfig.dataType = LookupKey.String;
        let config: CompareToValueConditionBaseConfig = {
            conditionType: conditionType,
            secondValue: undefined,
            valueHostName: null
        };
        let results = createConditionResults(config);
        testItem.analyze(config, results, valueHostConfig, helper);
        if (expectedError) {
            checkConfigPropertyResultsFromArray(results.properties, 0,
                'secondValue',
                'Value must be defined',
                ConfigIssueSeverity.error);
        } else {
            expect(results.properties).toHaveLength(0);
        }
    }
    // test against that function for these conditionTypes:
    // These expect an error: EqualToValue, NotEqualToValue...
    // These do not expect an error: Range, NotNull, EqualTo, NotEqualTo
    // All tests can be in one test function.
    // Use ConditionType.EqualTo, etc. to get the conditionType string
    test('secondValue = undefined, reports "Value must be defined" error for EqualTo, NotEqualTo, GreaterThan, GreaterThanOrEqualTo, LessThan, LessThanOrEqualTo', () => {
        testSecondValueUndefined(ConditionType.EqualToValue, true);
        testSecondValueUndefined(ConditionType.NotEqualToValue, true);
        testSecondValueUndefined(ConditionType.GreaterThanValue, true);
        testSecondValueUndefined(ConditionType.GreaterThanOrEqualValue, true);
        testSecondValueUndefined(ConditionType.LessThanValue, true);
        testSecondValueUndefined(ConditionType.LessThanOrEqualValue, true);
        testSecondValueUndefined(ConditionType.Range, false);
        testSecondValueUndefined(ConditionType.NotNull, false);
        testSecondValueUndefined(ConditionType.EqualTo, false);
        testSecondValueUndefined(ConditionType.NotEqualTo, false);

    });


    
});