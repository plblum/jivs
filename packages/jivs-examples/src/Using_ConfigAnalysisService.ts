import { CAIssueSeverity } from '@plblum/jivs-engine/build/Interfaces/ConfigAnalysisService';
import { LoggingLevel, LogDetails, LogOptions } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { createValidationServices, differenceBetweenDates } from './Config_example_common_code';
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { ConsoleConfigAnalysisOutputter, LoggerConfigAnalysisOutputter } from '@plblum/jivs-engine/build/ConfigAnalysis/ConfigAnalysisOutputterClasses';
import { LoggerServiceBase } from '@plblum/jivs-engine/build/Services/LoggerServiceBase';
import { IConfigAnalysisOutputFormatter, IConfigAnalysisSearchCriteria, CAFeature } from '@plblum/jivs-engine/build/Interfaces/ConfigAnalysisService';
/**
 * ConfigAnalysisService is a tool to ensure that your configuration is as expected
 * even before you create a ValidationManager from it.
 * Due to the dependency injection model, its not immediately apparent if the object
 * that you want is the one you get. In particular, the Lookup Keys are used to identify
 * data types, parsers, formatters, converters, and more. Each of those objects gets
 * registered in factory of ValidationServices.
 * 
 * Our goal is to help you prove your ValidationService configuration is delivering 
 * the right object based on your lookup keys. 
 * In many cases, the object also depends on the culture. ConfigAnalysisService
 * takes that into account.
 * We also want to validate many of the properties.
 * Some properties use the TextLocalizerService to localize the text. That too needs validation
 * so you know that the text is available in all the cultures you need.
 * 
 * ConfigAnalysisService does the following:
 * - Goes through your ValueHostConfig objects to identify any issues (errors, warnings, infos)
 *   It will not report on properties found to be in good shape.
 *   It will show validator configuration and condition configuration issues,
 *   including if the condition was not registered in the ConditionFactory.
 * - Creates a report for each Lookup Key in use, along with the services that will be used or
 *   were missing when needed.
 * - For properties that support localization, it shows all cultural localizations,
 *   allowing you find issues within the TextLocalizerService.
 * 
 * Effectively, there are 3 objects it can supply:
 * - The complete results of the analysis, which is a ConfigAnalysisResults object. 
 *   It is a tree with some depth, so its not easy to navigate.
 * - Run a query against the ValueHostConfig object results. Queries take a criteria object
 *   that can match to many parts of the data. The result of each found is a two part object:
 *   path: an object that identifies the path to the object in the tree
 *   result: the object that was found.
 * - Run a query against the Lookup Key results. The criteria object focuses on 
 *   lookup key and its services. The result is the same structure as the ValueHostConfig query.
 * 
 * To use it, you need to:
 * - When using a Builder object, it has an analysis function that you can call.
 * ```ts
 * let explorer = builder.analyze(); // optional parameter where you can supply it with some values it may need
 * ```
 * - When using the ValidationManagerConfig object, call it from the ValidationServices.configAnalysisService object.
 * ```ts
 * let explorer = services.configAnalysisService.analyze(config);    // same optional parameter
 * ```
 * It outputs the Explorer object (ConfigAnalysisResultsExplorer), which has the tools to query the results
 * and get the information you need.
 * 
 * Here's some of what you can do with ConfigAnalysisService:
 * - Identify if there are any errors quickly.
 * ```ts
 * if (explorer.hasErrors())
 * {
 *    // Do something with the errors such as report to the console:
 *    explorer.reportToConsole({ severities: [CAIssueSeverity.error] }, { severities: [CAIssueSeverity.error] });
 * }
 * ```
 * - Throw an exception if there are errors.
 * ```ts
 * // exception will contain a JSON object with the errors
 * explorer.throwOnErrors();
 * // if you want to write to console as well
 * explorer.throwOnErrors(false, new ConsoleConfigAnalysisOutputter());
 * // That outputter parameter allows you to write to anything that implements IConfigAnalysisOutputter
 * ```
 * - Get the results for a specific Lookup Key. Use a criteria object to filter the results.
 * ```ts
 * let results = explorer.queryLookupKeyResults({ lookupKeys: ["myLookupKey"] });
 * // or just run it through a report to an outputter
 * explorer.reportToConsole(null, { lookupKeys: ["myLookupKey"] });
 * ```
 * - Do similar queries on the ValueHostConfig objects.
 * ```ts
 * let results = explorer.queryValueHostResults({ valueHostNames: ["myValueHostName"] }, null);
 * // or just run it through a report to an outputter
 * explorer.reportToConsole({ valueHostNames: ["myValueHostName"] }, null);
 * ```
 */

/**
 * Instructions for using ConfigAnalysisService:
 * 1. Ideally make sure your Configuration is created in a stand-alone function.
 *    That way, you can use it both in your application and in unit tests.
 * 2. If your configuration is built with the Builder object, you can call the analyze function.
 *    It will return an Explorer object that you can use to query the results.
 *    If it is build with the ValidationManagerConfig object, you can call the analyze function
 *    from the ValidationServices.configAnalysisService object.
 * 3. In the actual application, use the Explorer object to check for errors and
 *    potentially write the results to the console, log, and/or throw an exception.
 * 4. In tests, you can use the Explorer object to use the query functions
 *    to demonstrate that the configuration is as expected.
 */

// This function is used to prepare the Builder object for our example functions below
// the associated tests. Tests should vary the services and Builder object to 
// create issues that can be detected by the ConfigAnalysisService.
export function prepareBuilder(services: IValidationServices): ValidationManagerConfigBuilder
{
    // This code simplifies the creation of the ValidationServices object and the Builder object.
    // Normally you should have the business logic prepare it followed by the UI layer extending it.
    let builder = build(services);
    builder.static('numOfDays', LookupKey.Integer, { initialValue: 10 });
    builder.calc('diffDays', LookupKey.Integer, differenceBetweenDates);
    builder.input('startDate', null, { label: 'Start date'})
        .lessThanOrEqual('numOfDays',   // right operand of the comparison
            { valueHostName: 'diffDays' },  // compare to this ValueHost, not 'startDate'
            'Less than {compareTo} days apart',   // our preferred error message
            { errorCode: 'NumOfDays'}   // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
    );
    builder.input('endDate', null, { label: 'End date' });

    return builder;
}

export function throwOnErrors(): void
{
    let services = createValidationServices('en');
    let builder = prepareBuilder(services);
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = builder.analyze();
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults);
    // errors are in the thrown Errors object message
}

export function throwOnErrorsWritingToConsole(): void
{
    let services = createValidationServices('en');
    let builder = prepareBuilder(services);
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = builder.analyze();
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults, new ConsoleConfigAnalysisOutputter());
    // errors are in the thrown Errors object message, and showing on the console
}

class MockWriteLog extends LoggerServiceBase
{
    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void
    {
        // do something with the log details
    }

    getLogOptions(): LogOptions | undefined {
        return { includeData: true };   // if you want the log to get the complete results
    }
}
export function throwOnErrorsWritingToLoggerService(): void
{
    let services = createValidationServices('en');
    let builder = prepareBuilder(services);
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = builder.analyze();

    const includeCompleteResults = false;
    const formatter: IConfigAnalysisOutputFormatter | null = null;    // null will use new JsonConfigAnalysisOutputFormatter()
    let loggerService = new MockWriteLog();
    explorer.throwOnErrors(includeCompleteResults,
        new LoggerConfigAnalysisOutputter(formatter, loggerService));
}

export function reportToConsole(): void
{
    let services = createValidationServices('en');
    let builder = prepareBuilder(services);
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let explorer = builder.analyze();

    // samples of what you can do
    let valueHostCriteria: IConfigAnalysisSearchCriteria | null = null;
    let lookupKeyCriteria: IConfigAnalysisSearchCriteria | null = null;

    // report all errors and warnings
    valueHostCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning ] };
    lookupKeyCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning] };
/*    
    // include one valueHost and no lookup Keys
    valueHostCriteria = { valueHostNames: ['startDate'] };
    // just issues on conditions
    valueHostCriteria = { features: [CAFeature.condition] };
    // text localization
    valueHostCriteria = { features: [CAFeature.l10nProperty] };

    // include specific lookup key and no value hosts
    lookupKeyCriteria = { lookupKeys: [LookupKey.Integer, LookupKey.Boolean] };

    // just the converter services
    lookupKeyCriteria = { features: [CAFeature.converter] };

    // just the parser services
    lookupKeyCriteria = { features: [CAFeature.parser, CAFeature.parsersByCulture, CAFeature.parserFound] };

    // just the formatter services
    lookupKeyCriteria = { features: [CAFeature.formatter, CAFeature.formattersByCulture] };
*/
    const includeCompleteResults = false;
    explorer.reportToConsole(valueHostCriteria, lookupKeyCriteria, includeCompleteResults);
}

export function hasErrorsThenReportEverythingToLogger(): void
{
    let services = createValidationServices('en');
    let builder = prepareBuilder(services);
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = builder.analyze();
    if (explorer.hasErrors())
    {
        let valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null = true; // means everything
        let lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null = {}; // also means everything
        const includeCompleteResults = true;
        explorer.report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults,
            new LoggerConfigAnalysisOutputter(null, new MockWriteLog()));
    }
}

// There are many more functions on the Explorer. Most will be used in tests.
// So visit the test file, Using_ConfigAnalysisService.test.ts.