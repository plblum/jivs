import { InputValueHostFactory, PropertyValueHostFactory, ValueHostFactory, registerStandardValueHostGenerators } from '@plblum/jivs-engine/build/ValueHosts/ValueHostFactory';
import { AutoGenerateDataTypeCheckService } from '@plblum/jivs-engine/build/Services/AutoGenerateDataTypeCheckService';
import {
    DataTypeCheckConditionConfig, DataTypeCheckCondition, RequireTextConditionConfig,
    RequireTextCondition, RegExpConditionConfig,
    RegExpCondition, RangeConditionConfig, RangeCondition,
    EqualToCondition, NotEqualToCondition, GreaterThanCondition,
    LessThanCondition, GreaterThanOrEqualCondition,
    LessThanOrEqualCondition, StringLengthConditionConfig, StringLengthCondition, AllMatchConditionConfig,
    AllMatchCondition, AnyMatchConditionConfig, AnyMatchCondition, CountMatchesConditionConfig,
    CountMatchesCondition,
    NotNullConditionConfig,
    NotNullCondition,
    EqualToConditionConfig,
    NotEqualToConditionConfig,
    GreaterThanConditionConfig,
    LessThanConditionConfig,
    GreaterThanOrEqualConditionConfig,
    LessThanOrEqualConditionConfig,
    EqualToValueCondition,
    EqualToValueConditionConfig,
    GreaterThanOrEqualValueCondition,
    GreaterThanOrEqualValueConditionConfig,
    GreaterThanValueCondition,
    GreaterThanValueConditionConfig,
    LessThanOrEqualValueCondition,
    LessThanOrEqualValueConditionConfig,
    LessThanValueCondition,
    LessThanValueConditionConfig,
    NotEqualToValueConditionConfig,
    NotEqualToValueCondition,
    PositiveConditionConfig,
    PositiveCondition,
    IntegerConditionConfig,
    IntegerCondition,
    MaxDecimalsConditionConfig,
    MaxDecimalsCondition
}  from "@plblum/jivs-engine/build/Conditions/ConcreteConditions";
import { ConditionFactory } from "@plblum/jivs-engine/build/Conditions/ConditionFactory";
import { ConditionType } from "@plblum/jivs-engine/build/Conditions/ConditionTypes";
import {
    CaseInsensitiveStringConverter, DateTimeConverter, LocalDateOnlyConverter, TotalDaysConverter, IntegerConverter,
    TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter
} from "@plblum/jivs-engine/build/DataTypes/DataTypeConverters";
import {
    StringFormatter, NumberFormatter, IntegerFormatter, DateFormatter, CapitalizeStringFormatter,
    UppercaseStringFormatter, LowercaseStringFormatter, DateTimeFormatter, AbbrevDateFormatter,
    AbbrevDOWDateFormatter, LongDateFormatter, LongDOWDateFormatter, TimeofDayFormatter, TimeofDayHMSFormatter,
    BooleanFormatter, CurrencyFormatter, PercentageFormatter, Percentage100Formatter
} from "@plblum/jivs-engine/build/DataTypes/DataTypeFormatters";
import { LookupKey } from "@plblum/jivs-engine/build/DataTypes/LookupKeys";
import { LoggingLevel } from "@plblum/jivs-engine/build/Interfaces/LoggerService";
import { ITextLocalizerService } from "@plblum/jivs-engine/build/Interfaces/TextLocalizerService";
import { ICultureService } from "@plblum/jivs-engine/build/Interfaces/CultureService";
import { ConsoleLoggerService } from "@plblum/jivs-engine/build/Services/ConsoleLoggerService";
import { TextLocalizerService } from "@plblum/jivs-engine/build/Services/TextLocalizerService";
import { ValidationServices } from "@plblum/jivs-engine/build/Services/ValidationServices";
import { MessageTokenResolverService } from '@plblum/jivs-engine/build/Services/MessageTokenResolverService';
import { DataTypeIdentifierService } from "@plblum/jivs-engine/build/Services/DataTypeIdentifierService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/build/Services/DataTypeFormatterService";
import { DataTypeConverterService } from "@plblum/jivs-engine/build/Services/DataTypeConverterService";
import { DataTypeComparerService } from "@plblum/jivs-engine/build/Services/DataTypeComparerService";
import { ILookupKeyFallbackService } from "@plblum/jivs-engine/build/Interfaces/LookupKeyFallbackService";
import { LookupKeyFallbackService } from "@plblum/jivs-engine/build/Services/LookupKeyFallbackService";
import { IntegerDataTypeCheckGenerator } from '@plblum/jivs-engine/build/DataTypes/DataTypeCheckGenerators';
import { DataTypeParserService } from '@plblum/jivs-engine/build/Services/DataTypeParserService';
import { CultureIdFallback } from '@plblum/jivs-engine/build/Interfaces/CultureService';
import { BooleanParser, CleanUpStringParser, CurrencyParser, EmptyStringIsFalseParser, NumberParser, Percentage100Parser, PercentageParser, ShortDatePatternParser } from '@plblum/jivs-engine/src/DataTypes/DataTypeParsers';
import { NumberCultureInfo, DateTimeCultureInfo } from '@plblum/jivs-engine/src/DataTypes/DataTypeParserBase';


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

/**
 * 
 * @param usage Sets up for the type of usage. 
 * 'client' is used by any UI oriented code. It uses InputValueHosts 
 * (but not PropertyValueHosts).
 * 'server' is intended for business logic layer itself, where it is working with properties on the model
 * and lacks knowledge of the user's culture. It uses PropertyValueHosts (but not InputValueHosts)
 * When 'all', you get everything.
 * @param activeCultureId - The CultureId (like 'en' and 'en-US') which is used for localization.
 * You can change it without creating a new service like this:
 * services.activeCultureId = 'new cultureid';
 * @returns 
 */
export function createValidationServices(activeCultureId: string,
    usage: 'client' | 'server' | 'all' = 'client'): ValidationServices {
    let vs = new ValidationServices();

    // --- CultureServices ----------------------------
    vs.cultureService.activeCultureId = activeCultureId; // set this to your default culture
    registerCultures(vs.cultureService);    // define cultures that you support and their fallbacks

    // --- ConditionFactory ---------------------------
    vs.conditionFactory = createConditionFactory();

    // --- ValueHostFactory ---------------------------
    switch (usage)
    {
        case 'client':
            vs.valueHostFactory = new InputValueHostFactory();
            break;
        case 'server':
            vs.valueHostFactory = new PropertyValueHostFactory();
            break;
        default:
            let vhf = new ValueHostFactory();
            registerStandardValueHostGenerators(vhf);
            vs.valueHostFactory = vhf;
            break;
    }

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

    // --- DataTypeParserService -------------------------------------
    // Plenty to configure here. See function below.
    let dtps = new DataTypeParserService();
    vs.dataTypeParserService = dtps;
    registerDataTypeParsers(dtps);


    // --- AutoGenerateDataTypeCheckService -------------------------------------
    // Plenty to configure here. See function below.
    let ag = new AutoGenerateDataTypeCheckService();
    vs.autoGenerateDataTypeCheckService = ag;
    registerDataTypeCheckGenerators(ag);    

    // --- Text localization service
    // The built-in class, TextLocalizerService, doesn't use a third party localization
    // library. If you prefer one, create a class that implements ITextLocalizerService
    vs.textLocalizerService = createTextLocalizerService(usage);

    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLoggerService and another, create the other
    // and pass it as the second parameter of ConsoleLoggerService.
    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);

    // --- MessageTokenResolverService ----------------------
    // Generally you don't have to modify this.
    vs.messageTokenResolverService = new MessageTokenResolverService();

    // --- LookupKeyFallbackService -------------------------
    // Modify this only when you introduce new lookup keys for data types
    // whose underlying data type is the same as an already known lookup key.
    vs.lookupKeyFallbackService = createLookupKeyFallbackService();

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
    cf.register<EqualToConditionConfig>(
        ConditionType.EqualTo, (config) => new EqualToCondition(config));
    cf.register<NotEqualToConditionConfig>
        (ConditionType.NotEqualTo, (config) => new NotEqualToCondition(config));
    cf.register<GreaterThanConditionConfig>
        (ConditionType.GreaterThan, (config) => new GreaterThanCondition(config));
    cf.register<LessThanConditionConfig>
        (ConditionType.LessThan, (config) => new LessThanCondition(config));
    cf.register<GreaterThanOrEqualConditionConfig>
        (ConditionType.GreaterThanOrEqual, (config) => new GreaterThanOrEqualCondition(config));
    cf.register<LessThanOrEqualConditionConfig>
        (ConditionType.LessThanOrEqual, (config) => new LessThanOrEqualCondition(config));
    cf.register<EqualToValueConditionConfig>(
        ConditionType.EqualToValue, (config) => new EqualToValueCondition(config));
    cf.register<NotEqualToValueConditionConfig>
        (ConditionType.NotEqualToValue, (config) => new NotEqualToValueCondition(config));
    cf.register<GreaterThanValueConditionConfig>
        (ConditionType.GreaterThanValue, (config) => new GreaterThanValueCondition(config));
    cf.register<LessThanValueConditionConfig>
        (ConditionType.LessThanValue, (config) => new LessThanValueCondition(config));
    cf.register<GreaterThanOrEqualValueConditionConfig>
        (ConditionType.GreaterThanOrEqualValue, (config) => new GreaterThanOrEqualValueCondition(config));
    cf.register<LessThanOrEqualValueConditionConfig>
        (ConditionType.LessThanOrEqualValue, (config) => new LessThanOrEqualValueCondition(config));    
    cf.register<StringLengthConditionConfig>
        (ConditionType.StringLength, (config) => new StringLengthCondition(config));
    
    // Lazy load anything that is infrequently used.
    // Feel free to move conditions into and out of this as needed.
    cf.lazyLoad = (factory) => {
    
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
    
        cf.register<PositiveConditionConfig>
            (ConditionType.Positive, (config) => new PositiveCondition(config));
        cf.register<IntegerConditionConfig>
            (ConditionType.Integer, (config) => new IntegerCondition(config));
        cf.register<MaxDecimalsConditionConfig>
            (ConditionType.MaxDecimals, (config) => new MaxDecimalsCondition(config));
    }
}


/**
 * Cultures that you want to localize. 
 * -> Create an array of CultureIdFallback objects in configureCultures()
 */
export function registerCultures(cs: ICultureService): void
{
   let cultures: Array<CultureIdFallback> = [
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
    cultures.forEach((culture) => cs.register(culture));
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
    // this supports lazyload if you want it
    /*
    dtis.lazyLoad = (service)=>{
        dtis.register();
    }
    */
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
    // NOTE: Lazy loads here, but its optional, and you can register some before attaching the callback
    // for cases that you know will be needed early on.
    dtfs.lazyLoad = (service) => {
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
    // NOTE: Lazy loads here, but its optional, and you can register some before attaching the callback
    // for cases that you know will be needed early on.
    dtcs.lazyLoad = (service) => {
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
{
/* These are pre-installed into DataTypeIdentifierService as they are core functionality
    dtcs.register(new BooleanDataTypeComparer());
*/
    // this supports the lazyLoad model:
    /*
    dtcs.lazyLoad = (service)=>{
    // dtcs.register()
    }
    */
}
/**
 * Give data types their parsers, for use with InputValueHosts.
 * This is useful both in the browser and service side.
 * Browser: an input's onchanged event.
 * Server: a form's inputs are posted back as strings.
 * 
 * When you call InputValueHost.setInputValue("value"), it uses a parser to
 * convert the string into the native value, available from valueHost.getValue().
 * If parsing fails, getValue returns undefined and the DataTypeCheckCondition
 * used in validation will report an error to the user.
 * 
 * Parsers are localized, and should support the cultures you identified earlier.
 * 
 *   -> Use classes that implement IDataTypeParser in register()
 * @param dtps 
 */
export function registerDataTypeParsers(dtps: DataTypeParserService): void {
    dtps.enabled = true;
    // NOTE: Lazy loads here, but its optional, and you can register some before attaching the callback
    // for cases that you know will be needed early on.
    dtps.lazyLoad = (service) => {
    
        // Register DataTypeParsers the app will use, including adding your own
        // The order registered is the order used for matching lookup keys.


        // This registratation ensures that every string trims lead and trailing spaces...
        dtps.register(new CleanUpStringParser(LookupKey.String, { trim: true }));

        // CleanUpStringParser has many useful options to cleanup strings.
        // You might have specialized lookup keys for strong patterned strings,
        // like a phone number or postal code that need strings cleaned up from
        // within the user's formatted entry, such as converting "(203) 300-4000"
        // into the pattern [3 digit]-[3 digit]-[4 digit] pattern ("203-300-4000") 
        // expected when you store it.
        // You will still need validators to reject the final text when it is not the expected pattern.
        /*
        dtps.register(new CleanUpStringParser("USPhoneNumber", {
            trim: true,
            compressWhitespace: true,
            replaceWhitespace: '-',
            stripTheseCharacters: '().'
        }));
        */

        // --- The following sections are culture sensitive.
        // Example data is provided for:
        // 'en-US', 'en-CA', 'en-GB', 'en-MX', 'en'
        // 'es-ES', 'es-MX', 'es'
        // 'fr-FR', 'fr-CA', 'fr'
        // 'de-DE', 'de'
        // Rework each section to accomodate the cultures your app uses.
    

        // --- Numbers -------------------

        // culture specific number rules
        // 'US', 'GB, 'CA', 'MX'
        let enUSNumbers: NumberCultureInfo = {
            decimalSeparator: '.',
            negativeSymbol: '-',
            thousandsSeparator: ',',
            currencySymbol: '$',
            percentSymbol: '%'
        };
        let enGBNumbers: NumberCultureInfo = { ...enUSNumbers, currencySymbol: '£' };
        let enCANumbers: NumberCultureInfo = { ...enUSNumbers, currencySymbol: '$' }
    
        // 'FR', 'CA'
        let frFRNumbers: NumberCultureInfo = {
            decimalSeparator: ',',
            negativeSymbol: '-',
            thousandsSeparator: ' ',
            currencySymbol: '€',
            percentSymbol: '%'
        };
        let frCANumbers: NumberCultureInfo = { ...frFRNumbers, currencySymbol: '$' }
    
        // Spanish and German: 'ES', 'DE'
        let esESNumbers: NumberCultureInfo = {
            decimalSeparator: ',',
            negativeSymbol: '-',
            thousandsSeparator: '.',
            currencySymbol: '€',
            percentSymbol: '%'
        };

        function registerNumbersFor(cultureIDs: Array<string>, cultureInfo: NumberCultureInfo): void {
            // for LookupKey.Number
            dtps.register(new NumberParser(cultureIDs, cultureInfo));
            // for LookupKey.Currency
            dtps.register(new CurrencyParser(cultureIDs, cultureInfo));
            // for LookupKey.Percentage
            dtps.register(new PercentageParser(cultureIDs, cultureInfo));
            // for LookupKey.Percentage100
            dtps.register(new Percentage100Parser(cultureIDs, cultureInfo));
        }

        registerNumbersFor(['en-US', 'en-MX', 'es-MX', 'en'], enUSNumbers);
        registerNumbersFor(['en-CA'], enCANumbers);
        registerNumbersFor(['en-GB'], enGBNumbers);
        registerNumbersFor(['fr-FR', 'fr'], frFRNumbers);
        registerNumbersFor(['fr-CA'], frCANumbers);
        registerNumbersFor(['es-ES', 'de-DE', 'es', 'de'], esESNumbers);

        // --- DateTimes ------
        // 'US'
        let enUSDateTimes: DateTimeCultureInfo = {
            order: 'mdy',
            shortDateSeparator: '/',
            twoDigitYearBreak: 29
        };

        // 'CA'
        let enCADateTimes: DateTimeCultureInfo =
        {
            order: 'ymd',
            shortDateSeparator: '/',
            twoDigitYearBreak: 29
        }
        // most others
        let enGBDateTimes: DateTimeCultureInfo =
        {
            order: 'dmy',
            shortDateSeparator: '/',
            twoDigitYearBreak: 29
        }

        let usingUTCForDates = true;    // set to false if using local time for dates
        function registerDateTimesFor(cultureIDs: Array<string>, cultureInfo: DateTimeCultureInfo): void {
            dtps.register(new ShortDatePatternParser(LookupKey.Date, cultureIDs, cultureInfo, usingUTCForDates));
            dtps.register(new ShortDatePatternParser(LookupKey.ShortDate, cultureIDs, cultureInfo, usingUTCForDates));
        }

        registerDateTimesFor(['en-US', 'es-US'], enUSDateTimes);
        registerDateTimesFor(['en-CA'], enCADateTimes);
        registerDateTimesFor(['en-GB', 'fr-FR', 'fr-CA', 'es-MX', 'es-ES', 'de-DE'], enGBDateTimes);

        // --- booleans -----------
        // If you post back form input of type='checkbox', it needs the boolean parser.
        // The value varies, but is always a non-empty string.
        // EmptyStringIsFalseParser handles that special case, but you must supply a lookup key.
        dtps.register(new EmptyStringIsFalseParser('NEEDS A LOOKUP KEY'));

        // There is a BooleanParser that can handle a list of strings for both true and false.
        // This is a sample configuration.

        // all text is case insensitive matching
        let coreTrueValues = ['1', 'true', 't'];
        let coreFalseValues = ['0', 'false', 'f', ''];
        let enExtraTrueValues = ['yes'];
        let enExtraFalseValues = ['no'];
        let esExtraTrueValues = ['sí', 'verdadero'];
        let esExtraFalseValues = ['no', 'falso'];
        let frExtraTrueValues = ['oui', 'vrai'];
        let frExtraFalseValues = ['non', 'faux'];
        let deExtraTrueValues = ['ja', 'wahr'];
        let deExtraFalseValues = ['nein', 'falsch'];
        dtps.register(new BooleanParser(['en', 'en-US', 'en-CA', 'en-GB'],
            {
                trueValues: coreTrueValues.concat(enExtraTrueValues),
                falseValues: coreFalseValues.concat(enExtraFalseValues)
            }));
        dtps.register(new BooleanParser(['es', 'es-US', 'es-ES', 'es-MX'],
            {
                trueValues: coreTrueValues.concat(esExtraTrueValues),
                falseValues: coreFalseValues.concat(esExtraFalseValues)
            }));
        dtps.register(new BooleanParser(['fr', 'fr-FR', 'fr-CA'],
            {
                trueValues: coreTrueValues.concat(frExtraTrueValues),
                falseValues: coreFalseValues.concat(frExtraFalseValues)
            }));
        dtps.register(new BooleanParser(['de', 'de-DE'],
            {
                trueValues: coreTrueValues.concat(deExtraTrueValues),
                falseValues: coreFalseValues.concat(deExtraFalseValues)
            }));
    }
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
    ag.lazyLoad = (service) => {
    
        // See \examples\EmailAddressDataType.ts for example.
        //    ag.register(new EmailAddressDataTypeCheckConverter());

        ag.register(new IntegerDataTypeCheckGenerator());
    }
}


export function createTextLocalizerService(usage: 'client' | 'server' | 'all' = 'client'): ITextLocalizerService
{
    let service = new TextLocalizerService();
    service.lazyLoad = (tls) => {
    
        // Validator error messages can use these instead of having to be setup on individual ValidatorConfigs.
        // So long as you don't supply a value to the ValidatorConfig.errorMessage property, it will
        // create a lookup key using this pattern, and see if the TextLocalizerService has a value for it.
        // EM-ErrorCode-DataTypeLookupKey
        // and a fallback:
        // EM-ErrorCode
        // Similar for summaryMessage, only with SEM- prefix:
        // SEM-ErrorCode-DataTypeLookupKey
        // SEM-ErrorCode
        // The term "ErrorCode" is usually the ConditionType on the Condition, but can be overridden 
        // on ValidatorConfig.errorCode. 
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
            '*': 'Invalid value. Expects {DataType}.'   // this is a fallback for when all datatypelookup keys have failed. Its very unhelpful for dates and other culture specific strong patterns. That's why we need data type specific versions.
        });
        service.registerSummaryMessage(ConditionType.DataTypeCheck, null, {
            '*': '{Label} has an invalid value. Expects {DataType}.'
        });
        /* If you use the setValueOption.conversionErrorTokenValue in setValue, these are better than the last two    
            service.registerErrorMessage(ConditionType.DataTypeCheck, null, {
                '*': 'Invalid value. Expects {DataType}. {ConversionError}.' 
            });
            service.registerSummaryMessage(ConditionType.DataTypeCheck, null, {
                '*': '{Label} has an invalid value. Expects {DataType}. {ConversionError}.'
            });    
        */

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

        // --- for the {DataType} token in error messages
        // Currently formatted so it works in "Enter {DataType}", by including a leading word, like "a date", "an integer", etc.
        service.registerDataTypeLabel(LookupKey.String, {
            '*': 'text',
            'en': 'text',
            'es': 'uno texto'
        });
        service.registerDataTypeLabel(LookupKey.Date, {
            '*': 'a date',
            'en': 'a date',
            'es': 'una fecha'
        });
        service.registerDataTypeLabel(LookupKey.DateTime, {
            '*': 'a date and time',
            'en': 'a date and time',
            'es': 'una fecha y una hora'
        });
        service.registerDataTypeLabel(LookupKey.Number, {
            '*': 'a number',
            'en': 'a number',
            'es': 'un número'
        });
        service.registerDataTypeLabel(LookupKey.Integer, {
            '*': 'an integer number',
            'en': 'an integer number',
            'es': 'un número entero'
        });

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

    }

    return service;
    
}

/**
 * Service for creating a relationship between a lookup key and another
 * that is the base data type it is built around.
 * For example, LookupKey.Integer uses a number as the base data type.
 * So it has a relationship with LookupKey.Number.
 * This service keeps these relationships. The DataTypeFormatterService and DataTypeParserService
 * consume this as they try to find the best fitting Formatter or Parser.
 * 
 * Suppose that your InputValueHost has its datatype="PositiveInteger".
 * Initially DataTypeFormatterService and DataTypeParserService look for a Formatter
 * or Parser whose LookupKey is "PositiveInteger". If not found, we don't want to 
 * force the user to either create a new class or register a map with "PositiveInteger"
 * and a suitable class: NumberFormatter or NumberParser.
 * 
 * As a result, the user should register each NEW lookupkey they create if it has a
 * natural base data type.
 * 
 * Jivs will automatically register its own built-in LookupKeys (see LookupKeys.ts)
 * @returns 
 */    
export function createLookupKeyFallbackService(): ILookupKeyFallbackService
{
    let service = new LookupKeyFallbackService();
/*
    // example. Suppose you introduced "PositiveInteger" lookup key.
    // If you don't also create a DataTypeFormatter or DataTypeParser for it,
    // this code will allow it to use the built-in ones for "Integer" lookup key.
    service.register('PositiveInteger', LookupKey.Integer);
*/
    return service;
}