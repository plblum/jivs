
/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidatorBuilder and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentOneConditionBuilderHandler,
    FluentValidatorBuilder, FluentValidatorConfig, finishFluentValidatorBuilder
} from "../ValueHosts/Fluent";
import { ConditionType } from "./ConditionTypes";
import { FluentConditionBuilderHandler } from './../ValueHosts/Fluent';
import { ValueHostName } from "../DataTypes/BasicTypes";
import {
    FluentEqualToConditionConfig,
    FluentEqualToValueConditionConfig,
    FluentGreaterThanConditionConfig,
    FluentGreaterThanOrEqualConditionConfig,
    FluentGreaterThanOrEqualValueConditionConfig,
    FluentGreaterThanValueConditionConfig,
    FluentLessThanConditionConfig,
    FluentLessThanOrEqualConditionConfig,
    FluentLessThanOrEqualValueConditionConfig,
    FluentLessThanValueConditionConfig,
    FluentNotEqualToConditionConfig,
    FluentNotEqualToValueConditionConfig,
    FluentRegExpConditionConfig,
    FluentRequireTextConditionConfig,
    FluentStringLengthConditionConfig,
    _genCDDataTypeCheck, _genCDRange, _genCDRegExp, _genDCAll, _genDCAny,
    _genDCCountMatches, _genDCEqualTo, _genDCEqualToValue, _genDCGreaterThan,
    _genDCGreaterThanOrEqual, _genDCGreaterThanOrEqualValue, _genDCGreaterThanValue,
    _genDCInteger,
    _genDCLessThan, _genDCLessThanOrEqual, _genDCLessThanOrEqualValue, _genDCLessThanValue,
    _genDCMaxDecimals,
    _genDCNot,
    _genDCNotEqualTo, _genDCNotEqualToValue, _genDCNotNull, _genDCPositive, _genDCRequireText,
    _genDCStringLength, _genDCWhen, enableFluentConditions
} from "./FluentConditionBuilderExtensions";

// How TypeScript merges functions with the FluentValidatorBuilder class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentValidatorBuilder {
        /**
         * 
         * @param errorMessage 
         * The error message "template" that will appear on screen when the condition is NoMatch.
         * It can use tokens, which are resolved with current data at the time of validation.
         * If null, it will expect to be setup by one of several other sources including
         * localization (validatorParameters.errorMessagel10n) and the TextLocalizationService.
         * @param validatorParameters 
         * Additional ways to customize the Validator, including localized error messages,
         * severity, and the enabler.
         */
        dataTypeCheck(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        requireText(
            conditionConfig?: FluentRequireTextConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;        
        notNull(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;        
        regExp(
            expression: RegExp | string | null, ignoreCase?: boolean | null,
            conditionConfig?: FluentRegExpConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        range(
            minimum: any, maximum: any,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        not(
            childBuilder: FluentOneConditionBuilderHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        when(
            enablerBuilder: FluentOneConditionBuilderHandler,
            childBuilder: FluentOneConditionBuilderHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;        
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: FluentNotEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        notEqualTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentNotEqualToConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lessThanValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig| null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
       
        stringLength(
            maximum: number | null,
            conditionConfig?: FluentStringLengthConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        all(
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        any(
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;        
        countMatches(
            minimum: number | null, maximum: number | null,
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;      
        positive(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;       
        integer(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;               
        maxDecimals(
            maxDecimals: number,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;               


    //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lteValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        gtValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        gteValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;        
    //#endregion shorter names for some        
        
    }
}

/**
 * Call from initialization code, but safe to call repeatedly.
 * @remarks
 * Inside of a function to allow apps that don't use these fluent classes
 * to avoid any time setting up something not used.
 */
export function enableFluent(): void {
    if (typeof FluentValidatorBuilder.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the FluentValidatorBuilder class
    FluentValidatorBuilder.prototype.dataTypeCheck = dataTypeCheck;
    FluentValidatorBuilder.prototype.requireText = requireText;
    FluentValidatorBuilder.prototype.notNull = notNull;
    FluentValidatorBuilder.prototype.regExp = regExp;
    FluentValidatorBuilder.prototype.range = range;
    FluentValidatorBuilder.prototype.equalToValue = equalToValue;
    FluentValidatorBuilder.prototype.equalTo = equalTo;
    FluentValidatorBuilder.prototype.notEqualToValue = notEqualToValue;
    FluentValidatorBuilder.prototype.notEqualTo = notEqualTo;
    FluentValidatorBuilder.prototype.lessThanValue = lessThanValue;
    FluentValidatorBuilder.prototype.lessThan = lessThan;
    FluentValidatorBuilder.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
    FluentValidatorBuilder.prototype.lessThanOrEqual = lessThanOrEqual;
    FluentValidatorBuilder.prototype.greaterThanValue = greaterThanValue;
    FluentValidatorBuilder.prototype.greaterThan = greaterThan;
    FluentValidatorBuilder.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
    FluentValidatorBuilder.prototype.greaterThanOrEqual = greaterThanOrEqual;
    FluentValidatorBuilder.prototype.stringLength = stringLength;
    FluentValidatorBuilder.prototype.all = all;
    FluentValidatorBuilder.prototype.any = any;
    FluentValidatorBuilder.prototype.countMatches = countMatches;
    FluentValidatorBuilder.prototype.positive = positive;
    FluentValidatorBuilder.prototype.integer = integer;
    FluentValidatorBuilder.prototype.maxDecimals = maxDecimals;
    FluentValidatorBuilder.prototype.not = not;
    FluentValidatorBuilder.prototype.when = when;


    //#region shorter names for some
    FluentValidatorBuilder.prototype.ltValue = lessThanValue;
    FluentValidatorBuilder.prototype.lt = lessThan;
    FluentValidatorBuilder.prototype.lteValue = lessThanOrEqualValue;
    FluentValidatorBuilder.prototype.lte = lessThanOrEqual;
    FluentValidatorBuilder.prototype.gtValue = greaterThanValue;
    FluentValidatorBuilder.prototype.gt = greaterThan;
    FluentValidatorBuilder.prototype.gteValue = greaterThanOrEqualValue;
    FluentValidatorBuilder.prototype.gte = greaterThanOrEqual;
    //#endregion shorter names for some

    enableFluentConditions();
}

// --- Actual fluent functions -------

function dataTypeCheck(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
// no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty    
    return finishFluentValidatorBuilder(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, validatorParameters);
}

function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig),
        errorMessage, validatorParameters);
}

function notNull(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorBuilder(this,
        ConditionType.NotNull, _genDCNotNull(),
        errorMessage, validatorParameters);
}

function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: FluentRegExpConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
        errorMessage, validatorParameters);
}
function range(
    minimum: any, maximum: any,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.Range, _genCDRange(minimum, maximum),
        errorMessage, validatorParameters);
}

function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this, ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}
function notEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this, ConditionType.NotEqualToValue,
        _genDCNotEqualToValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentNotEqualToConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanValue, _genDCLessThanValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function lessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanConditionConfig| null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanOrEqualValue, _genDCLessThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function greaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanValue, _genDCGreaterThanValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function greaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanOrEqualValue, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function stringLength(
    maximum: number | null,
    conditionConfig?: FluentStringLengthConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
// no ConditionConfig parameter because without conditionType, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentValidatorBuilder(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig),
        errorMessage, validatorParameters);
}

function all(
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.All, _genDCAll(conditionsBuilder),
        errorMessage, validatorParameters);
}

function any(
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.Any, _genDCAny(conditionsBuilder),
        errorMessage, validatorParameters);
}

function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, conditionsBuilder),
        errorMessage, validatorParameters);
}
function positive(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorBuilder(this,
        ConditionType.Positive, _genDCPositive(),
        errorMessage, validatorParameters);
}

function integer(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorBuilder(this,
        ConditionType.Integer, _genDCInteger(),
        errorMessage, validatorParameters);
}

function maxDecimals(
    maxDecimals: number,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorBuilder(this,
        ConditionType.MaxDecimals, _genDCMaxDecimals(maxDecimals),
        errorMessage, validatorParameters);
}

function not(
    childBuilder: FluentOneConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.Not, _genDCNot(childBuilder),
        errorMessage, validatorParameters);
}

function when(
    enablerBuilder: FluentOneConditionBuilderHandler,
    childBuilder: FluentOneConditionBuilderHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder {
    return finishFluentValidatorBuilder(this,
        ConditionType.When, _genDCWhen(enablerBuilder, childBuilder),
        errorMessage, validatorParameters);
}