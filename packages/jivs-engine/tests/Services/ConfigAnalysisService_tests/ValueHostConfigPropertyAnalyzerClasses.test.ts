import { LookupKey } from "../../../src/DataTypes/LookupKeys";
import { CalcValueHostConfig } from "../../../src/Interfaces/CalcValueHost";
import { CAIssueSeverity, LocalizedPropertyCAResult, ValueHostConfigCAResult, CAFeature } from "../../../src/Interfaces/ConfigAnalysisService";
import { IValidationServices, ServiceName } from "../../../src/Interfaces/ValidationServices";
import { ValueHostConfig } from "../../../src/Interfaces/ValueHost";
import { ValueHostType } from "../../../src/Interfaces/ValueHostFactory";
import { AnalysisResultsHelper } from "../../../src/Services/ConfigAnalysisService/AnalysisResultsHelper";

import {
    checkValueHostConfigResults,
    checkPropertyCAResultsFromArray, checkLookupKeyIssue, checkLocalizedPropertyResult, createServices,
    setupHelper,
    checkLookupKeyResultsForService,
    checkServiceInfoForCultureSpecificParserRetrieval
} from "./support";
import { CalcFnPropertyAnalyzer, DataTypePropertyAnalyzer, LabelPropertiesAnalyzer, ParserLookupKeyPropertyAnalyzer, ValueHostNamePropertyAnalyzer, ValueHostTypePropertyAnalyzer } from "../../../src/Services/ConfigAnalysisService/ValueHostConfigPropertyAnalyzerClasses";
import { InputValueHostConfig } from "../../../src/Interfaces/InputValueHost";
import { PropertyValueHostConfig } from "../../../src/Interfaces/PropertyValueHost";
import { NumberParser } from "../../../src/DataTypes/DataTypeParsers";
import { DataTypeParserService } from "../../../src/Services/DataTypeParserService";
import { DataTypeParserLookupKeyAnalyzer } from "../../../src/Services/ConfigAnalysisService/DataTypeParserLookupKeyAnalyzer";

/**
 * 
 * @param services 
 * @param config 
 * @param addCultures - set to empty array if already configured
 * @returns 
 */
function setupForTheseTests(services: IValidationServices,
    config: ValueHostConfig): {
    helper: AnalysisResultsHelper<IValidationServices>
    results: ValueHostConfigCAResult
    } {
        
    let helper = setupHelper(services);
    // this should emulate the ValueHostConfigAnalyzer.analyze() function's creation of the results
    let results: ValueHostConfigCAResult = {
        feature: CAFeature.valueHost,
        config: config,
        valueHostName: config.name,
        properties: []
    };

    return { helper: helper, results: results };
}

describe('ValueHostTypePropertyAnalyzer class', () => {
    test('should add a config issue when valueHostType is missing', () => {
        const testValueHostConfig: ValueHostConfig = {
            name: 'testValueHost',
            dataType: LookupKey.Number,
        };
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);

        checkValueHostConfigResults(setup.results, 'testValueHost');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostType',
            'not recognized by the ValueHostFactory', CAIssueSeverity.error);
    });
    //  valueHostType is unknown adds a configIssue on valueHostType field
    test('should add a config issue when valueHostType is unknown', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: 'unknown',
            name: 'testValueHost',
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);

        checkValueHostConfigResults(setup.results, 'testValueHost');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostType',
            'not recognized by the ValueHostFactory', CAIssueSeverity.error);
    });
    // no error for ValueHostType.Calc
    test('should not add a config issue when valueHostType is Calc', () => {
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: ValueHostType.Calc,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: ()=> 1
        };
        // let services = createServices();
        // let testItem = setupTestItem(services, true);

        // executeGatherInValueHostConfig(testItem, testValueHostConfig, 1, 0);
        // let ci = checkConfigIssue(testItem, 0, 'testValueHost');
        // expect(ci.properties).toHaveLength(0);
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });
    // no error for ValueHostType.Static
    test('should not add a config issue when valueHostType is Static', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
        };
        // let services = createServices();
        // let testItem = setupTestItem(services, true);

        // executeGatherInValueHostConfig(testItem, testValueHostConfig, 1, 0);
        // let ci = checkConfigIssue(testItem, 0, 'testValueHost');
        // expect(ci.properties).toHaveLength(0);
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });    
    test('should not add a config issue when valueHostType is Input', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            validatorConfigs: [],
        };
        // let services = createServices();
        // let testItem = setupTestItem(services, true);

        // executeGatherInValueHostConfig(testItem, testValueHostConfig, 1, 0);
        // let ci = checkConfigIssue(testItem, 0, 'testValueHost');
        // expect(ci.properties).toHaveLength(0);
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });
    // no error for ValueHostType.Static
    test('should not add a config issue when valueHostType is Property', () => {
        const testValueHostConfig: PropertyValueHostConfig = {
            valueHostType: ValueHostType.Property,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            validatorConfigs: [],   
        };
        // let services = createServices();
        // let testItem = setupTestItem(services, true);

        // executeGatherInValueHostConfig(testItem, testValueHostConfig, 1, 0);
        // let ci = checkConfigIssue(testItem, 0, 'testValueHost');
        // expect(ci.properties).toHaveLength(0);
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostTypePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });    
});

describe('ValueHostNamePropertyAnalyzer class', () => {
    // valueHostName has whitespace is a configIssue
    test('should add a config issue when valueHostType has whitespace', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: ' testValueHost ',
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostNamePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, ' testValueHost ');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostName',
            'leading or trailing whitespace', CAIssueSeverity.error);
    });
    // valueHostName is null is a configIssue
    test('should add config issue when valueHostName is null', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: null!,
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostNamePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostName',
            'no name assigned', CAIssueSeverity.error);
    });
    // valueHostName is empty string is a configIssue
    test('should add config issue when valueHostName is an empty string', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: '',
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostNamePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);

        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostName',
            'no name assigned', CAIssueSeverity.error);
    });
    // valueHostName is whitespace is a configIssue
    test('should add config issue when valueHostName is whitespace', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: '  ',
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new ValueHostNamePropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'valueHostName',
            'no name assigned', CAIssueSeverity.error);
    });

});

describe('DataTypePropertyAnalyzer class', () => {
    describe('dataType property', () => {
        // dataType is null is a configIssue
        test('should add a warning config issue when dataType is null', () => {
            const testValueHostConfig: ValueHostConfig = {
                valueHostType: ValueHostType.Static,
                name: 'testValueHost',
                dataType: null!,
            };

            let services = createServices();
            let setup = setupForTheseTests(services, testValueHostConfig);
            let testItem = new DataTypePropertyAnalyzer();
            testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
            checkValueHostConfigResults(setup.results, 'testValueHost');
            checkPropertyCAResultsFromArray(setup.results.properties, 0, 'dataType',
                'No dataType assigned', CAIssueSeverity.info);

        });
        // dataType is custom is a lookupKeyIssue, but not config issue
        test('should add a lookupKeyIssue when dataType is custom but not configIssue', () => {
            const testValueHostConfig: ValueHostConfig = {
                valueHostType: ValueHostType.Static,
                name: 'testValueHost',
                dataType: 'custom',
            };

            let services = createServices();
            let setup = setupForTheseTests(services, testValueHostConfig);
            let testItem = new DataTypePropertyAnalyzer();
            testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
            checkValueHostConfigResults(setup.results, 'testValueHost');

            checkPropertyCAResultsFromArray(setup.results.properties, 0, 'dataType',
                'Lookup key "custom" is unknown', CAIssueSeverity.info);
            checkLookupKeyIssue(setup.helper.results, 0, 'custom', 'not already known');
        });
        // dataType is LookupKey.Number is no configIssue
        test('should not add a config issue when dataType is LookupKey.Number', () => {
            const testValueHostConfig: ValueHostConfig = {
                valueHostType: ValueHostType.Static,
                name: 'testValueHost',
                dataType: LookupKey.Number,
            };

            let services = createServices();
            let setup = setupForTheseTests(services, testValueHostConfig);
            let testItem = new DataTypePropertyAnalyzer();
            testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
            expect(setup.results.properties).toHaveLength(0);
            expect(setup.helper.results.lookupKeysIssues).toHaveLength(0);
        });
        // when valueHostConfig itself is null, it uses config as a source
        test('should not add a config issue when valueHostConfig is null', () => {
            const testValueHostConfig: ValueHostConfig = {
                valueHostType: ValueHostType.Static,
                name: 'testValueHost',
                dataType: LookupKey.Number,
            };

            let services = createServices();
            let setup = setupForTheseTests(services, testValueHostConfig);
            let testItem = new DataTypePropertyAnalyzer();
            testItem.analyze(testValueHostConfig, setup.results, null, setup.helper);
            expect(setup.results.properties).toHaveLength(0);
            expect(setup.helper.results.lookupKeysIssues).toHaveLength(0);
        });
    });    
});
describe('LabelPropertiesAnalyzer class', () => {

    // labell10n not declared in TextLocalizerService is a configIssue
    test('no match in TextLocalizerService, has both label and label10n, 1 culture results in LocalizedResultProperty with 1 culture containing warning about using fallback.', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: 'testLabel',
            labell10n: 'testLabelL10n',
        };

        let services = createServices(['en']);

        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 1, 'en', 'en', undefined, true);
    });
    // same with 3 cultures, all reporting the same severity/message
    test('no match in TextLocalizerService, has both label and label10n, 3 culture results in LocalizedResultProperty with 3 cultures each containing warning about using fallback.', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: 'testLabel',
            labell10n: 'testLabelL10n',
        };

        let services = createServices(['en', 'es', 'fr']);
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 3, 'en', 'en', undefined, true);
        checkLocalizedPropertyResult(pi, 'label', 3, 'es', 'es', undefined, true);
        checkLocalizedPropertyResult(pi, 'label', 3, 'fr', 'fr', undefined, true);
    });
    // same but label is null, so the error message is different
    test('no match in TextLocalizerService, has label10n but label=null (so no fallback), 1 culture results in LocalizedResultProperty with 1 culture containing warning about \"No text will be used\".', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: null!,
            labell10n: 'testLabelL10n',
        };

        let services = createServices(['en', 'es', 'fr']);
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 3, 'en', 'en', undefined, false);
        checkLocalizedPropertyResult(pi, 'label', 3, 'es', 'es', undefined, false);
        checkLocalizedPropertyResult(pi, 'label', 3, 'fr', 'fr', undefined, false);
    });
    // same but label is empty string, which is considered a legal result
    test('no match in TextLocalizerService, has label10n and label="", 1 culture results in LocalizedResultProperty with 1 culture containing warning about \"No text will be used\".', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: '',
            labell10n: 'testLabelL10n',
        };

        let services = createServices(['en', 'es', 'fr']);
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 3, 'en', 'en', undefined, true);
        checkLocalizedPropertyResult(pi, 'label', 3, 'es', 'es', undefined, true);
        checkLocalizedPropertyResult(pi, 'label', 3, 'fr', 'fr', undefined, true);
    });
    // TextLocalizerService has unique matching text for each of the 3 cultures will result in the CultureInfo.text property used and containing the value from the TextLocalizerService
    test('match in TextLocalizerService, has both label and label10n, 3 culture results in LocalizedResultProperty with 3 cultures each containing the text from the TextLocalizerService.', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: 'testLabel',
            labell10n: 'testLabelL10n',
        };

        let services = createServices(['en', 'es', 'fr']);
        services.textLocalizerService.register('testLabelL10n',
            {
                'en': 'testLabelL10n-en',
                'es': 'testLabelL10n-es',
                'fr': 'testLabelL10n-fr'
            });
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 3, 'en', 'en', 'testLabelL10n-en', undefined);
        checkLocalizedPropertyResult(pi, 'label', 3, 'es', 'es', 'testLabelL10n-es', undefined);
        checkLocalizedPropertyResult(pi, 'label', 3, 'fr', 'fr', 'testLabelL10n-fr', undefined);
    });
    // using these cultures: 'en-US', 'en' where 'en' is also a fallback. TextLocalizerService has matching text.
    test('match in TextLocalizerService only to the fallback culture "en", has both label and label10n, 2 culture results in LocalizedResultProperty with 2 cultures each containing the text from the TextLocalizerService.', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            label: 'testLabel',
            labell10n: 'testLabelL10n',
        };

        let services = createServices([]);
        services.textLocalizerService.register('testLabelL10n',
            {
                'en': 'testLabelL10n-en',
            });
        services.cultureService.register({ cultureId: 'en', fallbackCultureId: null });
        services.cultureService.register({ cultureId: 'en-US', fallbackCultureId: 'en' });
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new LabelPropertiesAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        let pi = checkPropertyCAResultsFromArray(setup.results.properties, 0, 'label',
            undefined, undefined) as LocalizedPropertyCAResult;
        checkLocalizedPropertyResult(pi, 'label', 2, 'en', 'en', 'testLabelL10n-en', undefined);
        checkLocalizedPropertyResult(pi, 'label', 2, 'en-US', 'en', 'testLabelL10n-en', undefined);
    });
    
});

describe('ParserLookupKeyPropertyAnalyzer class', () => {
    // NOTE: This uses AnalysisResultsHelper.checkLookupKeyProperty() which has a full suite of tests
    test('parserLookupKey is null results in no propertyIssues for that property. No other declared property has an error so the total valueHostResults = 0', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            parserLookupKey: null,
            validatorConfigs: [],
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        setup.helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(setup.helper.analysisArgs));        
        let testItem = new ParserLookupKeyPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);

    });
    // same but with undefined
    test('parserLookupKey is undefined results in no propertyIssues for that property. No other declared property has an error so the total valueHostResults = 0', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            parserLookupKey: undefined,
            validatorConfigs: [],
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        setup.helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(setup.helper.analysisArgs));        
        let testItem = new ParserLookupKeyPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });

    // pass in a parserLookupKey that is unknown, but not null
    test('parserLookupKey is custom without a fallback results in a propertyIssue for that property. No other declared property has an error so the total valueHostResults = 1', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            parserLookupKey: 'custom',
            validatorConfigs: [],
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        setup.helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(setup.helper.analysisArgs));
        let testItem = new ParserLookupKeyPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkPropertyCAResultsFromArray(setup.results.properties, 0,
            'parserLookupKey',
            'Not found', CAIssueSeverity.error);
        checkLookupKeyIssue(setup.helper.results, 0, 'custom', 'not already known');
    });
    // pass in a parserLookupKey that is unknown, but not null
    test('parserLookupKey is custom but has a LookupKeyFallback that is registered results in a propertyIssue for that property', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            parserLookupKey: 'custom',
            validatorConfigs: [],
        };

        let services = createServices();
        services.lookupKeyFallbackService.register('custom', LookupKey.Number);
        let setup = setupForTheseTests(services, testValueHostConfig);
        setup.helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(setup.helper.analysisArgs));
        let testItem = new ParserLookupKeyPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkPropertyCAResultsFromArray(setup.results.properties, 0,
            'parserLookupKey',
            'it will also try the Lookup Key "Number"', CAIssueSeverity.warning);
        expect(setup.helper.results.lookupKeysIssues).toHaveLength(0);

    });

    // register a parser and use its lookupKey. Should not result in a PropertyCAResult
    test('parserLookupKey is known results in no PropertyCAResult for that property. No other declared property has an error so the total valueHostResults = 0', () => {
        const testValueHostConfig: InputValueHostConfig = {
            valueHostType: ValueHostType.Input,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            parserLookupKey: LookupKey.Number,  // expecting to use NumberParser
            validatorConfigs: [],
        };
        let services = createServices();
        let parserServices = new DataTypeParserService();
        services.dataTypeParserService = parserServices;
        parserServices.services = services;
        let parserInstance = new NumberParser(['en'],
            { decimalSeparator: '.', thousandsSeparator: ',', negativeSymbol: '-' });
        services.dataTypeParserService.register(parserInstance);

        let setup = setupForTheseTests(services, testValueHostConfig);
        setup.helper.registerLookupKeyAnalyzer(ServiceName.parser, new DataTypeParserLookupKeyAnalyzer(setup.helper.analysisArgs));        
        let testItem = new ParserLookupKeyPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0); // no PropertyCAResult added

        let serviceInfo = checkLookupKeyResultsForService(
            setup.helper.results.lookupKeyResults, LookupKey.Number, ServiceName.parser);
        
        checkServiceInfoForCultureSpecificParserRetrieval(serviceInfo, 0, 0, 'en', 'NumberParser', NumberParser);
    });
});
describe('CalcFnPropertyAnalyzer class', () => {
    // should not make any changes when config.valueHostType != ValueHostType.Calc
    test('should not make any changes when config.valueHostType != ValueHostType.Calc', () => {
        const testValueHostConfig: ValueHostConfig = {
            valueHostType: ValueHostType.Static,
            name: 'testValueHost',
            dataType: LookupKey.Number,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new CalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig as any, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });
    // should not make any changes if valueHostType is correct and calcFn is defined as a function
    test('should not make any changes when config.valueHostType == ValueHostType.Calc and calcFn is a function', () => {
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: ValueHostType.Calc,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: () => 42,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new CalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });

    // calcFn is null adds a propertyCAResult with an error
    test('calcFn is null adds a propertyCAResult with an error', () => {
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: ValueHostType.Calc,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: null!,
        };
        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new CalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'calcFn',
            'Function required', CAIssueSeverity.error);
    });
    // calcFn is undefined is a configIssue
    test('calcFn is undefined adds a propertyCAResult with an error', () => {
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: ValueHostType.Calc,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: undefined!,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new CalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'calcFn',
            'Function required', CAIssueSeverity.error);
    });
    // calcFn is not a function adds a propertyCAResult with an error
    test('calcFn is not a function adds a propertyCAResult with an error', () => {
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: ValueHostType.Calc,
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: 42 as any,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new CalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        checkValueHostConfigResults(setup.results, 'testValueHost');
        checkPropertyCAResultsFromArray(setup.results.properties, 0, 'calcFn',
            'Value must be a function', CAIssueSeverity.error);
    });
    // subclass CalcFnPropertyAnalyzer to override its calcValueHostType with "TEST" and write a test to confirm it works
    test('user should be able to subclass CalcFnPropertyAnalyzer and override calcValueHostType with "TEST" to support custom CalcValueHostConfigs', () => {
        class TestCalcFnPropertyAnalyzer extends CalcFnPropertyAnalyzer {
            protected get calcValueHostType(): string
            {
                return 'TEST';
            }
        }
        const testValueHostConfig: CalcValueHostConfig = {
            valueHostType: 'TEST',
            name: 'testValueHost',
            dataType: LookupKey.Number,
            calcFn: () => 42,
        };

        let services = createServices();
        let setup = setupForTheseTests(services, testValueHostConfig);
        let testItem = new TestCalcFnPropertyAnalyzer();
        testItem.analyze(testValueHostConfig, setup.results, testValueHostConfig, setup.helper);
        expect(setup.results.properties).toHaveLength(0);
    });
});
