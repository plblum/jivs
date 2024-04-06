import {
    DataTypeCheckCondition, RequiredTextCondition, RegExpCondition, RangeCondition, CompareToConditionDescriptor,
    EqualToCondition, StringLengthConditionDescriptor, StringLengthCondition, AllMatchCondition, AllMatchConditionDescriptor, AnyMatchCondition,
    AnyMatchConditionDescriptor, CountMatchesCondition, CountMatchesConditionDescriptor, GreaterThanCondition, GreaterThanOrEqualToCondition, LessThanCondition,
    LessThanOrEqualToCondition, NotEqualToCondition, NotNullCondition, NotNullConditionDescriptor, StringNotEmptyCondition, StringNotEmptyConditionDescriptor
} from "@plblum/jivs-engine/src/Conditions/ConcreteConditions";
import { ConditionFactory } from "@plblum/jivs-engine/src/Conditions/ConditionFactory";
import { ConditionType } from "@plblum/jivs-engine/src/Conditions/ConditionTypes";
import {
    StringFormatter, NumberFormatter, IntegerFormatter, DateFormatter, AbbrevDOWDateFormatter, AbbrevDateFormatter,
    BooleanFormatter, CapitalizeStringFormatter, CurrencyFormatter, DateTimeFormatter, LongDOWDateFormatter, LongDateFormatter,
    LowercaseStringFormatter, Percentage100Formatter, PercentageFormatter, TimeofDayFormatter, TimeofDayHMSFormatter, UppercaseStringFormatter
} from "@plblum/jivs-engine/src/DataTypes/DataTypeFormatters";
import { LoggingLevel } from "@plblum/jivs-engine/src/Interfaces/LoggerService";
import { AutoGenerateDataTypeCheckService } from "@plblum/jivs-engine/src/Services/AutoGenerateDataTypeCheckService";
import { ConsoleLoggerService } from "@plblum/jivs-engine/src/Services/ConsoleLoggerService";
import { DataTypeComparerService } from "@plblum/jivs-engine/src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "@plblum/jivs-engine/src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "@plblum/jivs-engine/src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "@plblum/jivs-engine/src/Services/DataTypeIdentifierService";
import { MessageTokenResolverService } from "@plblum/jivs-engine/src/Services/MessageTokenResolverService";
import { TextLocalizerService } from "@plblum/jivs-engine/src/Services/TextLocalizerService";
import { ValidationServices } from "@plblum/jivs-engine/src/Services/ValidationServices";
import { DataTypeCheckConditionDescriptor, RequiredTextConditionDescriptor, RegExpConditionDescriptor, RangeConditionDescriptor } from "@plblum/jivs-engine/src/Conditions/ConcreteConditions";
import { CultureIdFallback } from "@plblum/jivs-engine/src/Interfaces/DataTypeFormatterService";
import { ITextLocalizerService } from "@plblum/jivs-engine/src/Interfaces/TextLocalizerService";
import { LookupKey } from "@plblum/jivs-engine/src/DataTypes/LookupKeys";
import { registerTestingOnlyConditions } from "./conditionsForTesting";


export function createValidationServicesForTesting(): ValidationServices {
    let vs = new ValidationServices();
    vs.activeCultureId = 'en';

    vs.conditionFactory = createConditionFactory();

    let dtis = new DataTypeIdentifierService();
    vs.dataTypeIdentifierService = dtis;
    registerDataTypeIdentifiers(dtis);

    let dtfs = new DataTypeFormatterService();
    vs.dataTypeFormatterService = dtfs;
    registerDataTypeFormatters(dtfs);

    let dtcs = new DataTypeConverterService();
    vs.dataTypeConverterService = dtcs;
    registerDataTypeConverters(dtcs);
    
    let dtcmps = new DataTypeComparerService();
    vs.dataTypeComparerService = dtcmps;
    registerDataTypeComparers(dtcmps);    

    let ag = new AutoGenerateDataTypeCheckService();
    vs.autoGenerateDataTypeCheckService = ag;
    registerDataTypeCheckGenerators(ag);    

    vs.textLocalizerService = createTextLocalizerService();
    vs.loggerService = new ConsoleLoggerService(LoggingLevel.Error);
    vs.messageTokenResolverService = new MessageTokenResolverService();

    return vs;
}

export function createConditionFactory(): ConditionFactory
{
    let cf = new ConditionFactory();
    registerConditions(cf);
    registerTestingOnlyConditions(cf);    
    return cf;
}
export function registerConditions(cf: ConditionFactory): void
{
    cf.register<DataTypeCheckConditionDescriptor>(
        ConditionType.DataTypeCheck, (descriptor) => new DataTypeCheckCondition(descriptor));
    cf.register<RequiredTextConditionDescriptor>(
        ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor));
/*    
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
*/    
}
export function registerAllConditions(cf: ConditionFactory): void
{
    cf.register<DataTypeCheckConditionDescriptor>(
        ConditionType.DataTypeCheck, (descriptor) => new DataTypeCheckCondition(descriptor));
    cf.register<RequiredTextConditionDescriptor>(
        ConditionType.RequiredText, (descriptor) => new RequiredTextCondition(descriptor));
  
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
    cf.register<StringNotEmptyConditionDescriptor>(
        ConditionType.StringNotEmpty, (descriptor) => new StringNotEmptyCondition(descriptor));
    cf.register<NotNullConditionDescriptor>(
        ConditionType.NotNull, (descriptor) => new NotNullCondition(descriptor));
    cf.register<AllMatchConditionDescriptor>
        (ConditionType.All, (descriptor) => new AllMatchCondition(descriptor));
    cf.register<AnyMatchConditionDescriptor>
        (ConditionType.Any, (descriptor) => new AnyMatchCondition(descriptor));
}


/**
 * Cultures that you want to localize. 
 * -> Create an array of CultureIdFallback objects in configureCultures()
 */
export function configureCultures(): Array<CultureIdFallback>
{
   return [
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
            },
            {
                cultureId: 'fr',
                fallbackCultureId: 'en'
            }
        ];
}


export function registerDataTypeIdentifiers(dtis: DataTypeIdentifierService): void
{
}

export function registerDataTypeFormatters(dtfs: DataTypeFormatterService): void
{
    dtfs.register(new StringFormatter());
    dtfs.register(new NumberFormatter());     // options?: Intl.NumberFormatOptions
    dtfs.register(new IntegerFormatter());    // options?: Intl.NumberFormatOptions
    dtfs.register(new DateFormatter());       // options?: Intl.DateTimeFormatOptions
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
}
export function registerDataTypeComparers(dtcs: DataTypeComparerService): void
{ 
}

export function registerDataTypeCheckGenerators(ag: AutoGenerateDataTypeCheckService): void
{
}


export function createTextLocalizerService(): ITextLocalizerService
{
    let service = new TextLocalizerService();

    return service;
    
}