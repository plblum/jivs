/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidatorCollector and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentValidatorCollector, FluentInputValidatorConfig, FluentConditionCollector, finishFluentValidatorCollector
} from "../ValueHosts/Fluent";
import { ConditionType } from "./ConditionTypes";
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
    FluentRequiredTextConditionConfig,
    FluentStringLengthConditionConfig,
    FluentStringNotEmptyConditionConfig,
    _genCDDataTypeCheck, _genCDRange, _genCDRegExp, _genDCAll, _genDCAny,
    _genDCCountMatches, _genDCEqualTo, _genDCEqualToValue, _genDCGreaterThan,
    _genDCGreaterThanOrEqual, _genDCGreaterThanOrEqualValue, _genDCGreaterThanValue,
    _genDCLessThan, _genDCLessThanOrEqual, _genDCLessThanOrEqualValue, _genDCLessThanValue,
    _genDCNotEqualTo, _genDCNotEqualToValue, _genDCNotNull, _genDCRequiredText,
    _genDCStringLength, _genDCStringNotEmpty, enableFluentConditions
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
         * localization (inputValidatorParameters.errorMessagel10n) and the TextLocalizationService.
         * @param inputValidatorParameters 
         * Additional ways to customize the InputValidator, including localized error messages,
         * severity, and the enabler.
         */
        dataTypeCheck(
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;

        regExp(
            expression: RegExp | string | null, ignoreCase?: boolean | null,
            conditionConfig?: FluentRegExpConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;

        range(
            minimum: any, maximum: any,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        equalToValue(
            secondValue: any,
            conditionConfig?: FluentEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentEqualToConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        notEqualToValue(
            secondValue: any,
            conditionConfig?: FluentNotEqualToValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        notEqualTo(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentNotEqualToConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lessThanValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lessThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        greaterThanValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig| null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
       
        stringLength(
            maximum: number | null,
            conditionConfig?: FluentStringLengthConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        all(
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        any(
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;        
        countMatches(
            minimum: number | null, maximum: number | null,
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        stringNotEmpty(
            conditionConfig?: FluentStringNotEmptyConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;        
        requiredText(
            conditionConfig?: FluentRequiredTextConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;        
        notNull(
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;        
        
        
    //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionConfig?: FluentLessThanValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lteValue(
            secondValue: any,
            conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        lte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        gtValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        gt(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        gteValue(
            secondValue: any,
            conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;
        gte(
            secondValueHostName: ValueHostName,
            conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector;        
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
    FluentValidatorCollector.prototype.stringNotEmpty = stringNotEmpty;
    FluentValidatorCollector.prototype.requiredText = requiredText;
    FluentValidatorCollector.prototype.notNull = notNull;

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
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
// no ConditionConfig parameter because without type and valueHostName, it will always be empty    
    return finishFluentValidatorCollector(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, inputValidatorParameters);
}

function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionConfig?: FluentRegExpConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function range(
    minimum: any, maximum: any,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Range, _genCDRange(minimum, maximum),
        errorMessage, inputValidatorParameters);
}

function equalToValue(
    secondValue: any,
    conditionConfig?: FluentEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.EqualTo,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function equalTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentEqualToConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function notEqualToValue(
    secondValue: any,
    conditionConfig?: FluentNotEqualToValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.NotEqualTo,
        _genDCNotEqualToValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentNotEqualToConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function lessThanValue(
    secondValue: any,
    conditionConfig?: FluentLessThanValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThan, _genDCLessThanValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function lessThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanConditionConfig| null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentLessThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentLessThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function greaterThanValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThanValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function greaterThan(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionConfig?: FluentGreaterThanOrEqualValueConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, inputValidatorParameters);
}
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionConfig?: FluentGreaterThanOrEqualConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function stringLength(
    maximum: number | null,
    conditionConfig?: FluentStringLengthConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
// no ConditionConfig parameter because without type, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig),
        errorMessage, inputValidatorParameters);
}

function all(
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.All, _genDCAll(configChildren),
        errorMessage, inputValidatorParameters);
}

function any(
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Any, _genDCAny(configChildren),
        errorMessage, inputValidatorParameters);
}

function countMatches(
    minimum: number | null,
    maximum: number | null,
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, configChildren),
        errorMessage, inputValidatorParameters);
}

function stringNotEmpty(
    conditionConfig?: FluentStringNotEmptyConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.StringNotEmpty, _genDCStringNotEmpty(conditionConfig),
        errorMessage, inputValidatorParameters);
}

function requiredText(
    conditionConfig?: FluentRequiredTextConditionConfig | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RequiredText, _genDCRequiredText(conditionConfig),
        errorMessage, inputValidatorParameters);
}

function notNull(
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorConfig): FluentValidatorCollector {
    // no ConditionConfig parameter because without type and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.NotNull, _genDCNotNull(),
        errorMessage, inputValidatorParameters);
}