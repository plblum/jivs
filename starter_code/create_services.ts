import {
    IDataTypeCheckConditionDescriptor,  DataTypeCheckCondition, IRequiredTextConditionDescriptor,
    RequiredTextCondition, IRequiredIndexConditionDescriptor, RequiredIndexCondition, IRegExpConditionDescriptor,
    RegExpCondition, IRangeConditionDescriptor, RangeCondition, ICompareToConditionDescriptor,
    ValuesEqualCondition, ValuesNotEqualCondition,  ValueGTSecondValueCondition,
    ValueLTSecondValueCondition, ValueGTESecondValueCondition, 
    ValueLTESecondValueCondition, IStringLengthConditionDescriptor, StringLengthCondition, IAndConditionsDescriptor,
    AndConditions, IOrConditionsDescriptor,  OrConditions, ICountMatchingConditionsDescriptor,
    CountMatchingConditions
} from "../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../src/Conditions/ConditionFactory";
import { ConditionType } from "../src/Conditions/ConditionTypes";
import { BooleanDataTypeComparer } from "../src/DataTypes/DataTypeComparers";
import { CaseInsensitiveStringConverter, UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, TotalDaysConverter, IntegerConverter, TimeOfDayOnlyConverter, TimeOfDayHMSOnlyConverter } from "../src/DataTypes/DataTypeConverters";
import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../src/DataTypes/DataTypeIdentifiers";
import {
    StringLocalizedFormatter, NumberLocalizedFormatter, IntegerLocalizedFormatter, DateLocalizedFormatter, CapitalizeStringLocalizedFormatter,
    UppercaseStringLocalizedFormatter, LowercaseStringLocalizedFormatter, DateTimeLocalizedFormatter, AbbrevDateLocalizedFormatter,
    AbbrevDOWDateLocalizedFormatter, LongDateLocalizedFormatter, LongDOWDateLocalizedFormatter, TimeofDayLocalizedFormatter, TimeofDayHMSLocalizedFormatter,
    BooleanLocalizedFormatter, CurrencyLocalizedFormatter, PercentageLocalizedFormatter, Percentage100LocalizedFormatter
} from "../src/DataTypes/DataTypeLocalizedFormatters";
import { CultureIdFallback, DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { AbbrevDateLookupKey, BooleanLookupKey, DateLookupKey, IntegerLookupKey, NumberLookupKey, YesNoBooleanLookupKey } from "../src/DataTypes/LookupKeys";
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

export function CreateValidationServices(): ValidationServices {
    let vs = new ValidationServices();

    vs.ActiveCultureId = 'en'; // set this to your default culture

    // --- ConditionFactory ---------------------------
    vs.ConditionFactory = CreateConditionFactory();

    // --- DataTypeServices services -------------------------------------
    // Plenty to configure here. See CreateDataTypeServices function below.
    vs.DataTypeServices = CreateDataTypeServices();

    // --- Text localization service
    // The built-in class, TextLocalizerService, doesn't use a third party localization
    // library. If you prefer one, create a class that implements ITextLocalizerService
    vs.TextLocalizerService = CreateTextLocalizerService();

    // --- Logger Service -----------------------------------    
    // If you want both the ConsoleLogger and another, create the other
    // and pass it as the second paramter of ConsoleLogger.
    vs.LoggerService = new ConsoleLogger(LoggingLevel.Error);

    // --- MessageTokenResolverService ----------------------
    // Generally you don't have to modify this.
    vs.MessageTokenResolverService = new MessageTokenResolver();

    return vs;
}

export function CreateConditionFactory(): ConditionFactory
{
    let cf = new ConditionFactory();
    RegisterConditions(cf);
    return cf;
}
export function RegisterConditions(cf: ConditionFactory): void
{
    // Install the desired conditions
    cf.Register<IDataTypeCheckConditionDescriptor>(
        ConditionType.DataTypeCheck, (descriptor) => new DataTypeCheckCondition(descriptor));
    cf.Register<IRequiredTextConditionDescriptor>(
        ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor));
    cf.Register<IRequiredIndexConditionDescriptor>(
        ConditionType.RequiredIndex, (descriptor) => new RequiredIndexCondition(descriptor));
    cf.Register<IRegExpConditionDescriptor>(
        ConditionType.RegExp, (descriptor) => new RegExpCondition(descriptor));
    cf.Register<IRangeConditionDescriptor>(
        ConditionType.Range, (descriptor) => new RangeCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>(
        ConditionType.ValuesEqual, (descriptor) => new ValuesEqualCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ConditionType.ValuesNotEqual, (descriptor) => new ValuesNotEqualCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ConditionType.ValueGTSecondValue, (descriptor) => new ValueGTSecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ConditionType.ValueLTSecondValue, (descriptor) => new ValueLTSecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ConditionType.ValueGTESecondValue, (descriptor) => new ValueGTESecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ConditionType.ValueLTESecondValue, (descriptor) => new ValueLTESecondValueCondition(descriptor));
    cf.Register<IStringLengthConditionDescriptor>
        (ConditionType.StringLength, (descriptor) => new StringLengthCondition(descriptor));
    cf.Register<IAndConditionsDescriptor>
        (ConditionType.And, (descriptor) => new AndConditions(descriptor));
    cf.Register<IOrConditionsDescriptor>
        (ConditionType.Or, (descriptor) => new OrConditions(descriptor));
    cf.Register<ICountMatchingConditionsDescriptor>
        (ConditionType.CountMatches, (descriptor) => new CountMatchingConditions(descriptor));
    // aliases for users who don't deal well with boolean logic can relate
    cf.Register<IAndConditionsDescriptor>
        (ConditionType.Every, (descriptor) => new AndConditions(descriptor));
    cf.Register<IOrConditionsDescriptor>
        (ConditionType.Any, (descriptor) => new OrConditions(descriptor));
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
 *    -> Use classes that implement IDataTypeLocalizedFormatter in RegisterDataTypeLocalizedFormatters()
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
 * See the /examples/ folder for creating your own IDataTypeIdentifier, IDataTypeLocalizedFormatter,
 * IDataTypeConverter, and IDataTypeComparer.
 * @param activeCultureID 
 * @param cultureConfig 
 */
export function CreateDataTypeServices(activeCultureID?: string | null, cultureConfig?: Array<CultureIdFallback> | null): DataTypeServices {
    let cc: Array<CultureIdFallback> = cultureConfig ?? ConfigureCultures();

    let dts = new DataTypeServices(cc);
    PopulateDataTypeServices(dts);
    return dts;
}


export function ConfigureCultures(): Array<CultureIdFallback>
{
   // 1. CultureIdFallback objects and the default culture
   return [
        //!!! This is sample data. Please rework as you need it.
            {
                CultureId: 'en',
                FallbackCultureId: null    // when this is the default culture,
            },
            {
                CultureId: 'en-US',
                FallbackCultureId: 'en'
            },
            {
                CultureId: 'es',
                FallbackCultureId: 'en'
            },
            {
                CultureId: 'es-MX',
                FallbackCultureId: 'es'
            }
        ];
}

export function PopulateDataTypeServices(dts: DataTypeServices): void {

    RegisterDataTypeIdentifiers(dts);

    RegisterDataTypeLocalizedFormatters(dts);

    RegisterDataTypeConverters(dts);

    RegisterDataTypeComparers(dts);
}

// 2. IDataTypeIdentifiers. 
export function RegisterDataTypeIdentifiers(dts: DataTypeServices): void
{
    // !!!Please retain: StringDataTypeIdentifier, NumberDataTypeIdentifier, BooleanDataTypeIdentifier, and DateDataTypeIdentifier
    dts.RegisterDataTypeIdentifier(new NumberDataTypeIdentifier());
    dts.RegisterDataTypeIdentifier(new StringDataTypeIdentifier());
    dts.RegisterDataTypeIdentifier(new BooleanDataTypeIdentifier());
    dts.RegisterDataTypeIdentifier(new DateDataTypeIdentifier());
}
// 3. IDataTypeLocalizedFormatter
export function RegisterDataTypeLocalizedFormatters(dts: DataTypeServices): void
{
    // Most of these can be modified through their constructor.
    // - Those that use the Intl library for localization let you pass options
    //   supported by Intl.NumberFormat or Intl.DateFormat.
    // - The Boolean and YesNo let you supply a list of cultures and their
    //   language specific values for "TrueLabel" and "FalseLabel"
    dts.RegisterLocalizedFormatter(new StringLocalizedFormatter());
    dts.RegisterLocalizedFormatter(new NumberLocalizedFormatter());     // options?: Intl.NumberFormatOptions
    dts.RegisterLocalizedFormatter(new IntegerLocalizedFormatter());    // options?: Intl.NumberFormatOptions
    dts.RegisterLocalizedFormatter(new DateLocalizedFormatter());       // options?: Intl.DateTimeFormatOptions

    // less used - consider commenting out until you know they are neded
    dts.RegisterLocalizedFormatter(new CapitalizeStringLocalizedFormatter());
    dts.RegisterLocalizedFormatter(new UppercaseStringLocalizedFormatter());
    dts.RegisterLocalizedFormatter(new LowercaseStringLocalizedFormatter());
    dts.RegisterLocalizedFormatter(new DateTimeLocalizedFormatter());       // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new AbbrevDateLocalizedFormatter());     // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new AbbrevDOWDateLocalizedFormatter());  // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new LongDateLocalizedFormatter());       // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new LongDOWDateLocalizedFormatter());    // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new TimeofDayLocalizedFormatter());      // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new TimeofDayHMSLocalizedFormatter());   // options?: Intl.DateTimeFormatOptions
    dts.RegisterLocalizedFormatter(new CurrencyLocalizedFormatter('USD'));  // set this to your currency code
    // defaultCurrencyCode: 'USD', options?: Intl.NumberFormatOptions, cultureToCurrencyCode? { 'en-US' : 'USD', 'es-SP': 'EUR' }

    dts.RegisterLocalizedFormatter(new PercentageLocalizedFormatter());     // options?: Intl.NumberFormatOptions
    dts.RegisterLocalizedFormatter(new Percentage100LocalizedFormatter());  // options?: Intl.NumberFormatOptions
    // NOTE: BooleanLocalizedFormatter has its strings localized in ValidationServices.TextLocalizerService
    // connected to the TrueLabell10n and FalseLabell10n properties.
    dts.RegisterLocalizedFormatter(new BooleanLocalizedFormatter(BooleanLookupKey)); // "true" and "false"
   // Example of providing another set of labels for true/false by supplying a different lookup key
    dts.RegisterLocalizedFormatter(new BooleanLocalizedFormatter(YesNoBooleanLookupKey, 'yes', 'no')); 
 
}

// 4. IDataTypeConverters
export function RegisterDataTypeConverters(dts: DataTypeServices): void
{
    dts.RegisterDataTypeConverter(new CaseInsensitiveStringConverter());
    dts.RegisterDataTypeConverter(new UTCDateOnlyConverter());
    dts.RegisterDataTypeConverter(new DateTimeConverter());
    dts.RegisterDataTypeConverter(new LocalDateOnlyConverter());
    dts.RegisterDataTypeConverter(new TimeOfDayOnlyConverter());
    dts.RegisterDataTypeConverter(new TimeOfDayHMSOnlyConverter());
    dts.RegisterDataTypeConverter(new IntegerConverter());
    dts.RegisterDataTypeConverter(new TotalDaysConverter());
}

// 5. IDataTypeComparers
export function RegisterDataTypeComparers(dts: DataTypeServices): void
{
    dts.RegisterDataTypeComparer(new BooleanDataTypeComparer());
}

export function CreateTextLocalizerService(): ITextLocalizerService
{
    let service = new TextLocalizerService();
    // the following is specific to TextLocalizerService class
    // and simply an example of working with it.
    // Feel free to replace this code in supporting your own
    // ITextLocalizerService implementation.
    // Here we provide localized text for "true", "false", "yes", and "no",
    // all used by the BooleanLocalizedFormatter.
    service.Register('TRUE', {
        '*': 'true',
        'en': 'true',
        'es': 'verdadero'
    });
    service.Register('FALSE', {
        '*': 'false',
        'en': 'false',
        'es': 'falso'
    });    
    service.Register('YES', {
        '*': 'yes',
        'en': 'yes',
        'es': 'sí'
    });
    service.Register('NO', {
        '*': 'no',
        'en': 'no',
        'es': 'no'
    });    

    // Validator error messages can use these instead of having to be setup on individual InputValidatorDescriptors.
    // So long as you don't supply a value to the InputValidatorDescriptor.ErrorMessage property, it will
    // create a lookup key using this pattern, and see if the TextLocalizerService has a value for it.
    // EM-ConditionType-DataTypeLookupKey
    // and a fallback:
    // EM-ConditionType
    // Similar for SummaryMessage, only with SEM- prefix:
    // SEM-ConditionType-DataTypeLookupKey
    // SEM-ConditionType
    // 
    // This becomes important for auto-generating the "Data type check" validators, a step that the UI developer
    // would normally have to inject into the list of validators from business logic.
    // Guidance: Remember that error messages need to be easily understood and help the user fix the input.
    // 
    //!!!ALERT: This is a partial list of ConditionTypes and possible DataTypeLookupKeys
    service.RegisterErrorMessage(ConditionType.RequiredText, null, {
        '*': 'Requires a value.'
    });
    service.RegisterSummaryMessage(ConditionType.RequiredText, null, {
        '*': '{Label} requires a value.'
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, null, {
        '*': 'Invalid value.'   // this is a fallback for when all datatypelookup keys have failed. Its a terrible error message, very unhelpful. That's why we need data type specific versions.
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, null, {
        '*': '{Label} has an invalid value.'
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, DateLookupKey,  {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, DateLookupKey,  {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, NumberLookupKey, {
        '*': 'Invalid value. Enter a number.',
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, NumberLookupKey, {
        '*': '{Label} has an invalid value. Enter a number.',
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, IntegerLookupKey, {
        '*': 'Invalid value. Enter an integer.',
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, IntegerLookupKey, {
        '*': '{Label} has an invalid value. Enter an integer.',
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, DateLookupKey, {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': 'Invalid value. Enter a date in this format: DD/MM/YYYY'
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, DateLookupKey, {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: MM/DD/YYYY',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD/MM/YYYY'
    });    
    service.RegisterErrorMessage(ConditionType.DataTypeCheck, AbbrevDateLookupKey, {
        '*': 'Invalid value. Enter a date.',
        'en-US': 'Invalid value. Enter a date in this format: Month DD, YYYY where month names are 3 letters',
        'en-GB': 'Invalid value. Enter a date in this format: DD Month YYYY where month names are 3 letters'
    });
    service.RegisterSummaryMessage(ConditionType.DataTypeCheck, AbbrevDateLookupKey, {
        '*': '{Label} has an invalid value. Enter a date.',
        'en-US': '{Label} has an invalid value. Enter a date in this format: Month DD, YYYY where month names are 3 letters',
        'en-GB': '{Label} has an invalid value. Enter a date in this format: DD Month YYYY where month names are 3 letters'
    });    


    return service;
    
}