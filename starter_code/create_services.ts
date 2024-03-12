import {
    IDataTypeCheckConditionDescriptor, DataTypeCheckConditionType, DataTypeCheckCondition, IRequiredTextConditionDescriptor, RequiredTextConditionType,
    RequiredTextCondition, IRequiredIndexConditionDescriptor, RequiredIndexConditionType, RequiredIndexCondition, IRegExpConditionDescriptor,
    RegExpConditionType, RegExpCondition, IRangeConditionDescriptor, RangeConditionType, RangeCondition, ICompareToConditionDescriptor,
    ValuesEqualConditionType, ValuesEqualCondition, ValuesNotEqualConditionType, ValuesNotEqualCondition, ValueGTSecondValueConditionType, ValueGTSecondValueCondition,
    ValueLTSecondValueConditionType, ValueLTSecondValueCondition, ValueGTESecondValueConditionType, ValueGTESecondValueCondition, ValueLTESecondValueConditionType,
    ValueLTESecondValueCondition, IStringLengthConditionDescriptor, StringLengthConditionType, StringLengthCondition, IAndConditionsDescriptor,
    AndConditionsType, AndConditions, IOrConditionsDescriptor, OrConditionsType, OrConditions, ICountMatchingConditionsDescriptor, CountMatchingConditionsType,
    CountMatchingConditions, EveryConditionType, AnyConditionsType
} from "../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../src/Conditions/ConditionFactory";
import { BooleanDataTypeComparer } from "../src/DataTypes/DataTypeComparers";
import { CaseInsensitiveStringConverter, UTCDateOnlyConverter, DateTimeConverter, LocalDateOnlyConverter, TotalDaysConverter, RoundToWholeConverter } from "../src/DataTypes/DataTypeConverters";
import { NumberDataTypeIdentifier, StringDataTypeIdentifier, BooleanDataTypeIdentifier, DateDataTypeIdentifier } from "../src/DataTypes/DataTypeIdentifiers";
import {
    StringLocalizedFormatter, NumberLocalizedFormatter, IntegerLocalizedFormatter, DateLocalizedFormatter, CapitalizeStringLocalizedFormatter,
    UppercaseStringLocalizedFormatter, LowercaseStringLocalizedFormatter, DateTimeLocalizedFormatter, AbbrevDateLocalizedFormatter,
    AbbrevDOWDateLocalizedFormatter, LongDateLocalizedFormatter, LongDOWDateLocalizedFormatter, TimeofDayLocalizedFormatter, TimeofDayHMSLocalizedFormatter,
    BooleanLocalizedFormatter, YesNoBooleanLocalizedFormatter, CurrencyLocalizedFormatter, PercentageLocalizedFormatter, Percentage100LocalizedFormatter
} from "../src/DataTypes/DataTypeLocalizedFormatters";
import { CultureConfig, DataTypeServices } from "../src/DataTypes/DataTypeServices";
import { LoggingLevel } from "../src/Interfaces/Logger";
import { ConsoleLogger } from "../src/Services/ConsoleLogger";
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

    // --- ConditionFactory ---------------------------
    vs.ConditionFactory = CreateConditionFactory();

    // --- DataTypeServices services -------------------------------------
    // Plenty to configure here. See CreateDataTypeServices function below.
    vs.DataTypeServices = CreateDataTypeServices();

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
        DataTypeCheckConditionType, (descriptor) => new DataTypeCheckCondition(descriptor));
    cf.Register<IRequiredTextConditionDescriptor>(
        RequiredTextConditionType, (descriptor) => new RequiredTextCondition(descriptor));
    cf.Register<IRequiredIndexConditionDescriptor>(
        RequiredIndexConditionType, (descriptor) => new RequiredIndexCondition(descriptor));
    cf.Register<IRegExpConditionDescriptor>(
        RegExpConditionType, (descriptor) => new RegExpCondition(descriptor));
    cf.Register<IRangeConditionDescriptor>(
        RangeConditionType, (descriptor) => new RangeCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>(
        ValuesEqualConditionType, (descriptor) => new ValuesEqualCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ValuesNotEqualConditionType, (descriptor) => new ValuesNotEqualCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ValueGTSecondValueConditionType, (descriptor) => new ValueGTSecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ValueLTSecondValueConditionType, (descriptor) => new ValueLTSecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ValueGTESecondValueConditionType, (descriptor) => new ValueGTESecondValueCondition(descriptor));
    cf.Register<ICompareToConditionDescriptor>
        (ValueLTESecondValueConditionType, (descriptor) => new ValueLTESecondValueCondition(descriptor));
    cf.Register<IStringLengthConditionDescriptor>
        (StringLengthConditionType, (descriptor) => new StringLengthCondition(descriptor));
    cf.Register<IAndConditionsDescriptor>
        (AndConditionsType, (descriptor) => new AndConditions(descriptor));
    cf.Register<IOrConditionsDescriptor>
        (OrConditionsType, (descriptor) => new OrConditions(descriptor));
    cf.Register<ICountMatchingConditionsDescriptor>
        (CountMatchingConditionsType, (descriptor) => new CountMatchingConditions(descriptor));
    // aliases for users who don't deal well with boolean logic can relate
    cf.Register<IAndConditionsDescriptor>
        (EveryConditionType, (descriptor) => new AndConditions(descriptor));
    cf.Register<IOrConditionsDescriptor>
        (AnyConditionsType, (descriptor) => new OrConditions(descriptor));
}

/**
 * DataTypeServices needs:
 * 1. Cultures that you want to localize. 
 *    -> Create an array of CultureConfig objects in ConfigureCultures()
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
export function CreateDataTypeServices(activeCultureID?: string | null, cultureConfig?: Array<CultureConfig> | null): DataTypeServices {
    let cc: Array<CultureConfig> = cultureConfig ?? ConfigureCultures();

    let dts = new DataTypeServices(activeCultureID ?? 'en', // feel free to change 'en' to your default culture
        cc);
    PopulateDataTypeServices(dts);
    return dts;
}


export function ConfigureCultures(): Array<CultureConfig>
{
   // 1. CultureConfig objects and the default culture
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
    dts.RegisterLocalizedFormatter(new CurrencyLocalizedFormatter('USD'));  // feel free to change the default currency code
    // defaultCurrencyCode: 'USD', options?: Intl.NumberFormatOptions, cultureToCurrencyCode? { 'en-US' : 'USD', 'es-SP': 'EUR' }

    dts.RegisterLocalizedFormatter(new PercentageLocalizedFormatter());     // options?: Intl.NumberFormatOptions
    dts.RegisterLocalizedFormatter(new Percentage100LocalizedFormatter());  // options?: Intl.NumberFormatOptions
    dts.RegisterLocalizedFormatter(new BooleanLocalizedFormatter());        // cultureToLabels?: Array<CultureToBooleanLabels>
    // example parameter supporting english and spanish: 
    // [
    //   { CultureId: 'en', TrueLabel: 'true', FalseLabel: 'false' },
    //   { CultureId: 'es', TrueLabel: 'verdadero', FalseLabel: 'falso' },    
    // ]
    dts.RegisterLocalizedFormatter(new YesNoBooleanLocalizedFormatter());   // cultureToLabels?: Array<CultureToBooleanLabels>
    // example parameter supporting english and spanish: 
    // [
    //   { CultureId: 'en', TrueLabel: 'yes', FalseLabel: 'no' },
    //   { CultureId: 'es', TrueLabel: 'sí', FalseLabel: 'no' },    
    // ]    
}

// 4. IDataTypeConverters
export function RegisterDataTypeConverters(dts: DataTypeServices): void
{
    dts.RegisterDataTypeConverter(new CaseInsensitiveStringConverter());
    dts.RegisterDataTypeConverter(new UTCDateOnlyConverter());
    dts.RegisterDataTypeConverter(new DateTimeConverter());
    dts.RegisterDataTypeConverter(new LocalDateOnlyConverter());
    dts.RegisterDataTypeConverter(new TotalDaysConverter());
    dts.RegisterDataTypeConverter(new RoundToWholeConverter());
}

// 5. IDataTypeComparers
export function RegisterDataTypeComparers(dts: DataTypeServices): void
{
    dts.RegisterDataTypeComparer(new BooleanDataTypeComparer());
}
