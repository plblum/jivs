/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentConditionCollector and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import { FluentConditionCollector, FluentConditionCollectorHandler, FluentOneConditionCollector, FluentOneConditionCollectorHandler, finishFluentConditionCollector } from "../ValueHosts/Fluent";
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig,
    MaxDecimalsConditionConfig, NotEqualToValueConditionConfig, NotEqualToConditionConfig,
    NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, StringLengthConditionConfig
} from "./ConcreteConditions";
import { NotConditionConfig, } from "./NotCondition";
import { WhenConditionConfig,  } from "./WhenCondition";
import { ConditionType } from "./ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import { ConditionConfig } from "../Interfaces/Conditions";

// How TypeScript merges functions with the FluentConditionCollector class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentConditionCollector {
        conditionConfig(conditionConfig: ConditionConfig): FluentConditionCollector;
        dataTypeCheck(): FluentConditionCollector;
        requireText(
            conditionConfig?: FluentRequireTextConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        notNull(valueHostName?: ValueHostName): FluentConditionCollector;
        regExp(
            expression: RegExp | string, ignoreCase?: boolean | null,
            conditionConfig?: FluentRegExpConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        range(
            minimum: any, maximum: any,
            valueHostName?: ValueHostName): FluentConditionCollector;
        not(
            childBuilder: FluentOneConditionCollectorHandler): FluentOneConditionCollector;
        when(
            enablerBuilder: FluentOneConditionCollectorHandler,
            childBuilder: FluentOneConditionCollectorHandler): FluentOneConditionCollector;
        
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: FluentNotEqualToValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        notEqualTo(
            secondValueHostName: string,
            conditionConfig?: FluentNotEqualToConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lessThanValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;

        stringLength(
            maximum: number | null,
            conditionConfig?: FluentStringLengthConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        all(
            conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector;
        any(
            conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector;
        countMatches(
            minimum: number | null, maximum: number | null,
            conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector;
        
        positive(
            valueHostName?: ValueHostName): FluentConditionCollector;
        integer(
            valueHostName?: ValueHostName): FluentConditionCollector;
        maxDecimals(maxDecimals: number,
            valueHostName?: ValueHostName): FluentConditionCollector;        

        //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lteValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        gtValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        gteValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionCollector;
        //#endregion shorter names for some        

    }
}

/**
 * Initialization code that is called by enableFluent(), but safe to call repeatedly.
 * @remarks
 * Inside of a function to allow apps that don't use these fluent classes
 * to avoid any time setting up something not used.
 */
export function enableFluentConditions(): void {
    if (typeof FluentConditionCollector.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the FluentConditionCollector class
    FluentConditionCollector.prototype.conditionConfig = conditionConfig;
    FluentConditionCollector.prototype.dataTypeCheck = dataTypeCheck;
    FluentConditionCollector.prototype.requireText = requireText;
    FluentConditionCollector.prototype.notNull = notNull;
    FluentConditionCollector.prototype.regExp = regExp;
    FluentConditionCollector.prototype.range = range;
    FluentConditionCollector.prototype.not = not;
    FluentConditionCollector.prototype.when = when;
    FluentConditionCollector.prototype.equalToValue = equalToValue;
    FluentConditionCollector.prototype.equalTo = equalTo;
    FluentConditionCollector.prototype.notEqualToValue = notEqualToValue;
    FluentConditionCollector.prototype.notEqualTo = notEqualTo;
    FluentConditionCollector.prototype.lessThanValue = lessThanValue;
    FluentConditionCollector.prototype.lessThan = lessThan;
    FluentConditionCollector.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
    FluentConditionCollector.prototype.lessThanOrEqual = lessThanOrEqual;
    FluentConditionCollector.prototype.greaterThanValue = greaterThanValue;
    FluentConditionCollector.prototype.greaterThan = greaterThan;
    FluentConditionCollector.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
    FluentConditionCollector.prototype.greaterThanOrEqual = greaterThanOrEqual;
    FluentConditionCollector.prototype.stringLength = stringLength;
    FluentConditionCollector.prototype.all = all;
    FluentConditionCollector.prototype.any = any;
    FluentConditionCollector.prototype.countMatches = countMatches;
    FluentConditionCollector.prototype.positive = positive;
    FluentConditionCollector.prototype.integer = integer;
    FluentConditionCollector.prototype.maxDecimals = maxDecimals;


    //#region shorter names for some
    FluentConditionCollector.prototype.ltValue = lessThanValue;
    FluentConditionCollector.prototype.lt = lessThan;
    FluentConditionCollector.prototype.lteValue = lessThanOrEqualValue;
    FluentConditionCollector.prototype.lte = lessThanOrEqual;
    FluentConditionCollector.prototype.gtValue = greaterThanValue;
    FluentConditionCollector.prototype.gt = greaterThan;
    FluentConditionCollector.prototype.gteValue = greaterThanOrEqualValue;
    FluentConditionCollector.prototype.gte = greaterThanOrEqual;
    //#endregion shorter names for some
}

// --- Actual fluent functions -------

/**
 * Adds a condition to the collector based on a ConditionConfig.
 * @param conditionConfig 
 * @returns 
 */
function conditionConfig(conditionConfig: ConditionConfig): FluentConditionCollector {
    assertNotNull(conditionConfig, 'conditionConfig');
    assertNotNull(conditionConfig.conditionType, 'conditionConfig.conditionType');
    return finishFluentConditionCollector(this, conditionConfig.conditionType, conditionConfig);
}

/**
 * Common code to setup DataTypeCheckConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDDataTypeCheck(): DataTypeCheckConditionConfig {
    return {} as DataTypeCheckConditionConfig;
}

function dataTypeCheck(): FluentConditionCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty    
    return finishFluentConditionCollector(this, ConditionType.DataTypeCheck, _genCDDataTypeCheck());
}


export type FluentRequireTextConditionConfig = Partial<Omit<RequireTextConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category'>>;
/**
 * Common code to setup RequireTextConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCRequireText(
    conditionConfig?: FluentRequireTextConditionConfig | null): RequireTextConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as RequireTextConditionConfig;
    return condConfig;
}
function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig), valueHostName);
}

/**
 * Common code to setup NotNullConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotNull(): NotNullConditionConfig {
    return {} as NotNullConditionConfig;
}

function notNull(valueHostName?: ValueHostName): FluentConditionCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        

    return finishFluentConditionCollector(this,
        ConditionType.NotNull, _genDCNotNull(), valueHostName);
}

export type FluentRegExpConditionConfig = Partial<Omit<RegExpConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;
/**
 * Common code to setup RegExpConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDRegExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: FluentRegExpConditionConfig | null): RegExpConditionConfig {
    let condConfig: RegExpConditionConfig = (conditionConfig ? { ...conditionConfig } : {}) as RegExpConditionConfig;
    if (expression != null)
        if (expression instanceof RegExp)
            condConfig.expression = expression;
        else
            condConfig.expressionAsString = expression;
    if (ignoreCase != null)
        condConfig.ignoreCase = ignoreCase;
    return condConfig as RegExpConditionConfig;
}

function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: FluentRegExpConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
        valueHostName);
}

/**
 * Common code to setup RangeConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDRange(
    minimum: any, maximum: any): RangeConditionConfig {
    let condConfig = {} as RangeConditionConfig;
    if (minimum != null)
        condConfig.minimum = minimum;
    if (maximum != null)
        condConfig.maximum = maximum;
    return condConfig;
}

function range(
    minimum: any, maximum: any,
    valueHostName?: ValueHostName): FluentConditionCollector {
    // no ConditionConfig parameter because without conditionType, valueHostName, minimum, and maximum, it will always be empty    

    return finishFluentConditionCollector(this,
        ConditionType.Range, _genCDRange(minimum, maximum), valueHostName);
}

export type FluentEqualToValueConditionConfig = Partial<Omit<EqualToValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;


/**
 * Common code to setup EqualToValueConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCEqualToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null): EqualToValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.EqualToValue, _genDCEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentEqualToConditionConfig = Partial<Omit<EqualToConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;
/**
 * Common code to setup EqualToConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null): EqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentNotEqualToValueConditionConfig = Partial<Omit<NotEqualToValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null): NotEqualToValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
function notEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.NotEqualToValue, _genDCNotEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentNotEqualToConditionConfig = Partial<Omit<NotEqualToConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentNotEqualToConditionConfig | null): NotEqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentNotEqualToConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentLessThanValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null): LessThanValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanValue, _genDCLessThanValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanConditionConfig | null): LessThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

function lessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentLessThanOrEqualValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanOrEqualValueConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null): LessThanOrEqualValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanOrEqualValue, _genDCLessThanOrEqualValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanOrEqualConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanOrEqualConditionConfig | null): LessThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig), valueHostName);
}
export type FluentGreaterThanValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue' >>;
export type FluentGreaterThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;
export type FluentGreaterThanOrEqualValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue' >>;
export type FluentGreaterThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup GreaterThanValueConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null): GreaterThanValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function greaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanValue, _genDCGreaterThanValue(secondValue, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanConditionConfig | null): GreaterThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

function greaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanOrEqualValueConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null): GreaterThanOrEqualValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualValueConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanOrEqualValue, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanOrEqualConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null): GreaterThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualConditionConfig;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentStringLengthConditionConfig = Partial<Omit<StringLengthConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'maximum'>>;
/**
 * Common code to setup StringLengthConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCStringLength(
    maximum: number | null,
    conditionConfig?: FluentStringLengthConditionConfig | null): StringLengthConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as StringLengthConditionConfig;
    if (maximum != null)
        condConfig.maximum = maximum;
    return condConfig;
}

function stringLength(
    maximum: number | null,
    conditionConfig?: FluentStringLengthConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    // no ConditionConfig parameter because without conditionType, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentConditionCollector(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig), valueHostName);
}
/**
 * Common code to setup AllMatchConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAll(
    conditionsBuilder: FluentConditionCollectorHandler): AllMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    
    let fluent = new FluentConditionCollector(null);
    conditionsBuilder(fluent);
    let conditionConfigs = fluent.parentConfig.conditionConfigs;
    return { conditionConfigs: conditionConfigs } as AllMatchConditionConfig;
}
function all(
    conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.All, _genDCAll(conditionsBuilder));
}
/**
 * Common code to setup AnyMatchConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAny(
    conditionsBuilder: FluentConditionCollectorHandler): AnyMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    
    let fluent = new FluentConditionCollector(null);
    conditionsBuilder(fluent);
    let conditionConfigs = fluent.parentConfig.conditionConfigs;
    return { conditionConfigs: conditionConfigs } as AnyMatchConditionConfig;
}
function any(
    conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.Any,  _genDCAny(conditionsBuilder));
}

/**
 * Common code to setup CountMatchesConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCCountMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionCollectorHandler): CountMatchesConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    
    let fluent = new FluentConditionCollector(null);
    conditionsBuilder(fluent);
    let conditionConfigs = fluent.parentConfig.conditionConfigs;

    let condConfig: CountMatchesConditionConfig =
        { conditionConfigs: conditionConfigs } as CountMatchesConditionConfig;
    if (minimum !== null)
        condConfig.minimum = minimum;
    if (maximum !== null)
        condConfig.maximum = maximum;
    return condConfig;
}
function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionCollectorHandler): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, conditionsBuilder));
}

/**
 * Common code to setup PositiveConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCPositive(): PositiveConditionConfig {
    return {} as PositiveConditionConfig;
}
function positive(
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.Positive, _genDCPositive(), valueHostName);
}

/**
 * Common code to setup IntegerConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCInteger(): IntegerConditionConfig {
    return {} as IntegerConditionConfig;
}
function integer(
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.Integer, _genDCInteger(), valueHostName);
}

/**
 * Common code to setup MaxDecimalsConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCMaxDecimals(maxDecimals: number): MaxDecimalsConditionConfig {
    return { maxDecimals: maxDecimals } as MaxDecimalsConditionConfig;
}
function maxDecimals(maxDecimals: number,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.MaxDecimals, _genDCMaxDecimals(maxDecimals), valueHostName);
}

/**
 * Common code to setup NotConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNot(
    childBuilder: FluentOneConditionCollectorHandler): NotConditionConfig {
    assertNotNull(childBuilder, 'childBuilder');
    assertFunction(childBuilder);
    
    let fluent = new FluentOneConditionCollector(null);
    childBuilder(fluent);
    let conditionConfig = fluent.parentConfig.conditionConfigs[0] ?? {};
    return { childConditionConfig: conditionConfig } as NotConditionConfig;
}
function not(
    childBuilder: FluentOneConditionCollectorHandler): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.Not, _genDCNot(childBuilder));
}

/**
 * Common code to setup WhenConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCWhen(
    enablerBuilder: FluentOneConditionCollectorHandler,
    childBuilder: FluentOneConditionCollectorHandler): WhenConditionConfig {
    assertNotNull(enablerBuilder, 'enablerBuilder');
    assertFunction(enablerBuilder);
    assertNotNull(childBuilder, 'childBuilder');
    assertFunction(childBuilder);

    let fluentEnabler = new FluentOneConditionCollector(null);
    enablerBuilder(fluentEnabler);
    let enablerConditionConfig = fluentEnabler.parentConfig.conditionConfigs[0] ?? {};

    let fluent = new FluentOneConditionCollector(null);
    childBuilder(fluent);
    let conditionConfig = fluent.parentConfig.conditionConfigs[0] ?? {};
    return { enablerConfig: enablerConditionConfig, childConditionConfig: conditionConfig } as WhenConditionConfig;
}
function when(
    enablerBuilder: FluentOneConditionCollectorHandler,
    childBuilder: FluentOneConditionCollectorHandler): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.When, _genDCWhen(enablerBuilder, childBuilder));
}