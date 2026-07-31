import { BuildersFactoryInstaller } from '@plblum/jivs-builder/build/Services/BuildersFactoryInstaller';
import { RulesConfigOptions } from '@plblum/jivs-builder/build/Interfaces/ModelRules';
import { FormRulesBase } from '@plblum/jivs-builder/build/ModelRules/ModelRules';
import { LookupKey } from '@plblum/jivs-engine/build/DataTypes/LookupKeys';
import { ICalcValueHost } from '@plblum/jivs-engine/build/Interfaces/CalcValueHost';
import { SimpleValueType } from '@plblum/jivs-engine/build/Interfaces/DataTypeConverterService';
import { LogDetails, LogOptions, LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggerService';
import { IValueHostsManager } from '@plblum/jivs-engine/build/Interfaces/ValueHostsManager';
import { IJivsServices } from '@plblum/jivs-engine/build/Interfaces/JivsServices';
import { LoggerServiceBase } from '@plblum/jivs-engine/build/Services/LoggerServiceBase';
import { ValueHostsManager } from '@plblum/jivs-engine/build/Validation/ValueHostsManager';

import { IValueHostsManagerConfigBuilder } from '@plblum/jivs-builder/build/Interfaces/ManagerConfigBuilder';
import { installConfigAnalysisService } from '../src/ConfigAnalysisService';
import { ConsoleConfigAnalysisOutputter, LoggerConfigAnalysisOutputter } from '../src/Explorer/Outputters/ConfigAnalysisOutputterClasses';
import { IConfigAnalysisOutputFormatter, IConfigAnalysisSearchCriteria } from '../src/Types/Explorer';
import { CAIssueSeverity } from '../src/Types/ConfigAnalysisResults';
import { createJivsServices } from './Config_example_common_code';

new BuildersFactoryInstaller();  // this will install buildersFactory on JivsServices.prototype


/**
 * Start here to learn about jivs-ConfigAnalysis: https://github.com/plblum/jivs/main/packages/jivs-configanalysis
 *
 * Instructions for using ConfigAnalysis:
 * 1. Perform the normal steps to create your configuration with a ModelRulesBases or FormRulesBase subclass.
 *    See DateRangeFormRules below for that.
 * 2. Create the normal code to create the ValueHostsManager.
 * ```ts
 * let services = createJivsServices('en');
 * let rules = new DateRangeFormRules(services);
 * let config = rules.configure();
 * let valueHostsManager = new ValueHostsManager(config, services);
 * ```
 * 3. Insert your config analysis code before you create the ValueHostsManager.
 * ```ts
 * let configAnalysisService = installConfigAnalysisService(services);
 * let options: ConfigAnalysisOptions = { };
 * let explorer = configAnalysisService.analyze(config, options);
 * ```
 * 4. Use the explorer object to query the configuration for issues, or to throw an error if there are any issues.
 * ```ts
 * let explorer = configAnalysisService.analyze(config, options);
 * explorer.throwOnErrors();    // or many other ways to explore
 * ```
 * 
 * 4. If building this into your forms code, consider wrapping it in logic to only run in development environments, so that it does not impact production performance.
 * ```ts
 * if (process.env.NODE_ENV === 'development') {
 *   let explorer = configAnalysisService.analyze(config, options);
 *   explorer.throwOnErrors();    // or many other ways to explore
 * }
 * 
 * 5. Write tests that also confirm your configuration is as expected. You can use the Explorer object to query the configuration and confirm that it is as expected.
 * Here we use Jest and explorer.hasErrors() to confirm that there are no errors in the configuration.
 * ```ts
 * test('Configuration has no errors', () => {
 *   let services = createJivsServices('en');
 *   let rules = new DateRangeFormRules(services);
 *   let config = rules.configure();
 *   let configAnalysisService = installConfigAnalysisService(services);
 *   let explorer = configAnalysisService.analyze(config);
 *   expect(explorer.hasErrors()).toBe(false);
 * }
 */

/**
 * Our Forms rules class, which is a subclass of FormRulesBase.
 * This is Phase 1.
 */
export class DateRangeFormRules extends FormRulesBase
{
    constructor(services: IJivsServices) {
        super(services);
    }
    protected configureRules(builder: IValueHostsManagerConfigBuilder,
        options?: RulesConfigOptions): void {
        builder.field('StartDate', LookupKey.Date, { label: 'Start date' })
            .lessThan('EndDate')
            .lessThanOrEqual('NumOfDays',   // right operand of the comparison
                {
                    valueHostName: 'DiffDays',  // compare to this valueHost, not StartDate
                    errorMessage: 'Less than {compareTo} days apart',   // our preferred error message,
                    errorCode: 'NumOfDays' // ensures a unique error code, not usually needed because the condition supplies a default of 'LessThanOrEqual'
                 });  
        builder.field('EndDate', LookupKey.Date, { label: 'End date' });
        builder.static('NumOfDays', LookupKey.Integer, { initialValue: 10 });
        builder.calc('DiffDays', LookupKey.Integer, this.differenceBetweenDates);        
    }
    // For our DiffDays CalcValueHost
    private differenceBetweenDates(callingValueHost: ICalcValueHost, findValueHosts: IValueHostsManager): SimpleValueType {
        let totalDays1 = callingValueHost.convert(
            findValueHosts.getValueHost('StartDate')?.getValue(),
            null, LookupKey.TotalDays);
        let totalDays2 = callingValueHost.convert(
            findValueHosts.getValueHost('EndDate')?.getValue(),
            null, LookupKey.TotalDays);
        if (typeof totalDays1 !== 'number' || typeof totalDays2 !== 'number')
            return undefined;   // can log with findValueHosts.services.logger.log();
        return Math.abs(totalDays2 - totalDays1);
    }
}


/**
 * Example to throw an error if there are any errors in the configuration.
 */
export function example_throwOnErrors(): IValueHostsManager
{
    // See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts
    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();

    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults);
    // errors are in the thrown Errors object message

    // if we get this far, there are no errors in the configuration. We can now create the ValueHostsManager.
    return new ValueHostsManager(config);
}

/**
 * Example that also uses throwOnErrors, but also writes the errors to the console.
 */
export function example_throwOnErrors_And_Write_To_Console(): IValueHostsManager
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();

    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});
    const includeCompleteResults = false;
    explorer.throwOnErrors(includeCompleteResults, new ConsoleConfigAnalysisOutputter());
    // errors are in the thrown Errors object message, and showing on the console

    // if we get this far, there are no errors in the configuration. We can now create the ValueHostsManager.
    return new ValueHostsManager(config);
}


/**
 * Example that also uses throwOnErrors, but also writes the errors to a log.
 */
export function example_throwOnErrors_And_Write_To_Log(): IValueHostsManager
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();

    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});

    const includeCompleteResults = false;
    const formatter: IConfigAnalysisOutputFormatter | null = null;    // null will use new JsonConfigAnalysisOutputFormatter()
    let loggerService = new MockWriteLog();
    explorer.throwOnErrors(includeCompleteResults,
        new LoggerConfigAnalysisOutputter(formatter, loggerService));
    
    // errors are in the thrown Errors object message, and showing on the log

    // if we get this far, there are no errors in the configuration. We can now create the ValueHostsManager.
    return new ValueHostsManager(config);
}

/**
 * Example that generates a report to console. It is supplied criteria
 * to limit the output to errors and warnings.
 */
export function reportToConsole(): IValueHostsManager
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts

    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();

    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});

    // samples of what you can do
    let valueHostCriteria: IConfigAnalysisSearchCriteria | null = null;
    let lookupKeyCriteria: IConfigAnalysisSearchCriteria | null = null;

    // report all errors and warnings
    valueHostCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning ] };
    lookupKeyCriteria = { severities: [CAIssueSeverity.error, CAIssueSeverity.warning] };
/*  Some other example criteria:
    // include one valueHost and no lookup Keys
    valueHostCriteria = { valueHostNames: ['StartDate'] };
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

    // if we get this far, there are no errors in the configuration. We can now create the ValueHostsManager.
    return new ValueHostsManager(config);
}

/**
 * Example that generates a report to log. It is supplied criteria
 */
export function example_hasErrors_report_to_log(): IValueHostsManager
{
// See this in action in the tests: ./tests/examples/Using_ConfigAnalysis.test.ts
    let services = createJivsServices('en');
    let rules = new DateRangeFormRules(services);
    let config = rules.configure();

    // This should normally be limited to development environments
    // if (process.env.NODE_ENV === 'development')
    let configAnalysisService = installConfigAnalysisService(services);
    let explorer = configAnalysisService.analyze(config, {});
    if (explorer.hasErrors())
    {
        let valueHostCriteria: IConfigAnalysisSearchCriteria | boolean | null = true; // means everything
        let lookupKeyCriteria: IConfigAnalysisSearchCriteria | boolean | null = {}; // also means everything
        const includeCompleteResults = true;
        explorer.report(valueHostCriteria, lookupKeyCriteria, includeCompleteResults,
            new LoggerConfigAnalysisOutputter(null, new MockWriteLog()));
    }
    // if we get this far, there are no errors in the configuration. We can now create the ValueHostsManager.
    return new ValueHostsManager(config);
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