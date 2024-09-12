import { LoggingLevel, LogDetails, LogOptions } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { IValidationServices } from '@plblum/jivs-engine/build/Interfaces/ValidationServices';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ValidationManagerConfigBuilder } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { build } from '@plblum/jivs-engine/build/Validation/ValidationManagerConfigBuilder';
import { LoggerServiceBase } from '@plblum/jivs-engine/build/Services/LoggerServiceBase';

import { createValidationServices, differenceBetweenDates } from './Config_example_common_code';
import { IConfigAnalysisOutputFormatter, IConfigAnalysisSearchCriteria } from '../src/Types/Explorer';
import { CAIssueSeverity } from '../src/Types/Results';
import { LoggerConfigAnalysisOutputter, ConsoleConfigAnalysisOutputter } from '../src/Explorer/Outputters/ConfigAnalysisOutputterClasses';

import { analyze } from '../src/Runner';    // <<< The main function to start the analysis

/**
 * Start here to learn about jivs-ConfigAnalysis: https://github.com/plblum/jivs/main/packages/jivs-configanalysis
 *
 * Instructions for using ConfigAnalysis:
 * 1. Ideally make sure your Configuration is created in a stand-alone function.
 *    That way, you can use it both in your application and in unit tests.
 *  > In this file, we have created a function called createConfiguration() that does this.
 * 
 * 2. Create your configuration, either using a Builder object or a ValidationManagerConfig object.
 *    Once complete, call the analyze() function to get an Explorer object.
 *    analyze() is in the runner module of Jivs-ConfigAnalysis.
 *  > In this file, you can see the Builder object used in various functions.
 * 
 * 3. In tests, you can use the Explorer object to use the query functions
 *    to demonstrate that the configuration is as expected.
 *  > In this file, you can see the various functions that use the Explorer object.
 */

/**
 * This function is used to prepare the Builder object for our example functions below
 * the associated tests.
 * Your own code will likely have a similar function to encapsulate your configuration.
 * @param services 
 * @returns 
 */
export function createConfiguration(services?: IValidationServices): ValidationManagerConfigBuilder
{
    let builder = build(services ?? createValidationServices('en'));
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

/**
 * Example to throw an error if there are any errors in the configuration.
 */
export function example_throwOnErrors(): void
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let builder = createConfiguration();
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = analyze(builder);
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults);
    // errors are in the thrown Errors object message
}

/**
 * Example that also uses throwOnErrors, but also writes the errors to the console.
 */
export function example_throwOnErrors_And_Write_To_Console(): void
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let builder = createConfiguration();
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = analyze(builder);
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults, new ConsoleConfigAnalysisOutputter());
    // errors are in the thrown Errors object message, and showing on the console
}


/**
 * Example that also uses throwOnErrors, but also writes the errors to a log.
 */
export function example_throwOnErrors_And_Write_To_Log(): void
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let builder = createConfiguration();
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = analyze(builder);

    const includeCompleteResults = false;
    const formatter: IConfigAnalysisOutputFormatter | null = null;    // null will use new JsonConfigAnalysisOutputFormatter()
    let loggerService = new MockWriteLog();
    explorer.throwOnErrors(includeCompleteResults,
        new LoggerConfigAnalysisOutputter(formatter, loggerService));
}

/**
 * Example that generates a report to console. It is supplied criteria
 * to limit the output to errors and warnings.
 */
export function reportToConsole(): void
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let builder = createConfiguration();
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let explorer = analyze(builder);

    // samples of what you can do
    let valueHostCriteria: IConfigAnalysisSearchCriteria | null = null;
    let lookupKeyCriteria: IConfigAnalysisSearchCriteria | null = null;

    // report all errors and warnings
    valueHostCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning ] };
    lookupKeyCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning] };
/*  Some other example criteria:
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

/**
 * Example that generates a report to log. It is supplied criteria
 */
export function example_hasErrors_report_to_log(): void
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts
    let builder = createConfiguration();
    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')

    let explorer = analyze(builder);
    if (explorer.hasErrors())
    {
        let valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null = true; // means everything
        let lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null = {}; // also means everything
        const includeCompleteResults = true;
        explorer.report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults,
            new LoggerConfigAnalysisOutputter(null, new MockWriteLog()));
    }
}



class MockWriteLog extends LoggerServiceBase
{
    protected writeLog(level: LoggingLevel, logDetails: LogDetails): void
    {
        // do something with the log details
    }

    getLogOptions(): LogOptions | undefined {
        return { includeData: true };   // if you want the log to get the extended results
    }
}