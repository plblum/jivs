
/**
 * When creating conditions without a validator, there are two fluent steps.
 * 1. Use FluentFieldConditionBuilders to define the source field for the value
 * assigned to valueHostName of the condition.
 * 2. Use FluentConditionBuilder to create the ConditionConfig specific to that condition.
 * 
 * FluentConditionBuilder is not intended to be chained to start another condition.
 * Expect one condition definition, terminated. 
 * 
 * So none of this:
 * parentBuilder.fieldValue('fieldName').requireText().regExp('pattern');
 * 
 * Just this:
 * parentBuilder.fieldValue('fieldName').requireText();
 * ParentBuilder.fieldValue('fieldName').regExp('pattern');
 * 
 * The reason is that these are always contained within a parent condition that supports children.
 * - AnyCondition, AllCondition, and CountMatchesCondition simply expect an array of single conditions.
 * - WhenCondition is evaluating a single condition in its whenToEnableCondition and thenCondition.
 * - NotCondition is evaluating a single condition in its childCondition.
 * If they happen to need complex logic for a child, they can use a child like any, all and countMatches themselves.
 * 
 * This builder's only task is to create a ConditionConfig for a single condition, and then 
 * return to the parent builder to continue building the parent condition.
 * The parent builder must be supplied into the constructor of the FluentConditionBuilder. 
 * It has a single method, attachConfig(), that the child condition builder calls to attach the child condition to the parent condition.
 * 
 * Most conditions will use a common pattern, where attachConfig simply assigns itself to a placeholder.
 * AllCondition, AnyCondition, and CountMatchesCondition still do that, despite having an array of child conditionconfigs
 * because its returning AllConditionConfig, AnyConditionConfig, and CountMatchesConditionConfig.
 * 
 * However, whenCondition and NotCondition are a bit different. 
 * WhenCondition has two child conditions, the whenToEnableCondition and the thenCondition.
 * It will have separate builders for each, knowing which one is being built, and will assign the child condition to the correct property.
 * NotCondition has a single child condition, assigned to childConditionConfig property, which is a different
 * destination than the default attachConfig() function.
 * 
 * See @link Builder/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentConditionBuilder, FluentConditionBuilderHandler, FluentOneConditionBuilder,
    FluentOneConditionBuilderHandler, finishFluentConditionBuilder,
    FluentSingleFieldConditionBuilderHandler, FluentMultiFieldConditionBuilderHandler
} from "./Fluent";
import { FluentSingleFieldConditionBuilder, FluentMultiFieldConditionBuilder } from "./FluentFieldConditionBuilder";
import {
    AllMatchConditionConfig, AnyMatchConditionConfig, CountMatchesConditionConfig, DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig, GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig, IntegerConditionConfig, LessThanConditionConfig,
    LessThanOrEqualConditionConfig, LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig,
    MaxDecimalsConditionConfig, NotEqualToValueConditionConfig, NotEqualToConditionConfig,
    NotNullConditionConfig, PositiveConditionConfig, RangeConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, StringLengthConditionConfig
} from "../Conditions/ConcreteConditions";
import { NotConditionConfig, } from "../Conditions/NotCondition";
import { WhenConditionConfig,  } from "../Conditions/WhenCondition";
import { ConditionType } from "../Conditions/ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { assertFunction, assertNotNull } from "../Utilities/ErrorHandling";
import { ConditionConfig } from "../Interfaces/Conditions";
import { EvaluateChildConditionResultsBaseConfig } from "../Conditions/EvaluateChildConditionResultsBase";

// How TypeScript merges functions with the FluentConditionBuilder class
declare module "./../Builder/Fluent"
{
    // REMINDER: Conditions do not support chaining of fluent functions,
    // and is expected to return void.
    export interface FluentConditionBuilder {
        conditionConfig(conditionConfig: ConditionConfig): FluentConditionBuilder;
        dataTypeCheck(): FluentConditionBuilder;
        requireText(
            conditionConfig?: FluentRequireTextConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        notNull(valueHostName?: ValueHostName): FluentConditionBuilder;
        regExp(
            expression: RegExp | string, ignoreCase?: boolean | null,
            conditionConfig?: FluentRegExpConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        range(
            minimum: any, maximum: any,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        not(
            childBuilder: FluentSingleFieldConditionBuilderHandler): FluentOneConditionBuilder;
        when(
            enablerBuilder: FluentSingleFieldConditionBuilderHandler,
            childBuilder: FluentSingleFieldConditionBuilderHandler): FluentOneConditionBuilder;
        
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: FluentNotEqualToValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        notEqualTo(
            secondValueHostName: string,
            conditionConfig?: FluentNotEqualToConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lessThanValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;

        stringLength(
            maximum: number | null,
            conditionConfig?: FluentStringLengthConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        all(
            conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder;
        any(
            conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder;
        countMatches(
            minimum: number | null, maximum: number | null,
            conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder;
        
        positive(
            valueHostName?: ValueHostName): FluentConditionBuilder;
        integer(
            valueHostName?: ValueHostName): FluentConditionBuilder;
        maxDecimals(maxDecimals: number,
            valueHostName?: ValueHostName): FluentConditionBuilder;        

        //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lteValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        gtValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        gteValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            valueHostName?: ValueHostName): FluentConditionBuilder;
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
    if (typeof FluentConditionBuilder.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the FluentConditionBuilder class
    FluentConditionBuilder.prototype.conditionConfig = conditionConfig;
    FluentConditionBuilder.prototype.dataTypeCheck = dataTypeCheck;
    FluentConditionBuilder.prototype.requireText = requireText;
    FluentConditionBuilder.prototype.notNull = notNull;
    FluentConditionBuilder.prototype.regExp = regExp;
    FluentConditionBuilder.prototype.range = range;
    FluentConditionBuilder.prototype.not = not;
    FluentConditionBuilder.prototype.when = when;
    FluentConditionBuilder.prototype.equalToValue = equalToValue;
    FluentConditionBuilder.prototype.equalTo = equalTo;
    FluentConditionBuilder.prototype.notEqualToValue = notEqualToValue;
    FluentConditionBuilder.prototype.notEqualTo = notEqualTo;
    FluentConditionBuilder.prototype.lessThanValue = lessThanValue;
    FluentConditionBuilder.prototype.lessThan = lessThan;
    FluentConditionBuilder.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
    FluentConditionBuilder.prototype.lessThanOrEqual = lessThanOrEqual;
    FluentConditionBuilder.prototype.greaterThanValue = greaterThanValue;
    FluentConditionBuilder.prototype.greaterThan = greaterThan;
    FluentConditionBuilder.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
    FluentConditionBuilder.prototype.greaterThanOrEqual = greaterThanOrEqual;
    FluentConditionBuilder.prototype.stringLength = stringLength;
    FluentConditionBuilder.prototype.all = all;
    FluentConditionBuilder.prototype.any = any;
    FluentConditionBuilder.prototype.countMatches = countMatches;
    FluentConditionBuilder.prototype.positive = positive;
    FluentConditionBuilder.prototype.integer = integer;
    FluentConditionBuilder.prototype.maxDecimals = maxDecimals;


    //#region shorter names for some
    FluentConditionBuilder.prototype.ltValue = lessThanValue;
    FluentConditionBuilder.prototype.lt = lessThan;
    FluentConditionBuilder.prototype.lteValue = lessThanOrEqualValue;
    FluentConditionBuilder.prototype.lte = lessThanOrEqual;
    FluentConditionBuilder.prototype.gtValue = greaterThanValue;
    FluentConditionBuilder.prototype.gt = greaterThan;
    FluentConditionBuilder.prototype.gteValue = greaterThanOrEqualValue;
    FluentConditionBuilder.prototype.gte = greaterThanOrEqual;
    //#endregion shorter names for some
}

// --- Actual fluent functions -------

/**
 * Adds a condition to the builder based on a ConditionConfig.
 * @param conditionConfig 
 * @returns 
 */
function conditionConfig(conditionConfig: ConditionConfig): FluentConditionBuilder {
    assertNotNull(conditionConfig, 'conditionConfig');
    assertNotNull(conditionConfig.conditionType, 'conditionConfig.conditionType');
    return finishFluentConditionBuilder(this, conditionConfig.conditionType, conditionConfig);
}

/**
 * Common code to setup DataTypeCheckConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genCDDataTypeCheck(): DataTypeCheckConditionConfig {
    return {} as DataTypeCheckConditionConfig;
}

function dataTypeCheck(): FluentConditionBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty    
    return finishFluentConditionBuilder(this, ConditionType.DataTypeCheck, _genCDDataTypeCheck());
}


export type FluentRequireTextConditionConfig = Partial<Omit<RequireTextConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category'>>;
/**
 * Common code to setup RequireTextConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCRequireText(
    conditionConfig?: FluentRequireTextConditionConfig | null): RequireTextConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as RequireTextConditionConfig;
    return condConfig;
}
function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null,
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig), valueHostName);
}

/**
 * Common code to setup NotNullConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCNotNull(): NotNullConditionConfig {
    return {} as NotNullConditionConfig;
}

function notNull(valueHostName?: ValueHostName): FluentConditionBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        

    return finishFluentConditionBuilder(this,
        ConditionType.NotNull, _genDCNotNull(), valueHostName);
}

export type FluentRegExpConditionConfig = Partial<Omit<RegExpConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;
/**
 * Common code to setup RegExpConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
        valueHostName);
}

/**
 * Common code to setup RangeConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    // no ConditionConfig parameter because without conditionType, valueHostName, minimum, and maximum, it will always be empty    

    return finishFluentConditionBuilder(this,
        ConditionType.Range, _genCDRange(minimum, maximum), valueHostName);
}

export type FluentEqualToValueConditionConfig = Partial<Omit<EqualToValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;


/**
 * Common code to setup EqualToValueConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.EqualToValue, _genDCEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentEqualToConditionConfig = Partial<Omit<EqualToConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;
/**
 * Common code to setup EqualToConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentNotEqualToValueConditionConfig = Partial<Omit<NotEqualToValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.NotEqualToValue, _genDCNotEqualToValue(secondValue, conditionConfig), valueHostName);
}

export type FluentNotEqualToConditionConfig = Partial<Omit<NotEqualToConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentLessThanValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.LessThanValue, _genDCLessThanValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentLessThanOrEqualValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanOrEqualValueConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.LessThanOrEqualValue, _genDCLessThanOrEqualValue(secondValue, conditionConfig), valueHostName);
}

export type FluentLessThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanOrEqualConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig), valueHostName);
}
export type FluentGreaterThanValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue' >>;
export type FluentGreaterThanConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;
export type FluentGreaterThanOrEqualValueConditionConfig = Partial<Omit<LessThanValueConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValue' >>;
export type FluentGreaterThanOrEqualConditionConfig = Partial<Omit<LessThanConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup GreaterThanValueConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.GreaterThanValue, _genDCGreaterThanValue(secondValue, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanOrEqualValueConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.GreaterThanOrEqualValue, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig), valueHostName);
}

/**
 * Common code to setup GreaterThanOrEqualConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig), valueHostName);
}

export type FluentStringLengthConditionConfig = Partial<Omit<StringLengthConditionConfig, 'conditionType' /* | 'valueHostName'*/ | 'category' | 'maximum'>>;
/**
 * Common code to setup StringLengthConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
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
    valueHostName?: ValueHostName): FluentConditionBuilder {
    // no ConditionConfig parameter because without conditionType, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentConditionBuilder(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig), valueHostName);
}

/**
 * For any consumer of EvaluateChildConditionResultsBaseConfig,
 * this function will return the child configs from a FluentMultiFieldConditionBuilderHandler.
 * @param conditionsBuilder 
 * @returns 
 */
function getChildConfigs<T extends EvaluateChildConditionResultsBaseConfig>(
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler,
    conditionType: ConditionType): T {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    let fluentBuilder = new FluentMultiFieldConditionBuilder(null);
    // expect an array of FluentConditionBuilders, each with its own list of ConditionConfigs, 
    // to be returned from the conditionsBuilder function
    let childFluentBuilders = conditionsBuilder(fluentBuilder);
    let conditionConfigs: Array<ConditionConfig> = [];
    for (let childFluentBuilder of childFluentBuilders) {
        for (let childConfig of childFluentBuilder.parentConfig.conditionConfigs) {
            conditionConfigs.push(childConfig);
        }
    }
    return {
        conditionType: conditionType,
        conditionConfigs: conditionConfigs
    } as T;
}
/**
 * Common code to setup AllMatchConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCAll(
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): AllMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);

    return getChildConfigs<AllMatchConditionConfig>(conditionsBuilder, ConditionType.All);
}
function all(
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.All, _genDCAll(conditionsBuilder));
}
/**
 * Common code to setup AnyMatchConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCAny(
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): AnyMatchConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    return getChildConfigs<AnyMatchConditionConfig>(conditionsBuilder, ConditionType.Any);
}
function any(
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.Any,  _genDCAny(conditionsBuilder));
}

/**
 * Common code to setup CountMatchesConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCCountMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): CountMatchesConditionConfig {
    assertNotNull(conditionsBuilder, 'conditionsBuilder');
    assertFunction(conditionsBuilder);
    let condConfig = getChildConfigs<CountMatchesConditionConfig>(conditionsBuilder, ConditionType.CountMatches);
    if (minimum !== null)
        condConfig.minimum = minimum;
    if (maximum !== null)
        condConfig.maximum = maximum;    
    return condConfig;    
}
function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentMultiFieldConditionBuilderHandler): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, conditionsBuilder));
}

/**
 * Common code to setup PositiveConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCPositive(): PositiveConditionConfig {
    return {} as PositiveConditionConfig;
}
function positive(
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.Positive, _genDCPositive(), valueHostName);
}

/**
 * Common code to setup IntegerConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCInteger(): IntegerConditionConfig {
    return {} as IntegerConditionConfig;
}
function integer(
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.Integer, _genDCInteger(), valueHostName);
}

/**
 * Common code to setup MaxDecimalsConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCMaxDecimals(maxDecimals: number): MaxDecimalsConditionConfig {
    return { maxDecimals: maxDecimals } as MaxDecimalsConditionConfig;
}
function maxDecimals(maxDecimals: number,
    valueHostName?: ValueHostName): FluentConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.MaxDecimals, _genDCMaxDecimals(maxDecimals), valueHostName);
}

/**
 * Common code to setup NotConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCNot(
    childBuilder: FluentSingleFieldConditionBuilderHandler): NotConditionConfig {
    assertNotNull(childBuilder, 'childBuilder');
    assertFunction(childBuilder);
    
    let fluentNot = new FluentSingleFieldConditionBuilder(null);
    let fluentChild = childBuilder(fluentNot);
    let conditionConfig = fluentChild.parentConfig.conditionConfigs[0] ?? {};
    return {
        conditionType: ConditionType.Not,
        childConditionConfig: conditionConfig
     } as NotConditionConfig;
}
function not(
    childBuilder: FluentSingleFieldConditionBuilderHandler): FluentOneConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.Not, _genDCNot(childBuilder));
}

/**
 * Common code to setup WhenConditionConfig for support within
 * FluentValidatorBuilder and FluentConditionBuilder fluent functions.
 * @internal
 */
export function _genDCWhen(
    whenBuilder: FluentSingleFieldConditionBuilderHandler,
    thenBuilder: FluentSingleFieldConditionBuilderHandler): WhenConditionConfig {
    assertNotNull(whenBuilder, 'whenBuilder');
    assertFunction(whenBuilder);
    assertNotNull(thenBuilder, 'thenBuilder');
    assertFunction(thenBuilder);

    let fluentWhen = new FluentSingleFieldConditionBuilder(null);
    let whenCondBuilder = whenBuilder(fluentWhen);
    let enablerConditionConfig = whenCondBuilder.parentConfig.conditionConfigs[0] ?? {};

    let fluentThen = new FluentSingleFieldConditionBuilder(null);
    let thenCondBuilder = thenBuilder(fluentThen);
    let conditionConfig = thenCondBuilder.parentConfig.conditionConfigs[0] ?? {};
    return {
        conditionType: ConditionType.When,
        whenToEnableConfig: enablerConditionConfig,
        thenConfig: conditionConfig
    } as WhenConditionConfig;
}
function when(
    whenBuilder: FluentSingleFieldConditionBuilderHandler,
    thenBuilder: FluentSingleFieldConditionBuilderHandler): FluentOneConditionBuilder {
    return finishFluentConditionBuilder(this,
        ConditionType.When, _genDCWhen(whenBuilder, thenBuilder));
}