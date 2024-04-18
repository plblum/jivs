import { AutoGenerateDataTypeCheckService } from '@plblum/jivs-engine/src/Services/AutoGenerateDataTypeCheckService';
import {
    DataTypeCheckConditionConfig,  DataTypeCheckCondition, RequireTextConditionConfig,
    RequireTextCondition, RegExpConditionConfig,
    RegExpCondition, RangeConditionConfig, RangeCondition, CompareToConditionConfig,
    EqualToCondition, NotEqualToCondition,  GreaterThanCondition,
    LessThanCondition, GreaterThanOrEqualCondition, 
    LessThanOrEqualCondition, StringLengthConditionConfig, StringLengthCondition, AllMatchConditionConfig,
    AllMatchCondition, AnyMatchConditionConfig,  AnyMatchCondition, CountMatchesConditionConfig,
    CountMatchesCondition,
    NotNullConditionConfig,
    NotNullCondition
} from "@plblum/jivs-engine/src/Conditions/ConcreteConditions";
import { ConditionFactory } from "@plblum/jivs-engine/src/Conditions/ConditionFactory";
import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import {
    CaseInsensitiveStringConverter, DateTimeConverter, LocalDateOnlyConverter, TotalDaysConverter, IntegerConverter,
    TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter
} from "@plblum/jivs-engine/src/DataTypes/DataTypeConverters";
import {
    StringFormatter, NumberFormatter, IntegerFormatter, DateFormatter, CapitalizeStringFormatter,
    UppercaseStringFormatter, LowercaseStringFormatter, DateTimeFormatter, AbbrevDateFormatter,
    AbbrevDOWDateFormatter, LongDateFormatter, LongDOWDateFormatter, TimeofDayFormatter, TimeofDayHMSFormatter,
    BooleanFormatter, CurrencyFormatter, PercentageFormatter, Percentage100Formatter
} from "@plblum/jivs-engine/src/DataTypes/DataTypeFormatters";
import { LookupKey } from "@plblum/jivs-engine/src/DataTypes/LookupKeys";
import { LoggingLevel } from "@plblum/jivs-engine/src/Interfaces/LoggerService";
import { ITextLocalizerService } from "@plblum/jivs-engine/src/Interfaces/TextLocalizerService";
import { ConsoleLoggerService } from "@plblum/jivs-engine/src/Services/ConsoleLoggerService";
import { TextLocalizerService } from "@plblum/jivs-engine/src/Services/TextLocalizerService";
import { ValidationServices } from "@plblum/jivs-engine/src/Services/ValidationServices";
import { MessageTokenResolverService } from '@plblum/jivs-engine/src/Services/MessageTokenResolverService';
import { CultureIdFallback } from "@plblum/jivs-engine/src/Interfaces/DataTypeFormatterService";
import { DataTypeIdentifierService } from "@plblum/jivs-engine/src/Services/DataTypeIdentifierService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/src/Services/DataTypeFormatterService";
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { DataTypeComparerService } from "@plblum/jivs-engine/src/Services/DataTypeComparerService";


/**
 * You must create a ValidationServices object prior to your ValidationManager.
 * It has extensive configuration options. Many have defaults.
 * However, when it comes to these, we prefer to let you choose the classes
 * you will use instead of having all available prepopulated.
 * 
 * 1. Add this code to your app.
 * 2. Call createValidationServices() to return a prepared ValidationServices object.
 * 3. Create the ValidationManager. It contains a configuration object with a property called 'services',
 *    where you attach you services object.
 * 4. Initially all available classes are registered for things like conditions,
 *    formatting, converting, and more. If you prefer, review and modify to 
 *    comment out those classes you won't be using.
 */

export function createValidationServices(): ValidationServices {
    let vs = new ValidationServices();

    vs.activeCultureId = 'en'; // set this to your default culture

    // --- ConditionFactory ---------------------------
    vs.conditionFactory = createConditionFactory();

    // --- DataTypeIdentifierService -------------------------------------
    // Plenty to configure here. See function below.
    let dtis = new DataTypeIdentifierService();
    vs.dataTypeIdentifierService = dtis;
    registerDataTypeIdentifiers(dtis);

    // --- DataTypeFormatterService -------------------------------------
    // Plenty to configure here. See function below.
    let dtfs = new DataTypeFormatterService();
    vs.dataTypeFormatterService = dtfs;
    registerDataTypeFormatters(dtfs);

    // --- DataTypeConverterService -------------------------------------
    // Plenty to configure here. See function below.
    let dtcs = new DataTypeConverterService();
    vs.dataTypeConverterService = dtcs;
    registerDataTypeConverters(dtcs);
    
    // --- DataTypeComparerService -------------------------------------
    // Plenty to configure here. See function below.
    let dtcmps = new DataTypeComparerService();
    vs.dataTypeComparerService = dtcmps;
    registerDataTypeComparers(dtcmps);    

    // --- AutoGenerateDataTypeCheckService -------------------------------------
    // Plenty to configure here. See function below.
    let ag = new AutoGenerateDataTypeCheckService();
    vs.autoGenerateDataTypeCheckService = ag;
    registerDataTypeCheckGenerators(ag);    

    // --- Text localization service
    // The built-in class, TextLocalizerService, doesn't use a third party localization
    // library. If you prefer one, create a class that implements ITextLocalizerService
    vs.textLocalizerService = createTextLocalizerService();

    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLoggerService and another, create the other
    // and pass it as the second parameter of ConsoleLoggerService.
    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);

    // --- MessageTokenResolverService ----------------------
    // Generally you don't have to modify this.
    vs.messageTokenResolverService = new MessageTokenResolverService();

    return vs;
}

export function createConditionFactory(): ConditionFactory
{
    let cf = new ConditionFactory();
    registerConditions(cf);
    return cf;
}
export function registerConditions(cf: ConditionFactory): void
{
    // Register the desired conditions, including adding your own
    cf.register<DataTypeCheckConditionConfig>(
        ConditionType.DataTypeCheck, (config) => new DataTypeCheckCondition(config));
    cf.register<RequireTextConditionConfig>(
        ConditionType.RequireText, (config) => new RequireTextCondition(config));
    cf.register<RegExpConditionConfig>(
        ConditionType.RegExp, (config) => new RegExpCondition(config));
    cf.register<RangeConditionConfig>(
        ConditionType.Range, (config) => new RangeCondition(config));
    cf.register<CompareToConditionConfig>(
        ConditionType.EqualTo, (config) => new EqualToCondition(config));
    cf.register<CompareToConditionConfig>
        (ConditionType.NotEqualTo, (config) => new NotEqualToCondition(config));
    cf.register<CompareToConditionConfig>
        (ConditionType.GreaterThan, (config) => new GreaterThanCondition(config));
    cf.register<CompareToConditionConfig>
        (ConditionType.LessThan, (config) => new LessThanCondition(config));
    cf.register<CompareToConditionConfig>
        (ConditionType.GreaterThanOrEqual, (config) => new GreaterThanOrEqualCondition(config));
    cf.register<CompareToConditionConfig>
        (ConditionType.LessThanOrEqual, (config) => new LessThanOrEqualCondition(config));
    cf.register<StringLengthConditionConfig>
        (ConditionType.StringLength, (config) => new StringLengthCondition(config));
    cf.register<AllMatchConditionConfig>
        (ConditionType.And, (config) => new AllMatchCondition(config));
    cf.register<AnyMatchConditionConfig>
        (ConditionType.Or, (config) => new AnyMatchCondition(config));
    cf.register<CountMatchesConditionConfig>
        (ConditionType.CountMatches, (config) => new CountMatchesCondition(config));
    cf.register<NotNullConditionConfig>(
        ConditionType.NotNull, (config) => new NotNullCondition(config));
    // aliases for users who don't deal well with boolean logic can relate
    cf.register<AllMatchConditionConfig>
        (ConditionType.All, (config) => new AllMatchCondition(config));
    cf.register<AnyMatchConditionConfig>
        (ConditionType.Any, (config) => new AnyMatchCondition(config));
}


/**
 * Cultures that you want to localize. 
 * -> Create an array of CultureIdFallback objects in configureCultures()
 */
export function configureCultures(): Array<CultureIdFallback>
{
   return [
        //!!! This is sample data. Please rework as you need it.
            {
                cultureId: 'en',
                fallbackCultureId: null    // when this is the default culture,
            },
            {
                cultureId: 'en-US',
                fallbackCultureId: 'en'
            },
            {
                cultureId: 'es',
                fallbackCultureId: 'en'
            },
            {
                cultureId: 'es-MX',
                fallbackCultureId: 'es'
            }
        ];
}

/**
 *  Give native types their Lookup Keys. 
 *  -> Use classes that implement IDataTypeIdentifier in register()
 * 
 * See see \examples\ComparingCustomDataTypeAsNumber and ComparingCustomDataTypeAsDate examples of custom DataTypeIdentifiers
 * @param dtis 
 */
export function registerDataTypeIdentifiers(dtis: DataTypeIdentifierService): void
{
    /* These are pre-installed into DataTypeIdentifierService as they are core functionality
    dtis.register(new NumberDataTypeIdentifier());
    dtis.register(new StringDataTypeIdentifier());
    dtis.register(new BooleanDataTypeIdentifier());
    dtis.register(new DateDataTypeIdentifier());
    */
    // See see \examples\ComparingCustomDataTypeAsNumber and ComparingCustomDataTypeAsDate examples of custom DataTypeIdentifiers    
}

/**
 * Give data types their formatters for the tokens you use within error messages,
 * like: "The value {Value} is above {Maximum}".
 * These are localized, and should support the cultures you identified earlier.
 *   -> Use classes that implement IDataTypeFormatter in register()
 * @param dtfs 
 */
export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
// Register DataTypeFormatters the app will use, including adding your own

    // Most of these can be modified through their constructor.
    // - Those that use the Intl library for localization let you pass options
    //   supported by Intl.NumberFormat or Intl.DateFormat.
    // - The Boolean and YesNo let you supply a list of cultures and their
    //   language specific values for "TrueLabel" and "FalseLabel"
    dtfs.register(new StringFormatter());
    dtfs.register(new NumberFormatter());     // options?: Intl.NumberFormatOptions
    dtfs.register(new IntegerFormatter());    // options?: Intl.NumberFormatOptions
    dtfs.register(new DateFormatter());       // options?: Intl.DateTimeFormatOptions

    // less used - consider commenting out until you know they are neded
    dtfs.register(new CapitalizeStringFormatter());
    dtfs.register(new UppercaseStringFormatter());
    dtfs.register(new LowercaseStringFormatter());
    dtfs.register(new DateTimeFormatter());       // options?: Intl.DateTimeFormatOptions
    dtfs.register(new AbbrevDateFormatter());     // options?: Intl.DateTimeFormatOptions
    dtfs.register(new AbbrevDOWDateFormatter());  // options?: Intl.DateTimeFormatOptions
    dtfs.register(new LongDateFormatter());       // options?: Intl.DateTimeFormatOptions
    dtfs.register(new LongDOWDateFormatter());    // options?: Intl.DateTimeFormatOptions
    dtfs.register(new TimeofDayFormatter());      // options?: Intl.DateTimeFormatOptions
    dtfs.register(new TimeofDayHMSFormatter());   // options?: Intl.DateTimeFormatOptions
    dtfs.register(new CurrencyFormatter('USD'));  // set this to your currency code
    // defaultCurrencyCode: 'USD', options?: Intl.NumberFormatOptions, cultureToCurrencyCode? { 'en-US' : 'USD', 'es-SP': 'EUR' }

    dtfs.register(new PercentageFormatter());     // options?: Intl.NumberFormatOptions
    dtfs.register(new Percentage100Formatter());  // options?: Intl.NumberFormatOptions
    // NOTE: BooleanFormatter has its strings localized in ValidationServices.TextLocalizerService
    // connected to the TrueLabell10n and FalseLabell10n properties.
    dtfs.register(new BooleanFormatter(LookupKey.Boolean)); // "true" and "false"
   // Example of providing another set of labels for true/false by supplying a different lookup key
    dtfs.register(new BooleanFormatter(LookupKey.YesNoBoolean, 'yes', 'no')); 
 
}

/**
 * Give data types ways to convert their values.
 * Usually these convert their values to a number, string, or Date object.
 * Conditions compare two values automatically when they are number, string, or Date object.
 *    -> Use classes that implement IDataTypeConverter in register()
 * see \examples\ folder for numerous examples of custom DataTypeConverters.
 * @param dtcs 
 */
export function registerDataTypeConverters(dtcs: DataTypeConverterService): void
{
    // Register DataTypeConverters the app will use, including adding your own.

    /* These are pre-installed into DataTypeIdentifierService as they are core functionality
        dtcs.register(new UTCDateOnlyConverter()); // so Dates have support out of the box
    */
    // see \examples\ folder for numerous examples of custom DataTypeConverters.
    dtcs.register(new CaseInsensitiveStringConverter());
    dtcs.register(new DateTimeConverter());
    dtcs.register(new LocalDateOnlyConverter());
    dtcs.register(new TimeOfDayOnlyConverter());
    dtcs.register(new TimeOfDayHMSOnlyConverter());
    dtcs.register(new IntegerConverter());
    dtcs.register(new TotalDaysConverter());
}

/**
 * Give your custom objects the ability to compare to each other.
 * Jivs already handles numbers and strings with its defaultComparer().
 * 
 * This is a special case where using an IDataTypeConverter isn't enough.
 * We've provided a comparer for Booleans, because we wanted them to have
 * comparison results of Equals or NotEquals (instead of default Equals, Lessthan, GreaterThan)
 * -> Use classes that implement IDataTypeComparer in register()
 * @param dtcs 
 */
export function registerDataTypeComparers(dtcs: DataTypeComparerService): void
{ /* These are pre-installed into DataTypeIdentifierService as they are core functionality
    dtcs.register(new BooleanDataTypeComparer());
*/    
}

/**
 * Automatically generate Data Type Check conditions - conditions that
 * determine if the Input value can be safely transferred into the native value.
 * The system using Jivs has the responsibility to make that transfer,
 * often using conversion code, and let Jivs know by passing both
 * Input value and resulting Native value through an InputValueHost.setValues() function.
 * When the transfer fails, still call setValues() passing 'undefined' for the native value.
 * 
 * By default, all data types use the DataTypeCheckCondition, which simply
 * reports an error when the native value is undefined.
 * 
 * Suppose you have a string as a native value. Your transfer code may elect to
 * convert the string without taking any action beyond trimming spaces. 
 * In this case, you may want to create a regular expression to parse the input value
 * and see if the content conforms to the rules.
 * 
 * See \examples\EmailAddressDataType.ts for example.
 * -> Use classes that implement IDataTypeCheckGenerator in register()
 * @param ag 
 */
export function registerDataTypeCheckGenerators(ag: AutoGenerateDataTypeCheckService): void
{
// See \examples\EmailAddressDataType.ts for example.
//    ag.register(new EmailAddressDataTypeCheckConverter());
}


export function createTextLocalizerService(): ITextLocalizerService
{
    let service = new TextLocalizerService();
    // the following is specific to TextLocalizerService class
    // and simply an example of working with it.
    // Feel free to replace this code in supporting your own
    // ITextLocalizerService implementation.
    // Here we provide localized text for "true", "false", "yes", and "no",
    // all used by the BooleanFormatter.
    service.register('TRUE', {
        '*': 'true',
        'en': 'true',
        'es': 'verdadero'
    });
    service.register('FALSE', {
        '*': 'false',
        'en': 'false',
        'es': 'falso'
    });    
    service.register('YES', {
        '*': 'yes',
        'en': 'yes',
        'es': 'sí'
    });
    service.register('NO', {
        '*': 'no',
        'en': 'no',
        'es': 'no'
    });    

    // Validator error messages can use these instead of having to be setup on individual InputValidatorConfigs.
    // So long as you don't supply a value to the InputValidatorConfig.errorMessage property, it will
    // create a lookup key using this pattern, and see if the TextLocalizerService has a value for it.
    // EM-ConditionType-DataTypeLookupKey
    // and a fallback:
    // EM-ConditionType
    // Similar for summaryMessage, only with SEM- prefix:
    // SEM-ConditionType-DataTypeLookupKey
    // SEM-ConditionType
    // 
    // This becomes important for auto-generating the "Data type check" validators, a step that the UI developer
    // would normally have to inject into the list of validators from business logic.
    // Guidance: Remember that error messages need to be easily understood and help the user fix the input.
    // 
    //!!!ALERT: This is a partial list of ConditionTypes and possible DataTypeLookupKeys
    service.registerErrorMessage(ConditionType.RequireText, null, {
        '*': 'Requires a value.'
    });
    service.registerSummaryMessage(ConditionType.RequireText, null, {
        '*': '{Label} requires a value.'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, null, {
        '*': 'Invalid value.'   // this is a fallback for when all datatypelookup keys have failed. Its a terrible error message, very unhelpful. That's why we need data type specific versions.
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, null, {
        '*': '{Label} has an invalid value.'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date,  {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Number, {
        '*': 'Invalid value. Enter a number.',
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Number, {
        '*': '{Label} has an invalid value. Enter a number.',
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Integer, {
        '*': 'Invalid value. Enter an integer.',
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Integer, {
        '*': '{Label} has an invalid value. Enter an integer.',
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.Date, {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });    
    service.registerErrorMessage(ConditionType.DataTypeCheck, LookupKey.AbbrevDate, {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: Month DD, YYYY where month names are 3 letters',
        'en-GB': 'Invalid value. Enter a date in this format: DD Month YYYY where month names are 3 letters'
    });
    service.registerSummaryMessage(ConditionType.DataTypeCheck, LookupKey.AbbrevDate, {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: Month DD, YYYY where month names are 3 letters',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD Month YYYY where month names are 3 letters'
    });    

    return service;
    
}