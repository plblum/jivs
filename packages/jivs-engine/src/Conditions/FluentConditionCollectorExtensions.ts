/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentConditionCollector and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import { FluentConditionCollector, finishFluentConditionCollector } from "../ValueHosts/Fluent";
import { AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig, EqualToConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig, LessThanConditionConfig, LessThanOrEqualConditionConfig, NotEqualToConditionConfig, NotNullConditionConfig, RangeConditionConfig, RegExpConditionConfig, RequireTextConditionConfig, StringLengthConditionConfig } from "./ConcreteConditions";
import { ConditionType } from "./ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { assertNotNull } from "../Utilities/ErrorHandling";

// How TypeScript merges functions with the FluentConditionCollector class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentConditionCollector {
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
            collector: FluentConditionCollector): FluentConditionCollector;
        any(
            collector: FluentConditionCollector): FluentConditionCollector;
        countMatches(
            minimum: number | null, maximum: number | null,
            collector: FluentConditionCollector): FluentConditionCollector;


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
    FluentConditionCollector.prototype.dataTypeCheck = dataTypeCheck;
    FluentConditionCollector.prototype.requireText = requireText;
    FluentConditionCollector.prototype.notNull = notNull;
    FluentConditionCollector.prototype.regExp = regExp;
    FluentConditionCollector.prototype.range = range;
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
 * Common code to setup DataTypeCheckConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDDataTypeCheck(): DataTypeCheckConditionConfig {
    return {} as DataTypeCheckConditionConfig;
}

function dataTypeCheck(): FluentConditionCollector {
    // no ConditionConfig parameter because without type and valueHostName, it will always be empty    
    return finishFluentConditionCollector(this, ConditionType.DataTypeCheck, _genCDDataTypeCheck());
}


export type FluentRequireTextConditionConfig = Partial<Omit<RequireTextConditionConfig, 'type' /* | 'valueHostName'*/ | 'category'>>;
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
    // no ConditionConfig parameter because without type and valueHostName, it will always be empty        

    return finishFluentConditionCollector(this,
        ConditionType.NotNull, _genDCNotNull(), valueHostName);
}

export type FluentRegExpConditionConfig = Partial<Omit<RegExpConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;
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
    // no ConditionConfig parameter because without type, valueHostName, minimum, and maximum, it will always be empty    

    return finishFluentConditionCollector(this,
        ConditionType.Range, _genCDRange(minimum, maximum), valueHostName);
}
export type FluentEqualToValueConditionConfig = Partial<Omit<EqualToConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;
/**
 * Common code to setup EqualToConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCEqualToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null): EqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.EqualTo, _genDCEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentEqualToConditionConfig = Partial<Omit<EqualToConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;
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

export type FluentNotEqualToValueConditionConfig = Partial<Omit<NotEqualToConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null): NotEqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
function notEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.NotEqualTo, _genDCNotEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentNotEqualToConditionConfig = Partial<Omit<NotEqualToConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

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

export type FluentLessThanValueConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null): LessThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThan, _genDCLessThanValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

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

export type FluentLessThanOrEqualValueConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanOrEqualConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null): LessThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqualValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

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
export type FluentGreaterThanValueConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;
export type FluentGreaterThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;
export type FluentGreaterThanOrEqualValueConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;
export type FluentGreaterThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'secondValue' | 'secondValueHostName'>>;

/**
 * Common code to setup GreaterThanConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null): GreaterThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function greaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThanValue(secondValue, conditionConfig), valueHostName);
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
 * Common code to setup GreaterThanOrEqualConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null): GreaterThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualConditionConfig;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig), valueHostName);
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

export type FluentStringLengthConditionConfig = Partial<Omit<StringLengthConditionConfig, 'type' /* | 'valueHostName'*/ | 'category' | 'maximum'>>;
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
    // no ConditionConfig parameter because without type, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentConditionCollector(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig), valueHostName);
}
/**
 * Common code to setup AllMatchConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAll(
    collector: FluentConditionCollector): AllMatchConditionConfig {
    assertNotNull(collector, 'collector');
    assertNotNull(collector.parentConfig, 'collector.parentConfig');    
    return { conditionConfigs: collector.parentConfig.conditionConfigs } as AllMatchConditionConfig;
}
function all(
    collector: FluentConditionCollector): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.All, _genDCAll(collector));
}
/**
 * Common code to setup AnyMatchConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAny(
    collector: FluentConditionCollector): AnyMatchConditionConfig {
    assertNotNull(collector, 'collector');
    assertNotNull(collector.parentConfig, 'collector.parentConfig');
    return { conditionConfigs: collector.parentConfig.conditionConfigs } as AnyMatchConditionConfig;
}
function any(
    collector: FluentConditionCollector): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.Any,  _genDCAny(collector));
}

/**
 * Common code to setup CountMatchesConditionConfig for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCCountMatches(
    minimum: number | null,
    maximum: number | null,
    collector: FluentConditionCollector): CountMatchesConditionConfig {
    assertNotNull(collector, 'collector');
    assertNotNull(collector.parentConfig, 'collector.parentConfig');    
    let condConfig: CountMatchesConditionConfig =
        { conditionConfigs: collector.parentConfig.conditionConfigs } as CountMatchesConditionConfig;
    if (minimum !== null)
        condConfig.minimum = minimum;
    if (maximum !== null)
        condConfig.maximum = maximum;
    return condConfig;
}
function countMatches(
    minimum: number | null,
    maximum: number | null,
    collector: FluentConditionCollector): FluentConditionCollector {
    return finishFluentConditionCollector(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, collector));
}

