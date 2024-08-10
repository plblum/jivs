import { UTCDateOnlyConverter } from '@plblum/jivs-engine/build/DataTypes/DataTypeConverters';
import { ShortDatePatternParser } from '@plblum/jivs-engine/build/DataTypes/DataTypeParsers';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ConditionType } from '@plblum/jivs-engine/build/Conditions/ConditionTypes';
import { LessThanOrEqualConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { JsonConfigAnalysisOutputFormatter } from '@plblum/jivs-engine/build/ConfigAnalysis/ConfigAnalysisOutputFormatterClasses';
import {
    hasErrorsThenReportEverythingToLogger, prepareBuilder, reportToConsole,
    throwOnErrors, throwOnErrorsWritingToConsole, throwOnErrorsWritingToLoggerService
} from '../src/Using_ConfigAnalysisService';
import { createMinimalValidationServices, registerConfigAnalyzers } from '../src/support';
import { ConsoleConfigAnalysisOutputter } from '@plblum/jivs-engine/build/ConfigAnalysis/ConfigAnalysisOutputterClasses';
import { LessThanOrEqualCondition, RequireTextCondition, RequireTextConditionConfig } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { CAIssueSeverity } from '@plblum/jivs-engine/build/Interfaces/ConfigAnalysisService';
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { CAFeature } from '@plblum/jivs-engine/build/Interfaces/ConfigAnalysisService';
import { JsonConsoleConfigAnalysisOutputter } from '@plblum/jivs-engine/build/ConfigAnalysis/ConfigAnalysisOutputterClasses';
import { LessThanOrEqualValueConditionConfig, LessThanOrEqualValueCondition } from '@plblum/jivs-engine/build/Conditions/ConcreteConditions';

/**
 * ValidationServices without anything registered
 * other than what the ConfigAnalysisService needs.
 * @returns 
 */
function createBasicServices(): IValidationServices
{
    let services = createMinimalValidationServices('en');
    registerConfigAnalyzers(services.configAnalysisService);

    return services;
}
describe('Demonstrate the results from various use cases', () => {
    describe('With error-free configuration and services, generate a report to explore it', () => {
        test('Report with all valueHostConfig results', () => {
            let services = createBasicServices();    // start with no populated services.
            // Our prepareBuilder function expects these service configurations to be registered:
            services.conditionFactory.register<LessThanOrEqualConditionConfig>(
                ConditionType.LessThanOrEqual,
                (config) => new LessThanOrEqualCondition(config));
            
            let builder = prepareBuilder(services);
            let explorer = builder.analyze();
            expect(() => explorer.throwOnErrors()).not.toThrow();
            
            const includeValueHostResults = true;
            const includeLookupKeyResults = false;
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);
// -> THIS ONE IS LONG!
// {
//     "valueHostQueryResults": [
//         {
//         "path": {
//             "ValueHost": "numOfDays"
//         },
//         "result": {
//             "feature": "ValueHost",
//             "valueHostName": "numOfDays",
//             "properties": [],
//             "config": {
//             "initialValue": 10,
//             "name": "numOfDays",
//             "valueHostType": "Static",
//             "dataType": "Integer"
//             }
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "diffDays"
//         },
//         "result": {
//             "feature": "ValueHost",
//             "valueHostName": "diffDays",
//             "properties": [],
//             "config": {
//             "valueHostType": "Calc",
//             "name": "diffDays",
//             "calcFn": "[Function differenceBetweenDates]",
//             "dataType": "Integer"
//             }
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "startDate"
//         },
//         "result": {
//             "feature": "ValueHost",
//             "valueHostName": "startDate",
//             "properties": [
//             {
//                 "feature": "Property",
//                 "propertyName": "dataType",
//                 "severity": "info",
//                 "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//             }
//             ],
//             "config": {
//             "label": "Start date",
//             "name": "startDate",
//             "valueHostType": "Input",
//             "validatorConfigs": [
//                 {
//                 "errorCode": "NumOfDays",
//                 "errorMessage": "Less than {compareTo} days apart",
//                 "conditionConfig": {
//                     "valueHostName": "diffDays",
//                     "secondValueHostName": "numOfDays",
//                     "conditionType": "LessThanOrEqual"
//                 }
//                 }
//             ]
//             },
//             "validatorResults": [
//             {
//                 "feature": "Validator",
//                 "errorCode": "NumOfDays",
//                 "config": {
//                 "errorCode": "NumOfDays",
//                 "errorMessage": "Less than {compareTo} days apart",
//                 "conditionConfig": {
//                     "valueHostName": "diffDays",
//                     "secondValueHostName": "numOfDays",
//                     "conditionType": "LessThanOrEqual"
//                 }
//                 },
//                 "properties": [],
//                 "conditionResult": {
//                 "feature": "Condition",
//                 "conditionType": "LessThanOrEqual",
//                 "config": {
//                     "valueHostName": "diffDays",
//                     "secondValueHostName": "numOfDays",
//                     "conditionType": "LessThanOrEqual"
//                 },
//                 "properties": []
//                 }
//             }
//             ]
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "startDate",
//             "Property": "dataType"
//         },
//         "result": {
//             "feature": "Property",
//             "propertyName": "dataType",
//             "severity": "info",
//             "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "startDate",
//             "Validator": "NumOfDays"
//         },
//         "result": {
//             "feature": "Validator",
//             "errorCode": "NumOfDays",
//             "config": {
//             "errorCode": "NumOfDays",
//             "errorMessage": "Less than {compareTo} days apart",
//             "conditionConfig": {
//                 "valueHostName": "diffDays",
//                 "secondValueHostName": "numOfDays",
//                 "conditionType": "LessThanOrEqual"
//             }
//             },
//             "properties": [],
//             "conditionResult": {
//             "feature": "Condition",
//             "conditionType": "LessThanOrEqual",
//             "config": {
//                 "valueHostName": "diffDays",
//                 "secondValueHostName": "numOfDays",
//                 "conditionType": "LessThanOrEqual"
//             },
//             "properties": []
//             }
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "startDate",
//             "Validator": "NumOfDays",
//             "Condition": "LessThanOrEqual"
//         },
//         "result": {
//             "feature": "Condition",
//             "conditionType": "LessThanOrEqual",
//             "config": {
//             "valueHostName": "diffDays",
//             "secondValueHostName": "numOfDays",
//             "conditionType": "LessThanOrEqual"
//             },
//             "properties": []
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "endDate"
//         },
//         "result": {
//             "feature": "ValueHost",
//             "valueHostName": "endDate",
//             "properties": [
//             {
//                 "feature": "Property",
//                 "propertyName": "dataType",
//                 "severity": "info",
//                 "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//             }
//             ],
//             "config": {
//             "label": "End date",
//             "name": "endDate",
//             "valueHostType": "Input",
//             "validatorConfigs": []
//             },
//             "validatorResults": []
//         }
//         },
//         {
//         "path": {
//             "ValueHost": "endDate",
//             "Property": "dataType"
//         },
//         "result": {
//             "feature": "Property",
//             "propertyName": "dataType",
//             "severity": "info",
//             "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//         }
//         }
//     ]
//     }            
            
        });
        test('Report with all Lookup Key results', () => {
            // Our builder will only have a single valueHost of data Type Date,
            // with a LessThanOrEqualValue condition. It uses a parser.
            // There should be one Lookup Key, "Date", with an identifier, converter, comparer, and parser.

        // Setup Services 
           // (These are preinstalled when using the supplied createValidationServices function)
            let services = createBasicServices();    // start with no populated services.

            services.conditionFactory.register<LessThanOrEqualValueConditionConfig>(
                ConditionType.LessThanOrEqualValue,
                (config) => new LessThanOrEqualValueCondition(config));
            services.dataTypeConverterService.register(new UTCDateOnlyConverter());
            // no comparer supplied because with UTCDateOnlyConverter, the defaultComparer is used.
            services.dataTypeParserService.register(
                new ShortDatePatternParser(LookupKey.Date, ['en'], {
                    order: 'mdy',
                    shortDateSeparator: '/',
                    twoDigitYearBreak: 29
                }));
            
        // Create a builder with a single valueHost and a single condition
            let builder = services.managerConfigBuilderFactory.create() as ValidationManagerConfigBuilder;
            builder.input('BirthDate', LookupKey.Date, {
                parserLookupKey: LookupKey.Date
            }).lessThanOrEqualValue(new Date(), {
                conversionLookupKey: LookupKey.Number   // from LookupKey.Date to LookupKey.Number
            });

        // Analyze the configuration
            let explorer = builder.analyze();
            expect(() => explorer.throwOnErrors()).not.toThrow();
            
            const includeValueHostResults = false;
            const includeLookupKeyResults = true;
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);
        });
        test('Report with any warnings and info messages', () => {
            let services = createBasicServices();    // start with no populated services. That should create errors
            // Our prepareBuilder function expects these service configurations to be registered:
            services.conditionFactory.register<LessThanOrEqualConditionConfig>(
                ConditionType.LessThanOrEqual,
                (config) => new LessThanOrEqualCondition(config));
            
            let builder = prepareBuilder(services);
            let explorer = builder.analyze();
            expect(() => explorer.throwOnErrors()).not.toThrow();

            const includeValueHostResults = { severities: [CAIssueSeverity.warning, CAIssueSeverity.info] };
            const includeLookupKeyResults = { severities: [CAIssueSeverity.warning, CAIssueSeverity.info] };
            const includeCompleteResults = false;
            explorer.reportToConsole(
                includeValueHostResults,
                includeLookupKeyResults,
                includeCompleteResults, 2);
// ->
// {
// "valueHostQueryResults": [
//     {
//     "path": {
//         "ValueHost": "startDate",
//         "Property": "dataType"
//     },
//     "result": {
//         "feature": "Property",
//         "propertyName": "dataType",
//         "severity": "info",
//         "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//     }
//     },
//     {
//     "path": {
//         "ValueHost": "endDate",
//         "Property": "dataType"
//     },
//     "result": {
//         "feature": "Property",
//         "propertyName": "dataType",
//         "severity": "info",
//         "message": "No dataType assigned. LookupKeys that depend on dataType will not be checked. Otherwise this is a valid configuration, where the actual runtime value will be used to determine the lookup key."
//     }
//     }
// ],
// "lookupKeyQueryResults": []
// }            
        });
    });

    test('throwOnErrors finds an error in ValueHostConfigs', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        let builder = prepareBuilder(services);
        let explorer = builder.analyze();
        expect(() => explorer.throwOnErrors()).toThrow();
    });
    test('throwOnErrors and write to console finds an error in ValueHostConfigs', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        // Our builder expects the LessThanOrEqualCondition to be registered. It is not.
        // This is what it should look like:
        // services.conditionFactory.register<LessThanOrEqualConditionConfig>(
        //     ConditionType.LessThanOrEqual,
        //     (config) => new LessThanOrEqualCondition(config));


        let builder = prepareBuilder(services);
        let explorer = builder.analyze();
        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
        
// -> {
//     "valueHostQueryResults": [
//         {
//             "path": {
//                 "ValueHost": "startDate",
//                 "Validator": "NumOfDays",
//                 "Condition": "LessThanOrEqual"
//             },
//             "result": {
//                 "feature": "Condition",
//                 "conditionType": "LessThanOrEqual",
//                 "config": {
//                     "valueHostName": "diffDays",
//                     "secondValueHostName": "numOfDays",
//                     "conditionType": "LessThanOrEqual"
//                 },
//                 "properties": [],
//                 "severity": "error",
//                 "message": "ConditionType not registered: LessThanOrEqual"
//             }
//         }
//     ],
//     "lookupKeyQueryResults": []
// }

    });

    test('Services lack a needed parser, report as an error', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        registerConfigAnalyzers(services.configAnalysisService);
        // we need the LessThanOrEqual condition
        services.conditionFactory.register<LessThanOrEqualConditionConfig>(
            ConditionType.LessThanOrEqual,
            (config) => new LessThanOrEqualCondition(config));
        // Our builder expects a parser for the ShortDatePatternParser, which is not registered.
        // This is what it might look like:
        // services.dataTypeParserService.register(new ShortDatePatternParser(LookupKey.Date, ['en-US'], {
        //     order: 'mdy',
        //     shortDateSeparator: '/',
        //     twoDigitYearBreak: 29
        // }));
        
        let builder = prepareBuilder(services);
        builder.input('NewField', LookupKey.Date, 
            {
                parserLookupKey: LookupKey.Date,    // wants a parser, which should be ShortDatePatternParser
            }
        )
        let explorer = builder.analyze();
        // explorer.reportToConsole({ severities: [CAIssueSeverity.error] }, 
        //     { severities: [CAIssueSeverity.error]}, false, 2);

        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
// -> 
//{
// "valueHostQueryResults": [
//     {
//       "path": {
//         "ValueHost": "NewField",
//         "Property": "parserLookupKey"
//       },
//       "result": {
//         "feature": "Property",
//         "propertyName": "parserLookupKey",
//         "severity": "error",
//         "message": "Not found. Please register a DataTypeParser to dataTypeParserService."
//       }
//     }
//   ],
//   "lookupKeyQueryResults": [
//     {
//       "path": {
//         "LookupKey": "Date",
//         "Parser": null,
//         "ParsersByCulture": "en"
//       },
//       "result": {
//         "feature": "ParsersByCulture",
//         "cultureId": "en",
//         "parserResults": [],
//         "notFound": true,
//         "severity": "error",
//         "message": "No DataTypeParser for LookupKey \"Date\" with culture \"en\""
//       }
//     }
//   ]
// }

    });
    test('Lookup Key has a case insensitive match is an error on the property', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        registerConfigAnalyzers(services.configAnalysisService);
        let builder = services.managerConfigBuilderFactory.create() as ValidationManagerConfigBuilder
        builder.static('Field1', 'date');// should be 'Date' or LookupKey.Date
        let explorer = builder.analyze();
        expect(() => explorer.throwOnErrors(false,
            new JsonConsoleConfigAnalysisOutputter())).toThrow();
// ->
// {
//     "valueHostQueryResults": [
//         {
//             "path": {
//                 "ValueHost": "Field1",
//                 "Property": "dataType"
//             },
//             "result": {
//                 "feature": "Property",
//                 "propertyName": "dataType",
//                 "severity": "error",
//                 "message": "Value is not an exact match to the expected value of \"Date\". Fix it."
//             }
//         }
//     ],
//     "lookupKeyQueryResults": []
// }
        
    });
    // Using TextLocalizerService for a validator error message has no error when correctly setup
    // The report shows the validatorConfig.errorMessagel10n property and its
    // available text for each culture.
    // We'll support 'en' and 'es' for this test.
    test('TextLocalizerService is used for a validator error message', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        services.cultureService.register({ cultureId: 'en' });
        services.cultureService.register({ cultureId: 'es' });  
        // this condition is used for the validator that has the error message we are testing
        services.conditionFactory.register<RequireTextConditionConfig>(
            ConditionType.RequireText,
            (config) => new RequireTextCondition(config));
        
        registerConfigAnalyzers(services.configAnalysisService);
        
        services.textLocalizerService.register('RequiredEM',
            {
                en: 'This field is required.',
                es: 'Este campo es obligatorio.'
            });

        let builder = services.managerConfigBuilderFactory.create() as ValidationManagerConfigBuilder
        builder.input('Field1', 'Date').requireText(null, null, { errorMessagel10n: 'RequiredEM' });
        
        let explorer = builder.analyze();
        expect(() => explorer.throwOnErrors(false)).not.toThrow();

        explorer.reportToConsole({ features: [CAFeature.l10nProperty] }, false, false, 2);
//  ->
// {
//     "valueHostQueryResults": [
//       {
//         "path": {
//           "ValueHost": "Field1",
//           "Validator": "RequireText",
//           "l10nProperty": "errorMessagel10n"
//         },
//         "result": {
//           "feature": "l10nProperty",
//           "propertyName": "errorMessage",
//           "l10nPropertyName": "errorMessagel10n",
//           "l10nKey": "RequiredEM",
//           "cultureText": {
//             "en": {
//               "text": "This field is required.",
//               "severity": "info"
//             },
//             "es": {
//               "text": "Este campo es obligatorio.",
//               "severity": "info"
//             }
//           }
//         }
//       }
//     ]
//   }
    });

// Now we'll see an localization error when the text is not found in the TextLocalizerService
    // We want text for both 'en' and 'es' but only have 'en' registered.    
    test('TextLocalizerService is used for a validator error message, but missing a culture', () => {
        let services = createBasicServices();    // start with no populated services. That should create errors
        services.cultureService.register({ cultureId: 'en' });
        services.cultureService.register({ cultureId: 'es' });
        // this condition is used for the validator that has the error message we are testing
        services.conditionFactory.register<RequireTextConditionConfig>(
            ConditionType.RequireText,
            (config) => new RequireTextCondition(config));
        
        registerConfigAnalyzers(services.configAnalysisService);
        
        services.textLocalizerService.register('RequiredEM',
            {
                en: 'This field is required.',
            });

        let builder = services.managerConfigBuilderFactory.create() as ValidationManagerConfigBuilder
        builder.input('Field1', 'Date').requireText(null, null, { errorMessagel10n: 'RequiredEM' });
        
        let explorer = builder.analyze();
        // this will throw an error because 'es' is not registered in the TextLocalizerService
        // explorer.reportToConsole({ features: [CAFeature.l10nProperty] }, false, false, 2);
        expect(() => explorer.throwOnErrors(false, new JsonConsoleConfigAnalysisOutputter())).toThrow();
    });
});


describe('These tests demonstrate that the functions in the src folder compile and execute', () => {
    test('throwOnErrors', () => {
        // sample data has no errors...
        expect(()=> throwOnErrors()).not.toThrow();
    });
    test('throwOnErrorsWritingToConsole', () => {
        // sample data has no errors...
        expect(()=> throwOnErrorsWritingToConsole()).not.toThrow();
    });
    test('throwOnErrorsWritingToLoggerService', () => {
        // sample data has no errors...
        expect(()=> throwOnErrorsWritingToLoggerService()).not.toThrow();
    });
    test('reportToConsole', () => {
        // sample data has nothing to report...
        expect(() => reportToConsole()).not.toThrow();
        // but notice the console has this:
        // > { valueHostQueryResults: [], lookupKeyQueryResults: [] }
    });
    test('hasErrorsThenReportEverythingToLogger', () => {
        // sample data has no errors...
        expect(() => hasErrorsThenReportEverythingToLogger()).not.toThrow();
    });
});