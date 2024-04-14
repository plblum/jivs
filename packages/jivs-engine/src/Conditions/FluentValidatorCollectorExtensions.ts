/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidatorCollector and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentValidatorCollector, FluentInputValidatorDescriptor, FluentConditionCollector, finishFluentValidatorCollector
} from "../ValueHosts/Fluent";
import { ConditionType } from "./ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import {
    FluentEqualToConditionDescriptor,
    FluentEqualToValueConditionDescriptor,
    FluentGreaterThanConditionDescriptor,
    FluentGreaterThanOrEqualConditionDescriptor,
    FluentGreaterThanOrEqualValueConditionDescriptor,
    FluentGreaterThanValueConditionDescriptor,
    FluentLessThanConditionDescriptor,
    FluentLessThanOrEqualConditionDescriptor,
    FluentLessThanOrEqualValueConditionDescriptor,
    FluentLessThanValueConditionDescriptor,
    FluentNotEqualToConditionDescriptor,
    FluentNotEqualToValueConditionDescriptor,
    FluentRegExpConditionDescriptor,
    FluentRequiredTextConditionDescriptor,
    FluentStringLengthConditionDescriptor,
    FluentStringNotEmptyConditionDescriptor,
    _genCDDataTypeCheck, _genCDRange, _genCDRegExp, _genDCAll, _genDCAny,
    _genDCCountMatches, _genDCEqualTo, _genDCEqualToValue, _genDCGreaterThan,
    _genDCGreaterThanOrEqual, _genDCGreaterThanOrEqualValue, _genDCGreaterThanValue,
    _genDCLessThan, _genDCLessThanOrEqual, _genDCLessThanOrEqualValue, _genDCLessThanValue,
    _genDCNotEqualTo, _genDCNotEqualToValue, _genDCNotNull, _genDCRequiredText,
    _genDCStringLength, _genDCStringNotEmpty, initFluentConditions
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
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;

        regExp(
            expression: RegExp | string | null, ignoreCase?: boolean | null,
            conditionDescriptor?: FluentRegExpConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;

        range(
            minimum: any, maximum: any,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        equalToValue(
            secondValue: any,
            conditionDescriptor?: FluentEqualToValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        equalTo(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentEqualToConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        notEqualToValue(
            secondValue: any,
            conditionDescriptor?: FluentNotEqualToValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        notEqualTo(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentNotEqualToConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lessThanValue(
            secondValue: any,
            conditionDescriptor?: FluentLessThanValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lessThan(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lessThanOrEqualValue(
            secondValue: any,
            conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        greaterThanValue(
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        greaterThan(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        greaterThanOrEqualValue(
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor| null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
       
        stringLength(
            maximum: number | null,
            conditionDescriptor?: FluentStringLengthConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        all(
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        any(
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;        
        countMatches(
            minimum: number | null, maximum: number | null,
            configChildren: FluentConditionCollector,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        stringNotEmpty(
            conditionDescriptor?: FluentStringNotEmptyConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;        
        requiredText(
            conditionDescriptor?: FluentRequiredTextConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;        
        notNull(
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;        
        
        
    //#region shorter names for some
        ltValue(
            secondValue: any,
            conditionDescriptor?: FluentLessThanValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lt(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lteValue(
            secondValue: any,
            conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        lte(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        gtValue(
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        gt(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        gteValue(
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;
        gte(
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor | null,
            errorMessage?: string | null,
            inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector;        
    //#endregion shorter names for some        
        
    }
}

/**
 * Call from initialization code, but safe to call repeatedly.
 * @remarks
 * Inside of a function to allow apps that don't use these fluent classes
 * to avoid any time setting up something not used.
 */
export function initFluent(): void {
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

    initFluentConditions();
}

// --- Actual fluent functions -------

function dataTypeCheck(
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
// no ConditionDescriptor parameter because without type and valueHostName, it will always be empty    
    return finishFluentValidatorCollector(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, inputValidatorParameters);
}

function regExp(
    expression: RegExp | string, ignoreCase?: boolean | null,
    conditionDescriptor?: FluentRegExpConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function range(
    minimum: any, maximum: any,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Range, _genCDRange(minimum, maximum),
        errorMessage, inputValidatorParameters);
}

function equalToValue(
    secondValue: any,
    conditionDescriptor?: FluentEqualToValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.EqualTo,
        _genDCEqualToValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function equalTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentEqualToConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function notEqualToValue(
    secondValue: any,
    conditionDescriptor?: FluentNotEqualToValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this, ConditionType.NotEqualTo,
        _genDCNotEqualToValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function notEqualTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentNotEqualToConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function lessThanValue(
    secondValue: any,
    conditionDescriptor?: FluentLessThanValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThan, _genDCLessThanValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function lessThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanConditionDescriptor| null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function lessThanOrEqualValue(
    secondValue: any,
    conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqualValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function greaterThanValue(
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThanValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function greaterThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function greaterThanOrEqualValue(
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqualValue(secondValue, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function stringLength(
    maximum: number | null,
    conditionDescriptor?: FluentStringLengthConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
// no ConditionDescriptor parameter because without type, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function all(
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.All, _genDCAll(configChildren),
        errorMessage, inputValidatorParameters);
}

function any(
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.Any, _genDCAny(configChildren),
        errorMessage, inputValidatorParameters);
}

function countMatches(
    minimum: number | null,
    maximum: number | null,
    configChildren: FluentConditionCollector,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, configChildren),
        errorMessage, inputValidatorParameters);
}

function stringNotEmpty(
    conditionDescriptor?: FluentStringNotEmptyConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.StringNotEmpty, _genDCStringNotEmpty(conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function requiredText(
    conditionDescriptor?: FluentRequiredTextConditionDescriptor | null,
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    return finishFluentValidatorCollector(this,
        ConditionType.RequiredText, _genDCRequiredText(conditionDescriptor),
        errorMessage, inputValidatorParameters);
}

function notNull(
    errorMessage?: string | null,
    inputValidatorParameters?: FluentInputValidatorDescriptor): FluentValidatorCollector {
    // no ConditionDescriptor parameter because without type and valueHostName, it will always be empty        
    return finishFluentValidatorCollector(this,
        ConditionType.NotNull, _genDCNotNull(),
        errorMessage, inputValidatorParameters);
}