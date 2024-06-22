
/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidatorCollector and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentOneConditionCollectorHandler,
    FluentValidatorCollector, FluentValidatorConfig, finishFluentValidatorCollector
} from "../ValueHosts/Fluent";
import { ConditionType } from "./ConditionTypes";
import { FluentConditionCollectorHandler } from './../ValueHosts/Fluent';
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
} from "./FluentConditionCollectorExtensions";

// How TypeScript merges functions with the FluentValidatorCollector class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentValidatorCollector {
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
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        requireText(
            conditionConfig?: FluentRequireTextConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;        
        notNull(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;        
        regExp(
            expression: RegExp | string | null, ignoreCase?: boolean | null,
            conditionConfig?: FluentRegExpConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        range(
            minimum: any, maximum: any,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        not(
            childConfig: FluentOneConditionCollectorHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        when(
            enablerConfig: FluentOneConditionCollectorHandler,
            childConfig: FluentOneConditionCollectorHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;        
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: FluentNotEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        notEqualTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentNotEqualToConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lessThanValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig| null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
       
        stringLength(
            maximum: number | null,
            conditionConfig?: FluentStringLengthConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        all(
            conditions: FluentConditionCollectorHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        any(
            conditions: FluentConditionCollectorHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;        
        countMatches(
            minimum: number | null, maximum: number | null,
            conditions: FluentConditionCollectorHandler,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;      
        positive(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;       
        integer(
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;               
        maxDecimals(
            maxDecimals: number,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;               


    //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lteValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        gtValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        gteValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            validatorParameters?: FluentValidatorConfig): FluentValidatorCollector;        
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
    if (typeof FluentValidatorCollector.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the FluentValidatorCollector class
    FluentValidatorCollector.prototype.dataTypeCheck = dataTypeCheck;
    FluentValidatorCollector.prototype.requireText = requireText;
    FluentValidatorCollector.prototype.notNull = notNull;
    FluentValidatorCollector.prototype.regExp = regExp;
    FluentValidatorCollector.prototype.range = range;
    FluentValidatorCollector.prototype.equalToValue = equalToValue;
    FluentValidatorCollector.prototype.equalTo = equalTo;
    FluentValidatorCollector.prototype.notEqualToValue = notEqualToValue;
    FluentValidatorCollector.prototype.notEqualTo = notEqualTo;
    FluentValidatorCollector.prototype.lessThanValue = lessThanValue;
    FluentValidatorCollector.prototype.lessThan = lessThan;
    FluentValidatorCollector.prototype.lessThanOrEqualValue = lessThanOrEqualValue;
    FluentValidatorCollector.prototype.lessThanOrEqual = lessThanOrEqual;
    FluentValidatorCollector.prototype.greaterThanValue = greaterThanValue;
    FluentValidatorCollector.prototype.greaterThan = greaterThan;
    FluentValidatorCollector.prototype.greaterThanOrEqualValue = greaterThanOrEqualValue;
    FluentValidatorCollector.prototype.greaterThanOrEqual = greaterThanOrEqual;
    FluentValidatorCollector.prototype.stringLength = stringLength;
    FluentValidatorCollector.prototype.all = all;
    FluentValidatorCollector.prototype.any = any;
    FluentValidatorCollector.prototype.countMatches = countMatches;
    FluentValidatorCollector.prototype.positive = positive;
    FluentValidatorCollector.prototype.integer = integer;
    FluentValidatorCollector.prototype.maxDecimals = maxDecimals;
    FluentValidatorCollector.prototype.not = not;
    FluentValidatorCollector.prototype.when = when;


    //#region shorter names for some
    FluentValidatorCollector.prototype.ltValue = lessThanValue;
    FluentValidatorCollector.prototype.lt = lessThan;
    FluentValidatorCollector.prototype.lteValue = lessThanOrEqualValue;
    FluentValidatorCollector.prototype.lte = lessThanOrEqual;
    FluentValidatorCollector.prototype.gtValue = greaterThanValue;
    FluentValidatorCollector.prototype.gt = greaterThan;
    FluentValidatorCollector.prototype.gteValue = greaterThanOrEqualValue;
    FluentValidatorCollector.prototype.gte = greaterThanOrEqual;
    //#endregion shorter names for some

    enableFluentConditions();
}

// --- Actual fluent functions -------

function dataTypeCheck(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
// no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty    
    return finishFluentValidatorCollector(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, validatorParameters);
}

function requireText(
    conditionConfig?: FluentRequireTextConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig),
        errorMessage, validatorParameters);
}

function notNull(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.NotNull, _genDCNotNull(),
        errorMessage, validatorParameters);
}

function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: FluentRegExpConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
        errorMessage, validatorParameters);
}
function range(
    minimum: any, maximum: any,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Range, _genCDRange(minimum, maximum),
        errorMessage, validatorParameters);
}

function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}
function notEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.NotEqualToValue,
        _genDCNotEqualToValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentNotEqualToConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanValue, _genDCLessThanValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function lessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanConditionConfig| null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqualValue, _genDCLessThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function greaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanValue, _genDCGreaterThanValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function greaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqualValue, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, validatorParameters);
}
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, validatorParameters);
}

function stringLength(
    maximum: number | null,
    conditionConfig?: FluentStringLengthConditionConfig | null,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
// no ConditionConfig parameter because without conditionType, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig),
        errorMessage, validatorParameters);
}

function all(
    conditions: FluentConditionCollectorHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.All, _genDCAll(conditions),
        errorMessage, validatorParameters);
}

function any(
    conditions: FluentConditionCollectorHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Any, _genDCAny(conditions),
        errorMessage, validatorParameters);
}

function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditions: FluentConditionCollectorHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, conditions),
        errorMessage, validatorParameters);
}
function positive(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.Positive, _genDCPositive(),
        errorMessage, validatorParameters);
}

function integer(
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.Integer, _genDCInteger(),
        errorMessage, validatorParameters);
}

function maxDecimals(
    maxDecimals: number,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.MaxDecimals, _genDCMaxDecimals(maxDecimals),
        errorMessage, validatorParameters);
}

function not(
    childConfig: FluentOneConditionCollectorHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Not, _genDCNot(childConfig),
        errorMessage, validatorParameters);
}

function when(
    enablerConfig: FluentOneConditionCollectorHandler,
    childConfig: FluentOneConditionCollectorHandler,
    errorMessage?: string | null,
    validatorParameters?: FluentValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.When, _genDCWhen(enablerConfig, childConfig),
        errorMessage, validatorParameters);
}