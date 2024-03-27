import {
    DataTypeCheckConditionDescriptor,  DataTypeCheckCondition, RequiredTextConditionDescriptor,
    RequiredTextCondition, RequiredIndexConditionDescriptor, RequiredIndexCondition, RegExpConditionDescriptor,
    RegExpCondition, RangeConditionDescriptor, RangeCondition, CompareToConditionDescriptor,
    EqualToCondition, NotEqualToCondition,  GreaterThanCondition,
    LessThanCondition, GreaterThanOrEqualToCondition, 
    LessThanOrEqualToCondition, StringLengthConditionDescriptor, StringLengthCondition, AllMatchConditionDescriptor,
    AllMatchCondition, AnyMatchConditionDescriptor,  AnyMatchCondition, CountMatchesConditionDescriptor,
    CountMatchesCondition,
    StringNotEmptyConditionDescriptor,
    StringNotEmptyCondition,
    NotNullConditionDescriptor,
    NotNullCondition
} from "../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../src/Conditions/ConditionFactory";
import { ConditionType } from "../src/Conditions/ConditionTypes";
import { BooleanDataTypeComparer } from "../src/DataTypes/DataTypeComparers";
import { CaseInsensitiveStringConverter, UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, TotalDaysConverter, IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter } from "../src/DataTypes/DataTypeConverters";
import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../src/DataTypes/DataTypeIdentifiers";
import {
    StringFormatter, NumberFormatter, IntegerFormatter, DateFormatter, CapitalizeStringFormatter,
    UppercaseStringFormatter, LowercaseStringFormatter, DateTimeFormatter, AbbrevDateFormatter,
    AbbrevDOWDateFormatter, LongDateFormatter, LongDOWDateFormatter, TimeofDayFormatter, TimeofDayHMSFormatter,
    BooleanFormatter, CurrencyFormatter, PercentageFormatter, Percentage100Formatter
} from "../src/DataTypes/DataTypeFormatters";
import { CultureIdFallback, DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { LookupKey } from "../src/DataTypes/LookupKeys";
import { LoggingLevel } from "../src/Interfaces/Logger";
import { ITextLocalizerService } from "../src/Interfaces/TextLocalizerService";
import { ConsoleLogger } from "../src/Services/ConsoleLogger";
import { TextLocalizerService } from "../src/Services/TextLocalizerService";
import { ValidationServices } from "../src/Services/ValidationServices";
import { MessageTokenResolver } from './../src/ValueHosts/MessageTokenResolver';

/**
 * You must create a ValidationServices object prior to your ValidationManager.
 * It has extensive configuration options. Many have defaults.
 * However, when it comes to these, we prefer to let you choose the classes
 * you will use instead of having all available prepopulated.
 * 
 * 1. Add this code to your app.
 * 2. Modify this function as needed. Consider starting with a small list of 
 *    classes that seem obvious and add others when needed.
 * 
 * Upon creating your ValidationServices object, call this function to
 * configure it. 
 */

export function createValidationServices(): ValidationServices {
    let vs = new ValidationServices();

    vs.activeCultureId = 'en'; // set this to your default culture

    // --- ConditionFactory ---------------------------
    vs.conditionFactory = createConditionFactory();

    // --- DataTypeServices services -------------------------------------
    // Plenty to configure here. See CreateDataTypeServices function below.
    vs.dataTypeServices = createDataTypeServices();

    // --- Text localization service
    // The built-in class, TextLocalizerService, doesn't use a third party localization
    // library. If you prefer one, create a class that implements ITextLocalizerService
    vs.textLocalizerService = createTextLocalizerService();

    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLogger and another, create the other
    // and pass it as the second paramter of ConsoleLogger.
    vs.loggerService = new ConsoleLogger(LoggingLevel.Error);

    // --- MessageTokenResolverService ----------------------
    // Generally you don't have to modify this.
    vs.messageTokenResolverService = new MessageTokenResolver();

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
    // Install the desired conditions
    cf.register<DataTypeCheckConditionDescriptor>(
        ConditionType.DataTypeCheck, (descriptor) => new DataTypeCheckCondition(descriptor));
    cf.register<RequiredTextConditionDescriptor>(
        ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor));
    cf.register<RequiredIndexConditionDescriptor>(
        ConditionType.RequiredIndex, (descriptor) => new RequiredIndexCondition(descriptor));
    cf.register<RegExpConditionDescriptor>(
        ConditionType.RegExp, (descriptor) => new RegExpCondition(descriptor));
    cf.register<RangeConditionDescriptor>(
        ConditionType.Range, (descriptor) => new RangeCondition(descriptor));
    cf.register<CompareToConditionDescriptor>(
        ConditionType.EqualTo, (descriptor) => new EqualToCondition(descriptor));
    cf.register<CompareToConditionDescriptor>
        (ConditionType.NotEqualTo, (descriptor) => new NotEqualToCondition(descriptor));
    cf.register<CompareToConditionDescriptor>
        (ConditionType.GreaterThan, (descriptor) => new GreaterThanCondition(descriptor));
    cf.register<CompareToConditionDescriptor>
        (ConditionType.LessThan, (descriptor) => new LessThanCondition(descriptor));
    cf.register<CompareToConditionDescriptor>
        (ConditionType.GreaterThanOrEqualTo, (descriptor) => new GreaterThanOrEqualToCondition(descriptor));
    cf.register<CompareToConditionDescriptor>
        (ConditionType.LessThanOrEqualTo, (descriptor) => new LessThanOrEqualToCondition(descriptor));
    cf.register<StringLengthConditionDescriptor>
        (ConditionType.StringLength, (descriptor) => new StringLengthCondition(descriptor));
    cf.register<AllMatchConditionDescriptor>
        (ConditionType.And, (descriptor) => new AllMatchCondition(descriptor));
    cf.register<AnyMatchConditionDescriptor>
        (ConditionType.Or, (descriptor) => new AnyMatchCondition(descriptor));
    cf.register<CountMatchesConditionDescriptor>
        (ConditionType.CountMatches, (descriptor) => new CountMatchesCondition(descriptor));
    // StringNotEmpty is similar to RequiredText, but lacks evaluating as the user types
    cf.register<StringNotEmptyConditionDescriptor>(
        ConditionType.StringNotEmpty, (descriptor) => new StringNotEmptyCondition(descriptor));
    cf.register<NotNullConditionDescriptor>(
        ConditionType.NotNull, (descriptor) => new NotNullCondition(descriptor));
    // aliases for users who don't deal well with boolean logic can relate
    cf.register<AllMatchConditionDescriptor>
        (ConditionType.All, (descriptor) => new AllMatchCondition(descriptor));
    cf.register<AnyMatchConditionDescriptor>
        (ConditionType.Any, (descriptor) => new AnyMatchCondition(descriptor));
}

/**
 * DataTypeServices needs:
 * 1. Cultures that you want to localize. 
 *    -> Create an array of CultureIdFallback objects in ConfigureCultures()
 * 
 * 2. Give native types their Lookup Keys. 
 *    -> Use classes that implement IDataTypeIdentifier in RegisterDataTypeIdentifiers()
 * 
 * 3. Give data types their formatters for the tokens you use within error messages,
 *    like: "The value {Value} is above {Maximum}".
 *    These are localized, and should support the cultures you identified earlier.
 *    -> Use classes that implement IDataTypeFormatter in RegisterDataTypeFormatters()
 * 
 * 4. Give data types ways to convert their values.
 *    Usually these convert their values to a number, string, or Date object.
 *    Conditions compare two values automatically when they are number, string, or Date object.
 *    -> Use classes that implement IDataTypeConverter in RegisterDataTypeConverters()
 * 
 * 5. Give your custom objects the ability to compare to each other.
 *    This is a special case where using an IDataTypeConverter isn't enough.
 *    We've provided a comparer for Booleans, because we wanted them to have
 *    comparison results of Equals or NotEquals (instead of default Equals, Lessthan, GreaterThan)
 *    -> Use classes that implement IDataTypeComparer in RegisterDataTypeComparers()
 * 
 * See the /examples/ folder for creating your own IDataTypeIdentifier, IDataTypeFormatter,
 * IDataTypeConverter, and IDataTypeComparer.
 * @param activeCultureID 
 * @param cultureConfig 
 */
export function createDataTypeServices(activeCultureID?: string | null, cultureConfig?: Array<CultureIdFallback> | null): DataTypeServices {
    let cc: Array<CultureIdFallback> = cultureConfig ?? configureCultures();

    let dts = new DataTypeServices(cc);
    populateDataTypeServices(dts);
    return dts;
}


export function configureCultures(): Array<CultureIdFallback>
{
   // 1. CultureIdFallback objects and the default culture
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

export function populateDataTypeServices(dts: DataTypeServices): void {

    registerDataTypeIdentifiers(dts);

    registerDataTypeFormatters(dts);

    registerDataTypeConverters(dts);

    registerDataTypeComparers(dts);
}

// 2. IDataTypeIdentifiers. 
export function registerDataTypeIdentifiers(dts: DataTypeServices): void
{
    // !!!Please retain: StringDataTypeIdentifier, NumberDataTypeIdentifier, BooleanDataTypeIdentifier, and DateDataTypeIdentifier
    dts.registerDataTypeIdentifier(new NumberDataTypeIdentifier());
    dts.registerDataTypeIdentifier(new StringDataTypeIdentifier());
    dts.registerDataTypeIdentifier(new BooleanDataTypeIdentifier());
    dts.registerDataTypeIdentifier(new DateDataTypeIdentifier());
}
// 3. IDataTypeFormatter
export function registerDataTypeFormatters(dts: DataTypeServices): void
{
    // Most of these can be modified through their constructor.
    // - Those that use the Intl library for localization let you pass options
    //   supported by Intl.NumberFormat or Intl.DateFormat.
    // - The Boolean and YesNo let you supply a list of cultures and their
    //   language specific values for "TrueLabel" and "FalseLabel"
    dts.registerFormatter(new StringFormatter());
    dts.registerFormatter(new NumberFormatter());     // options?: Intl.NumberFormatOptions
    dts.registerFormatter(new IntegerFormatter());    // options?: Intl.NumberFormatOptions
    dts.registerFormatter(new DateFormatter());       // options?: Intl.DateTimeFormatOptions

    // less used - consider commenting out until you know they are neded
    dts.registerFormatter(new CapitalizeStringFormatter());
    dts.registerFormatter(new UppercaseStringFormatter());
    dts.registerFormatter(new LowercaseStringFormatter());
    dts.registerFormatter(new DateTimeFormatter());       // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new AbbrevDateFormatter());     // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new AbbrevDOWDateFormatter());  // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new LongDateFormatter());       // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new LongDOWDateFormatter());    // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new TimeofDayFormatter());      // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new TimeofDayHMSFormatter());   // options?: Intl.DateTimeFormatOptions
    dts.registerFormatter(new CurrencyFormatter('USD'));  // set this to your currency code
    // defaultCurrencyCode: 'USD', options?: Intl.NumberFormatOptions, cultureToCurrencyCode? { 'en-US' : 'USD', 'es-SP': 'EUR' }

    dts.registerFormatter(new PercentageFormatter());     // options?: Intl.NumberFormatOptions
    dts.registerFormatter(new Percentage100Formatter());  // options?: Intl.NumberFormatOptions
    // NOTE: BooleanFormatter has its strings localized in ValidationServices.TextLocalizerService
    // connected to the TrueLabell10n and FalseLabell10n properties.
    dts.registerFormatter(new BooleanFormatter(LookupKey.Boolean)); // "true" and "false"
   // Example of providing another set of labels for true/false by supplying a different lookup key
    dts.registerFormatter(new BooleanFormatter(LookupKey.YesNoBoolean, 'yes', 'no')); 
 
}

// 4. IDataTypeConverters
export function registerDataTypeConverters(dts: DataTypeServices): void
{
    dts.registerDataTypeConverter(new CaseInsensitiveStringConverter());
    dts.registerDataTypeConverter(new UTCDateOnlyConverter());
    dts.registerDataTypeConverter(new DateTimeConverter());
    dts.registerDataTypeConverter(new LocalDateOnlyConverter());
    dts.registerDataTypeConverter(new TimeOfDayOnlyConverter());
    dts.registerDataTypeConverter(new TimeOfDayHMSOnlyConverter());
    dts.registerDataTypeConverter(new IntegerConverter());
    dts.registerDataTypeConverter(new TotalDaysConverter());
}

// 5. IDataTypeComparers
export function registerDataTypeComparers(dts: DataTypeServices): void
{
    dts.registerDataTypeComparer(new BooleanDataTypeComparer());
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

    // Validator error messages can use these instead of having to be setup on individual InputValidatorDescriptors.
    // So long as you don't supply a value to the InputValidatorDescriptor.errorMessage property, it will
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
    service.registerErrorMessage(ConditionType.RequiredText, null, {
        '*': 'Requires a value.'
    });
    service.registerSummaryMessage(ConditionType.RequiredText, null, {
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