import {
    DataTypeCheckCondition, RequireTextCondition, RegExpCondition, RangeCondition, CompareToConditionConfig,
    EqualToCondition, StringLengthConditionConfig, StringLengthCondition, AllMatchCondition, AllMatchConditionConfig, AnyMatchCondition,
    AnyMatchConditionConfig, CountMatchesCondition, CountMatchesConditionConfig, GreaterThanCondition, GreaterThanOrEqualCondition, LessThanCondition,
    LessThanOrEqualCondition, NotEqualToCondition, NotNullCondition, NotNullConditionConfig, StringNotEmptyCondition, StringNotEmptyConditionConfig
} from "../../src/Conditions/ConcreteConditions";
import { ConditionFactory } from "../../src/Conditions/ConditionFactory";
import { ConditionType } from "../../src/Conditions/ConditionTypes";
import {
    StringFormatter, NumberFormatter, IntegerFormatter, DateFormatter, AbbrevDOWDateFormatter, AbbrevDateFormatter,
    BooleanFormatter, CapitalizeStringFormatter, CurrencyFormatter, DateTimeFormatter, LongDOWDateFormatter, LongDateFormatter,
    LowercaseStringFormatter, Percentage100Formatter, PercentageFormatter, TimeofDayFormatter, TimeofDayHMSFormatter, UppercaseStringFormatter
} from "../../src/DataTypes/DataTypeFormatters";
import { LoggingLevel } from "../../src/Interfaces/LoggerService";
import { AutoGenerateDataTypeCheckService } from "../../src/Services/AutoGenerateDataTypeCheckService";
import { ConsoleLoggerService } from "../../src/Services/ConsoleLoggerService";
import { DataTypeComparerService } from "../../src/Services/DataTypeComparerService";
import { DataTypeConverterService } from "../../src/Services/DataTypeConverterService";
import { DataTypeFormatterService } from "../../src/Services/DataTypeFormatterService";
import { DataTypeIdentifierService } from "../../src/Services/DataTypeIdentifierService";
import { MessageTokenResolverService } from "../../src/Services/MessageTokenResolverService";
import { TextLocalizerService } from "../../src/Services/TextLocalizerService";
import { ValidationServices } from "../../src/Services/ValidationServices";
import { DataTypeCheckConditionConfig, RequireTextConditionConfig, RegExpConditionConfig, RangeConditionConfig } from "../../src/Conditions/ConcreteConditions";
import { CultureIdFallback } from "../../src/Interfaces/DataTypeFormatterService";
import { ITextLocalizerService } from "../../src/Interfaces/TextLocalizerService";
import { LookupKey } from "../../src/DataTypes/LookupKeys";
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
    cf.register<DataTypeCheckConditionConfig>(
        ConditionType.DataTypeCheck, (config) => new DataTypeCheckCondition(config));
    cf.register<RequireTextConditionConfig>(
        ConditionType.RequireText, (config) => new RequireTextCondition(config));
/*    
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
    // StringNotEmpty is similar to RequireText, but lacks evaluating as the user types
    cf.register<StringNotEmptyConditionConfig>(
        ConditionType.StringNotEmpty, (config) => new StringNotEmptyCondition(config));
    cf.register<NotNullConditionConfig>(
        ConditionType.NotNull, (config) => new NotNullCondition(config));
    // aliases for users who don't deal well with boolean logic can relate
    cf.register<AllMatchConditionConfig>
        (ConditionType.All, (config) => new AllMatchCondition(config));
    cf.register<AnyMatchConditionConfig>
        (ConditionType.Any, (config) => new AnyMatchCondition(config));
*/    
}
export function registerAllConditions(cf: ConditionFactory): void
{
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
    cf.register<StringNotEmptyConditionConfig>(
        ConditionType.StringNotEmpty, (config) => new StringNotEmptyCondition(config));
    cf.register<NotNullConditionConfig>(
        ConditionType.NotNull, (config) => new NotNullCondition(config));
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