
/**
 * Companion to the ConditionBuilders, where actual conditions are wired up
 * to the ConditionBuilder through javascript prototypes.
 * This allows the user to extend the available conditions.
 * 
 * When creating conditions without a validator, there are two fluent steps.
 * 1. Use StartConditionBuilder to define the source field for the value
 *      assigned to valueHostName of the condition. It provides parentValue()
 *      and fieldValue(valuehostname), along with several conditions that don't use valueHostNames:
 *      any, all, countMatches, not, and when.
 * 2. Use ConditionBuilder to create the ConditionConfig specific to that condition.
 *      Its job is to let condition specific methods create the ConditionConfig
 *      and pass it back to the parent builder through attachChildConfig().
 * 
 * Together they look like this:
 * ```ts
 * let builder = new StartConditionBuilder(parentBuilder);
 * builder.fieldValue('fieldName').requireText();
 * builder.parentValue().regExp('pattern');
 * ```
 * Each condition has its own Condition Generator function that creates the ConditionConfig, such as
 * _genDCRequireText(), _genCDRegExp(), _genDCEqualToValue(), etc. 
 * These are used by both the FluentValidatorBuilder and ConditionBuilder.
 * FluentValidatorBuilder merges the result with its ValidatorConfig object.
 * ConditionBuilder passes the result to its parent builder through attachChildConfig().
 * Condition Generator functions are declared in this file so long as they are included in Jivs.
 * In fact, the code here could have been placed with the actual condition class files,
 * but this was chosen because it is specific to the Builder syntax.
 * 
 * Each condition contributes to this file as follows:
 * 1. Provide one or more functions to the interface ConditionBuilder declaration.
 *    These represent the actual API for the condition. Each condition may provide
 *    required parameters to force the user to input them. If there are any optional 
 *    properties, form a type that is a Partial of the condition's ConditionConfig, and use it as an optional parameter.
 *      ```ts
        declare module "./../Builder/Fluent"
        {
            export interface ConditionBuilder {
                dataTypeCheck(): void;  // no required or optional
                requireText(    // just optional
                    conditionConfig?: OptionalRequireTextConditionParams): void;
                range(          // just required
                    minimum: any, maximum: any): void;
                equalToValue(   // required and optional
                    secondValue: any,
                    conditionConfig?: OptionalEqualToValueConditionParams): void;
            }
        }
 *      ```
 * 2. Create a Condition Generator function that creates the ConditionConfig for the condition.
 *    It should be named _genDC<ConditionName>.
 *      ```ts
        export function _genCDRange(
            minimum: any, maximum: any): RangeConditionConfig {
            let condConfig = {} as RangeConditionConfig;
            if (minimum != null)
                condConfig.minimum = minimum;
            if (maximum != null)
                condConfig.maximum = maximum;
            return condConfig;
        }
        ```
 * 3. Create an implementation of your interface functions that calls your Condition Generator,
        and then passes it to the parentBuilder, in 'this', as parentBuilder.applyChildConfig().
        Due to getting attached to the prototype of ConditionBuilder, 'this' is the parentBuilder.
        ```ts
        function range(
            minimum: any, maximum: any): void {
            let config = _genCDRange(minimum, maximum);
            this.setConfig(config);
        }
        ```        
 * 4. Wire up the ConditionBuilder prototype using your interface function names to your implementation functions.
        ```ts
        ConditionBuilder.prototype.range = range;
        ```
 * @module Builder/ConditionBuilder
 */

import {
    DataTypeCheckConditionConfig,
    EqualToConditionConfig, EqualToValueConditionConfig,
    GreaterThanConditionConfig, GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig, GreaterThanValueConditionConfig,
    LessThanConditionConfig, LessThanOrEqualConditionConfig,
    LessThanOrEqualValueConditionConfig, LessThanValueConditionConfig,
    PositiveConditionConfig, IntegerConditionConfig, MaxDecimalsConditionConfig,
    NotEqualToConditionConfig, NotEqualToValueConditionConfig,
    NotNullConditionConfig, RangeConditionConfig, RegExpConditionConfig,
    RequireTextConditionConfig, StringLengthConditionConfig
} from "../Conditions/ConcreteConditions";
import { ConditionType } from "../Conditions/ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { ConditionConfig } from "../Interfaces/Conditions";
import { ConditionBuilder } from "./ConditionBuilder_classes";

// How TypeScript merges functions with the ConditionBuilder class
declare module "./../Builder/ConditionBuilder_classes"
{
    // REMINDER: Conditions do not support chaining of fluent functions,
    // and is expected to return void.
    export interface ConditionBuilder {
//        conditionConfig(conditionConfig: ConditionConfig): void;
        dataTypeCheck(): void;
        requireText(
            conditionConfig?: OptionalRequireTextConditionParams): void;
        notNull(): void;
        regExp(
            expression: RegExp | string,
            ignoreCase?: boolean | null,
            conditionConfig?: OptionalRegExpConditionParams): void;
        range(
            minimum: any, maximum: any): void;
        
        equalToValue(
            secondValue: any,
            conditionConfig?: OptionalEqualToValueConditionParams): void;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalEqualToConditionParams): void;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: OptionalNotEqualToValueConditionParams): void;
        notEqualTo(
            secondValueHostName: string,
            conditionConfig?: OptionalNotEqualToConditionParams): void;
        lessThanValue(
            secondValue: any,
            conditionConfig?: OptionalLessThanValueConditionParams): void;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalLessThanConditionParams): void;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalLessThanOrEqualConditionParams): void;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: OptionalGreaterThanValueConditionParams): void;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalGreaterThanConditionParams): void;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;

        stringLength(
            maximum: number | null,
            conditionConfig?: OptionalStringLengthConditionParams): void;
        
        positive(): void;
        integer(): void;
        maxDecimals(maxDecimals: number): void;        
        
/* These may be moved to expose them to several builders via its own interface.
// if so, no prototype wiring is needed, we'll code their functions directly into the builders.
        not(
            childBuilder: NotConditionChildBuilderHandler): void;
        when(
            whenBuilder: WhenToEnableBuilderHandler,
            thenBuilder: ThenBuilderHandler): void;
        
        all(
            conditionsBuilder: ConditionBuilderHandler): void;
        any(
            conditionsBuilder: ConditionBuilderHandler): void;
        countMatches(
            minimum: number | null, maximum: number | null,
            conditionsBuilder: ConditionBuilderHandler): void;
*/

        //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: OptionalLessThanValueConditionParams): void;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalLessThanConditionParams): void;
        lteValue(
            secondValue: any,
            conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalLessThanOrEqualConditionParams): void;
        gtValue(
            secondValue: any,
            conditionConfig?: OptionalGreaterThanValueConditionParams): void;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalGreaterThanConditionParams): void;
        gteValue(
            secondValue: any,
            conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void;
        //#endregion shorter names for some        

    }
}

/**
 * Initialization code that is called by enableConditionBuilderExtensions(), but safe to call repeatedly.
 * @remarks
 * Inside of a function to allow apps that don't use these fluent classes
 * to avoid any time setting up something not used.
 */
export function enableConditionBuilderExtensions(): void {
    if (typeof ConditionBuilder.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the ConditionBuilder class
    ConditionBuilder.prototype.dataTypeCheck = dataTypeCheck;
    ConditionBuilder.prototype.requireText = requireText;
    ConditionBuilder.prototype.notNull = notNull;
    ConditionBuilder.prototype.regExp = regExp;
    ConditionBuilder.prototype.range = range;
    ConditionBuilder.prototype.equalToValue = equalToValue;
    ConditionBuilder.prototype.equalTo = equalTo;
    ConditionBuilder.prototype.notEqualToValue = notEqualToValue;
    ConditionBuilder.prototype.notEqualTo = notEqualTo;
    ConditionBuilder.prototype.lessThanValue = lessThanValue;
    ConditionBuilder.prototype.lessThan = lessThan;
    ConditionBuilder.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
    ConditionBuilder.prototype.lessThanOrEqual = lessThanOrEqual;
    ConditionBuilder.prototype.greaterThanValue = greaterThanValue;
    ConditionBuilder.prototype.greaterThan = greaterThan;
    ConditionBuilder.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
    ConditionBuilder.prototype.greaterThanOrEqual = greaterThanOrEqual;
    ConditionBuilder.prototype.stringLength = stringLength;
    ConditionBuilder.prototype.positive = positive;
    ConditionBuilder.prototype.integer = integer;
    ConditionBuilder.prototype.maxDecimals = maxDecimals;
/*    
    ConditionBuilder.prototype.conditionConfig = conditionConfig;
    ConditionBuilder.prototype.not = not;
    ConditionBuilder.prototype.when = when;
    ConditionBuilder.prototype.all = all;
    ConditionBuilder.prototype.any = any;
    ConditionBuilder.prototype.countMatches = countMatches;
*/

    //#region shorter names for some
    ConditionBuilder.prototype.ltValue = lessThanValue;
    ConditionBuilder.prototype.lt = lessThan;
    ConditionBuilder.prototype.lteValue = lessThanOrEqualValue;
    ConditionBuilder.prototype.lte = lessThanOrEqual;
    ConditionBuilder.prototype.gtValue = greaterThanValue;
    ConditionBuilder.prototype.gt = greaterThan;
    ConditionBuilder.prototype.gteValue = greaterThanOrEqualValue;
    ConditionBuilder.prototype.gte = greaterThanOrEqual;
    //#endregion shorter names for some
}

// --- Actual fluent functions -------

/**
 * Adds a fully realized condition config to the builder.
 * Requires conditionConfig.conditionType to be defined.
 * @param conditionConfig 
 * @returns 
 */
function conditionConfig(conditionConfig: ConditionConfig): void {
    this.setConfig(conditionConfig);
}

/**
 * Common code to setup DataTypeCheckConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genCDDataTypeCheck(): DataTypeCheckConditionConfig {
    return { conditionType: ConditionType.DataTypeCheck } as DataTypeCheckConditionConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function dataTypeCheck(): void {
    let config = _genCDDataTypeCheck();
    this.setConfig(config);
}


export type OptionalRequireTextConditionParams = Partial<Omit<RequireTextConditionConfig, 'conditionType' | 'valueHostName' | 'category'>>;
/**
 * Common code to setup RequireTextConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCRequireText(
    conditionConfig?: OptionalRequireTextConditionParams): RequireTextConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as RequireTextConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.RequireText;
    return condConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function requireText(conditionConfig?: OptionalRequireTextConditionParams): void {
    let config = _genDCRequireText(conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup NotNullConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCNotNull(): NotNullConditionConfig {
    return { conditionType: ConditionType.NotNull } as NotNullConditionConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function notNull(): void {
    let config = _genDCNotNull();
    this.setConfig(config);
}

export type OptionalRegExpConditionParams = Partial<Omit<RegExpConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'expressionAsString' | 'expression' | 'ignoreCase'>>;
/**
 * Common code to setup RegExpConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genCDRegExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: OptionalRegExpConditionParams): RegExpConditionConfig {
    let condConfig: RegExpConditionConfig = (conditionConfig ? { ...conditionConfig } : {}) as RegExpConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.RegExp;
    if (expression != null)
        if (expression instanceof RegExp)
            condConfig.expression = expression;
        else
            condConfig.expressionAsString = expression;
    if (ignoreCase != null)
        condConfig.ignoreCase = ignoreCase;
    return condConfig as RegExpConditionConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: OptionalRegExpConditionParams): void {
    let config = _genCDRegExp(expression, ignoreCase, conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup RangeConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genCDRange(
    minimum: any, maximum: any): RangeConditionConfig {
    let condConfig = { conditionType: ConditionType.Range } as RangeConditionConfig;
    if (minimum != null)
        condConfig.minimum = minimum;
    if (maximum != null)
        condConfig.maximum = maximum;
    return condConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function range(
    minimum: any, maximum: any,
    valueHostName?: ValueHostName): void {
    let config = _genCDRange(minimum, maximum);
    this.setConfig(config);
}

export type OptionalEqualToValueConditionParams = Partial<Omit<EqualToValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue'>>;


/**
 * Common code to setup EqualToValueConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCEqualToValue(
    secondValue: any,
    conditionConfig?: OptionalEqualToValueConditionParams): EqualToValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.EqualToValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function equalToValue(
    secondValue: any,
    conditionConfig?: OptionalEqualToValueConditionParams): void {
    let config = _genDCEqualToValue(secondValue, conditionConfig);
    this.setConfig(config);
}

export type OptionalEqualToConditionParams = Partial<Omit<EqualToConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;
/**
 * Common code to setup EqualToConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalEqualToConditionParams): EqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as EqualToConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.EqualTo;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalEqualToConditionParams): void {
    let config = _genDCEqualTo(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

export type OptionalNotEqualToValueConditionParams = Partial<Omit<NotEqualToValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCNotEqualToValue(
    secondValue: any,
    conditionConfig?: OptionalNotEqualToValueConditionParams): NotEqualToValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.NotEqualToValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function notEqualToValue(
    secondValue: any,
    conditionConfig?: OptionalNotEqualToValueConditionParams): void {
    let config = _genDCNotEqualToValue(secondValue, conditionConfig);
    this.setConfig(config);
}

export type OptionalNotEqualToConditionParams = Partial<Omit<NotEqualToConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup NotEqualToConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCNotEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalNotEqualToConditionParams): NotEqualToConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as NotEqualToConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.NotEqualTo;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalNotEqualToConditionParams): void {
    let config = _genDCNotEqualTo(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

export type OptionalLessThanValueConditionParams = Partial<Omit<LessThanValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCLessThanValue(
    secondValue: any,
    conditionConfig?: OptionalLessThanValueConditionParams): LessThanValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.LessThanValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: OptionalLessThanValueConditionParams): void {
    let config = _genDCLessThanValue(secondValue, conditionConfig);
    this.setConfig(config);
}

export type OptionalLessThanConditionParams = Partial<Omit<LessThanConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCLessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalLessThanConditionParams): LessThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.LessThan;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function lessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalLessThanConditionParams): void {
    let config = _genDCLessThan(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

export type OptionalLessThanOrEqualValueConditionParams = Partial<Omit<LessThanValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue'>>;

/**
 * Common code to setup LessThanOrEqualValueConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: OptionalLessThanOrEqualValueConditionParams): LessThanOrEqualValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.LessThanOrEqualValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: OptionalLessThanOrEqualValueConditionParams): void {
    let config = _genDCLessThanOrEqualValue(secondValue, conditionConfig);
    this.setConfig(config);
}

export type OptionalLessThanOrEqualConditionParams = Partial<Omit<LessThanConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup LessThanOrEqualConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalLessThanOrEqualConditionParams): LessThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as LessThanOrEqualConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.LessThanOrEqual;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalLessThanOrEqualConditionParams): void {
    let config = _genDCLessThanOrEqual(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

export type OptionalGreaterThanValueConditionParams = Partial<Omit<LessThanValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue' >>;
export type OptionalGreaterThanConditionParams = Partial<Omit<LessThanConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;
export type OptionalGreaterThanOrEqualValueConditionParams = Partial<Omit<LessThanValueConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValue' >>;
export type OptionalGreaterThanOrEqualConditionParams = Partial<Omit<LessThanConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'secondValueHostName'>>;

/**
 * Common code to setup GreaterThanValueConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCGreaterThanValue(
    secondValue: any,
    conditionConfig?: OptionalGreaterThanValueConditionParams): GreaterThanValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.GreaterThanValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function greaterThanValue(
    secondValue: any,
    conditionConfig?: OptionalGreaterThanValueConditionParams): void {
    let config = _genDCGreaterThanValue(secondValue, conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup GreaterThanConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCGreaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalGreaterThanConditionParams): GreaterThanConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.GreaterThan;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function greaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalGreaterThanConditionParams): void {
    let config = _genDCGreaterThan(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup GreaterThanOrEqualValueConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): GreaterThanOrEqualValueConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualValueConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.GreaterThanOrEqualValue;
    if (secondValue != null)
        condConfig.secondValue = secondValue;
    return condConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: OptionalGreaterThanOrEqualValueConditionParams): void {
    let config = _genDCGreaterThanOrEqualValue(secondValue, conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup GreaterThanOrEqualConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalGreaterThanOrEqualConditionParams): GreaterThanOrEqualConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as GreaterThanOrEqualConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.GreaterThanOrEqual;
    if (secondValueHostName != null)
        condConfig.secondValueHostName = secondValueHostName;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: OptionalGreaterThanOrEqualConditionParams): void {
    let config = _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig);
    this.setConfig(config);
}

export type OptionalStringLengthConditionParams = Partial<Omit<StringLengthConditionConfig, 'conditionType'  | 'valueHostName' | 'category' | 'maximum'>>;
/**
 * Common code to setup StringLengthConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCStringLength(
    maximum: number | null,
    conditionConfig?: OptionalStringLengthConditionParams): StringLengthConditionConfig {
    let condConfig = (conditionConfig ? { ...conditionConfig } : {}) as StringLengthConditionConfig;
    if (!condConfig.conditionType)
        condConfig.conditionType = ConditionType.StringLength;
    if (maximum != null)
        condConfig.maximum = maximum;
    return condConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function stringLength(
    maximum: number | null,
    conditionConfig?: OptionalStringLengthConditionParams): void {
    let config = _genDCStringLength(maximum, conditionConfig);
    this.setConfig(config);
}

/**
 * Common code to setup PositiveConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCPositive(): PositiveConditionConfig {
    return { conditionType: ConditionType.Positive } as PositiveConditionConfig;
}
// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function positive(): void {
    let config = _genDCPositive();
    this.setConfig(config);
}

/**
 * Common code to setup IntegerConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCInteger(): IntegerConditionConfig {
    return { conditionType: ConditionType.Integer } as IntegerConditionConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function integer(): void {
    let config = _genDCInteger();
    this.setConfig(config);
}

/**
 * Common code to setup MaxDecimalsConditionConfig for support within
 * FluentValidatorBuilder and ConditionBuilder fluent functions.
 * @internal
 */
export function _genDCMaxDecimals(maxDecimals: number): MaxDecimalsConditionConfig {
    return {
        conditionType: ConditionType.MaxDecimals,
        maxDecimals: maxDecimals
    } as MaxDecimalsConditionConfig;
}

// Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
function maxDecimals(maxDecimals: number): void {
    let config = _genDCMaxDecimals(maxDecimals);
    this.setConfig(config);
}

// /**
//  * Common code to setup NotConditionConfig for support within
//  * FluentValidatorBuilder and ConditionBuilder fluent functions.
//  * @internal
//  */
// export function _genDCNot(
//     childBuilder: NotConditionChildBuilderHandler): NotConditionConfig {
//     assertNotNull(childBuilder, 'childBuilder');
//     assertFunction(childBuilder);
    
//     let fluentNot = new NotConditionChildBuilder(this);
//     let fluentChild = childBuilder(fluentNot);
//     let conditionConfig = fluentChild.parentConfig.conditionConfigs[0] ?? {};
//     return {
//         conditionType: ConditionType.Not,
//         childConditionConfig: conditionConfig
//      } as NotConditionConfig;
// }
// // Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
// function not(
//     childBuilder: NotConditionChildBuilderHandler): void {
//     let config = _genDCNot(childBuilder);
//     this.setConfig(config);
// }

// /**
//  * Common code to setup WhenConditionConfig for support within
//  * FluentValidatorBuilder and ConditionBuilder fluent functions.
//  * @internal
//  */
// export function _genDCWhen(
//     whenBuilder: WhenToEnableBuilderHandler,
//     thenBuilder: ThenBuilderHandler): WhenConditionConfig {
//     assertNotNull(whenBuilder, 'whenBuilder');
//     assertFunction(whenBuilder);
//     assertNotNull(thenBuilder, 'thenBuilder');
//     assertFunction(thenBuilder);

//     let fluentWhen = new WhenToEnableBuilder(this);
//     let whenCondBuilder = whenBuilder(fluentWhen);
//     let enablerConditionConfig = whenCondBuilder.parentConfig.conditionConfigs[0] ?? {};

//     let fluentThen = new ThenBuilder(this);
//     let thenCondBuilder = thenBuilder(fluentThen);
//     let conditionConfig = thenCondBuilder.parentConfig.conditionConfigs[0] ?? {};
//     return {
//         conditionType: ConditionType.When,
//         whenToEnableConfig: enablerConditionConfig,
//         thenConfig: conditionConfig
//     } as WhenConditionConfig;
// }
// // Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
// function when(
//     whenBuilder: WhenToEnableBuilderHandler,
//     thenBuilder: ThenBuilderHandler): void {
//     let config = _genDCWhen(whenBuilder, thenBuilder);
//     this.setConfig(config);
// }

// /**
//  * For any consumer of EvaluateChildConditionResultsBaseConfig,
//  * this function will return the child configs from a FluentMultiFieldConditionBuilderHandler.
//  * @param conditionsBuilder 
//  * @returns 
//  */
// function getChildConfigs<T extends EvaluateChildConditionResultsBaseConfig>(
//     conditionsBuilder: ConditionBuilderHandler,
//     conditionType: ConditionType): T {
//     assertNotNull(conditionsBuilder, 'conditionsBuilder');
//     assertFunction(conditionsBuilder);
//     let fluentBuilder = new FluentMultiFieldConditionBuilder(null);
//     // expect an array of ConditionBuilders, each with its own list of ConditionConfigs, 
//     // to be returned from the conditionsBuilder function
//     let childFluentBuilders = conditionsBuilder(fluentBuilder);
//     let conditionConfigs: Array<ConditionConfig> = [];
//     for (let childFluentBuilder of childFluentBuilders) {
//         for (let childConfig of childFluentBuilder.parentConfig.conditionConfigs) {
//             conditionConfigs.push(childConfig);
//         }
//     }
//     return {
//         conditionType: conditionType,
//         conditionConfigs: conditionConfigs
//     } as T;
// }
// /**
//  * Common code to setup AllMatchConditionConfig for support within
//  * FluentValidatorBuilder and ConditionBuilder fluent functions.
//  * @internal
//  */
// export function _genDCAll(
//     conditionsBuilder: ConditionBuilderHandler): AllMatchConditionConfig {
//     return getChildConfigs<AllMatchConditionConfig>(conditionsBuilder, ConditionType.All);;
// }

// // Becomes a method of ConditionBuilder through enableConditionBuilderExtensions()
// function all(
//     conditionsBuilder: ConditionBuilderHandler): void {
//     let config = _genDCAll(conditionsBuilder);
//     this.setConfig(config);
// }
// /**
//  * Common code to setup AnyMatchConditionConfig for support within
//  * FluentValidatorBuilder and ConditionBuilder fluent functions.
//  * @internal
//  */
// export function _genDCAny(
//     conditionsBuilder: ConditionBuilderHandler): AnyMatchConditionConfig {
//     return getChildConfigs<AnyMatchConditionConfig>(conditionsBuilder, ConditionType.Any);
// }
// function any(
//     conditionsBuilder: ConditionBuilderHandler): void {
//     let config = _genDCAny(conditionsBuilder);
//     this.setConfig(config);
// }
// /**
//  * Common code to setup CountMatchesConditionConfig for support within
//  * FluentValidatorBuilder and ConditionBuilder fluent functions.
//  * @internal
//  */
// export function _genDCCountMatches(
//     minimum: number | null,
//     maximum: number | null,
//     conditionsBuilder: ConditionBuilderHandler): CountMatchesConditionConfig {
//     let condConfig = getChildConfigs<CountMatchesConditionConfig>(conditionsBuilder, ConditionType.CountMatches);
//     if (minimum !== null)
//         condConfig.minimum = minimum;
//     if (maximum !== null)
//         condConfig.maximum = maximum;    
//     return condConfig;    
// }
// function countMatches(
//     minimum: number | null,
//     maximum: number | null,
//     conditionsBuilder: ConditionBuilderHandler): void {
//     let config = _genDCCountMatches(minimum, maximum, conditionsBuilder);
//     this.setConfig(config);
// }
