
/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidatorBuilder and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import {
    FluentOneConditionBuilderHandler,
    FluentValidatorBuilder, FluentValidatorConfig, FluentValidatorOverloadArgs, finishFluentValidatorBuilder, finishFluentValidatorBuilder_OBSOLETE,
    resolveValidatorOverloadArgs
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

import {
    AllMatchConditionConfig,
    AnyMatchConditionConfig,
    CountMatchesConditionConfig,
    DataTypeCheckConditionConfig,
    EqualToConditionConfig,
    EqualToValueConditionConfig,
    GreaterThanConditionConfig,
    GreaterThanOrEqualConditionConfig,
    GreaterThanOrEqualValueConditionConfig,
    GreaterThanValueConditionConfig,
    IntegerConditionConfig,
    LessThanConditionConfig,
    LessThanOrEqualConditionConfig,
    LessThanOrEqualValueConditionConfig,
    LessThanValueConditionConfig,
    MaxDecimalsConditionConfig,
    NotEqualToConditionConfig,
    NotEqualToValueConditionConfig,
    NotNullConditionConfig,
    PositiveConditionConfig,
    RegExpConditionConfig,
    RequireTextConditionConfig,
    StringLengthConditionConfig
} from '../Conditions/ConcreteConditions';
import { NotConditionConfig } from "./NotCondition";
import { WhenConditionConfig } from "./WhenCondition";

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
         * @param summaryMessage - optional summary message.
         * @param validatorParameters 
         * Additional ways to customize the Validator, including localized error messages,
         * severity, and the enabler.
         * 
         * ```ts
         * dataTypeCheck();
         * dataTypeCheck('Error message');
         * dataTypeCheck('Error message', 'Summary message');
         * dataTypeCheck(null, 'Summary message');
         * dataTypeCheck({ errorMessage: 'Error message'});
         * ```
         */
        dataTypeCheck(
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        dataTypeCheck(
            validatorParameters: FluentDataTypeCheckValidatorConfig): FluentValidatorBuilder;

        requireText(
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        requireText(
            validatorParameters: FluentRequireTextValidatorConfig): FluentValidatorBuilder;      
        
        notNull(
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;        
        notNull(
            validatorParameters?: FluentNotNullValidatorConfig): FluentValidatorBuilder;        
        
        regExp(
            expression: RegExp,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        regExp(
            expression: string,
            ignoreCase?: boolean,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        regExp(
            expression: RegExp,
            validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;
        regExp(
            expression: string,
            ignoreCase: boolean,
            validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;      
        
        range(
            minimum: any, maximum: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        range(
            minimum: any, maximum: any,
            validatorParameters: FluentRangeValidatorConfig): FluentValidatorBuilder;
        
        equalToValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        equalToValue(
            secondValue: any,
            validatorParameters: FluentEqualToValueValidatorConfig): FluentValidatorBuilder;        
        
        equalTo(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        equalTo(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
        
        notEqualToValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        notEqualToValue(
            secondValue: any,
            validatorParameters: FluentNotEqualToValueValidatorConfig): FluentValidatorBuilder;
        
        notEqualTo(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        notEqualTo(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentNotEqualToValidatorConfig): FluentValidatorBuilder;
        
        lessThanValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lessThanValue(
            secondValue: any,
            validatorParameters: FluentLessThanValueValidatorConfig): FluentValidatorBuilder;
        
        lessThan(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lessThan(
            secondValueHostName: ValueHostName,
            validatorParameters?: FluentLessThanValidatorConfig): FluentValidatorBuilder;
        
        lessThanOrEqualValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lessThanOrEqualValue(
            secondValue: any,
            validatorParameters: FluentLessThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
        
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lessThanOrEqual(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentLessThanOrEqualValidatorConfig): FluentValidatorBuilder;
        
        greaterThanValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        greaterThanValue(
            secondValue: any,
            validatorParameters?: FluentGreaterThanValueValidatorConfig): FluentValidatorBuilder;
        
        greaterThan(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        greaterThan(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentGreaterThanValidatorConfig): FluentValidatorBuilder;
        
        greaterThanOrEqualValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        greaterThanOrEqualValue(
            secondValue: any,
            validatorParameters: FluentGreaterThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
        
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        greaterThanOrEqual(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentGreaterThanOrEqualValidatorConfig): FluentValidatorBuilder;
       
        stringLength(
            maximum: number | null,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        stringLength(
            maximum: number | null,
            validatorParameters: FluentStringLengthValidatorConfig): FluentValidatorBuilder;
        
        all(
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        all(
            conditionsBuilder: FluentConditionBuilderHandler,
            validatorParameters?: FluentValidatorConfig): FluentValidatorBuilder;
        
        any(
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;        
        any(
            conditionsBuilder: FluentConditionBuilderHandler,
            validatorParameters: FluentAnyMatchValidatorConfig): FluentValidatorBuilder;   

        countMatches(
            minimum: number | null,
            maximum: number | null,
            conditionsBuilder: FluentConditionBuilderHandler,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;      
        countMatches(
            minimum: number | null,
            maximum: number | null,
            conditionsBuilder: FluentConditionBuilderHandler,
            validatorParameters: FluentCountMatchesValidatorConfig): FluentValidatorBuilder;  
        
        positive(
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;       
        positive(
            validatorParameters: FluentValidatorConfig): FluentValidatorBuilder;       
        
        integer(
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;               
        integer(
            validatorParameters: FluentIntegerValidatorConfig): FluentValidatorBuilder;  
        
        maxDecimals(
            maxDecimals: number,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;               
        maxDecimals(
            maxDecimals: number,
            validatorParameters: FluentMaxDecimalsValidatorConfig): FluentValidatorBuilder;           
        
        not(
            childBuilder: FluentOneConditionBuilderHandler,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        not(
            childBuilder: FluentOneConditionBuilderHandler,
            validatorParameters: FluentNotValidatorConfig): FluentValidatorBuilder;
        
        when(
            whenBuilder: FluentOneConditionBuilderHandler,
            thenBuilder: FluentOneConditionBuilderHandler,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;    
        when(
            whenBuilder: FluentOneConditionBuilderHandler,
            thenBuilder: FluentOneConditionBuilderHandler,
            validatorParameters: FluentWhenValidatorConfig): FluentValidatorBuilder;    

        //#region shorter names for some
        eqValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        eqValue(
            secondValue: any,
            validatorParameters: FluentEqualToValueValidatorConfig): FluentValidatorBuilder;
        eq(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        eq(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
        neqValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        neqValue(
            secondValue: any,
            validatorParameters: FluentNotEqualToValueValidatorConfig): FluentValidatorBuilder;
        neq(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        neq(
            secondValueHostName: ValueHostName,
            validatorParameters: FluentNotEqualToValidatorConfig): FluentValidatorBuilder;        
        
        ltValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        ltValue(
            secondValue: any,
            validatorParameters: FluentLessThanValueValidatorConfig): FluentValidatorBuilder;
        
        lt(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lt(
            secondValueHostName: ValueHostName,
            validatorParameters?: FluentLessThanValidatorConfig): FluentValidatorBuilder;
        
        lteValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lteValue(
            secondValue: any,
            validatorParameters?: FluentLessThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
        
        lte(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        lte(
            secondValueHostName: ValueHostName,
            validatorParameters?: FluentLessThanOrEqualValidatorConfig): FluentValidatorBuilder;
        gtValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        gtValue(
            secondValue: any,
            validatorParameters?: FluentGreaterThanValueValidatorConfig): FluentValidatorBuilder;
        gt(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        gt(
            secondValueHostName: ValueHostName,
            validatorParameters?: FluentGreaterThanValidatorConfig): FluentValidatorBuilder;
        gteValue(
            secondValue: any,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;
        gteValue(
            secondValue: any,
            validatorParameters?: FluentGreaterThanOrEqualValueValidatorConfig): FluentValidatorBuilder;
        gte(
            secondValueHostName: ValueHostName,
            errorMessage?: string | null,
            summaryMessage?: string | null): FluentValidatorBuilder;        
        gte(
            secondValueHostName: ValueHostName,
            validatorParameters?: FluentGreaterThanOrEqualValidatorConfig): FluentValidatorBuilder;        
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
    FluentValidatorBuilder.prototype.eqValue = equalToValue;
    FluentValidatorBuilder.prototype.eq = equalTo;
    FluentValidatorBuilder.prototype.neqValue = notEqualToValue;
    FluentValidatorBuilder.prototype.neq = notEqualTo;
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
// Each condition gets its own function that expects to have
// 'this' as FluentValidatorBuilder and return this for the next in the chain.

export type FluentDataTypeCheckValidatorConfig = FluentValidatorConfig;


function dataTypeCheck(
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function dataTypeCheck(
    validatorParameters: FluentDataTypeCheckValidatorConfig): FluentValidatorBuilder;
function dataTypeCheck(
    arg1?: FluentDataTypeCheckValidatorConfig | string | null,
    arg2?: string | null): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty   
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } = 
    resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(arg1, arg2);
    return finishFluentValidatorBuilder(this,
        ConditionType.DataTypeCheck, _genCDDataTypeCheck(),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentRequireTextValidatorConfig = FluentValidatorConfig & FluentRequireTextConditionConfig;

function requireText(
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function requireText(
    validatorParameters: FluentRequireTextValidatorConfig): FluentValidatorBuilder;        
function requireText(
    arg1?: string | null | FluentRequireTextValidatorConfig,
    arg2?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } = 
    resolveValidatorOverloadArgs<RequireTextConditionConfig>(arg1, arg2);
    return finishFluentValidatorBuilder(this,
        ConditionType.RequireText, _genDCRequireText(conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentNotNullValidatorConfig = FluentValidatorConfig;

function notNull(
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function notNull(
    validatorParameters: FluentNotNullValidatorConfig): FluentValidatorBuilder;
function notNull(
    arg1?: string | null | FluentNotNullValidatorConfig,
    arg2?: string | null): FluentValidatorBuilder {
    // no ConditionConfig parameter because without conditionType and valueHostName, it will always be empty  
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
    resolveValidatorOverloadArgs<NotNullConditionConfig>(arg1, arg2);
    return finishFluentValidatorBuilder(this,
        ConditionType.NotNull, _genDCNotNull(),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentRegExpValidatorConfig = FluentValidatorConfig & FluentRegExpConditionConfig;

function regExp(
    expression: RegExp,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function regExp(
    expression: string,
    ignoreCase?: boolean,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function regExp(
    expression: RegExp,
    validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;
function regExp(
    expression: string,
    ignoreCase: boolean,
    validatorParameters: FluentRegExpValidatorConfig): FluentValidatorBuilder;
function regExp(
    expression: RegExp | string, // can be either a RegExp or a string, but if string, then ignoreCase is needed
    arg2?: string | boolean | FluentRegExpValidatorConfig | null,
    arg3?: string | null | FluentRegExpValidatorConfig,
    arg4?: string | null | FluentRegExpValidatorConfig): FluentValidatorBuilder {
    if (arg2 && typeof arg2 === 'string') { // then both arg2 and arg3 are errorMessage and summaryMessage
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(arg2, arg3 as string | null);

        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, null, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }
    else if (arg2 && typeof arg2 === 'object') { // then arg2 is validatorParameters
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(arg2 as FluentRegExpValidatorConfig);

        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, null, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }
    else if (typeof arg2 === 'boolean') { // then arg2 is ignoreCase
        let ignoreCase = arg2 as boolean;
        if (arg3 && typeof arg3 === 'string') { // then both arg3 and arg4 are errorMessage and summaryMessage
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                resolveValidatorOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
            return finishFluentValidatorBuilder(this,
                ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
                errorMessage, summaryMessage, validatorParameters);
                    
        }
        else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                resolveValidatorOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
            return finishFluentValidatorBuilder(this,
                ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
                errorMessage, summaryMessage, validatorParameters);
        }
        if (arg4 && typeof arg4 === 'string') { // because arg3 is null as a placeholder for errormessage
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                resolveValidatorOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string);
            return finishFluentValidatorBuilder(this,
                ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
                errorMessage, summaryMessage, validatorParameters);
        }
            
        else {
            let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
                resolveValidatorOverloadArgs<RegExpConditionConfig>(null, null);
            return finishFluentValidatorBuilder(this,
                ConditionType.RegExp, _genCDRegExp(expression, ignoreCase, conditionConfig),
                errorMessage, summaryMessage, validatorParameters);
        }
    }
    else if (arg3 && typeof arg3 === 'object') { // then arg3 is validatorParameters and arg2 is likely undefined
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(arg3 as FluentRegExpValidatorConfig);
        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, undefined, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }
    else if (expression instanceof RegExp && arg2 == null && (typeof arg3 === 'string') && arg4 == null) { // then arg2 is error message = null and arg3 is summaryMessage and arg4 is unused
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(null, arg3 as string | null);
        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, undefined, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }  
    else if (typeof expression === 'string' && arg3 == null && (typeof arg4 === 'string')) { // then arg2 is ignoreCase = undefined, arg3 is errorMessage = null and arg4 is summaryMessage
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(null, arg4 as string | null);
        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, undefined, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }            
    else if (arg2 == null && (typeof arg3 === 'string' || typeof arg4 === 'string')) { // then arg2 is null, arg3 is errorMessage and arg4 is summaryMessage
        let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
            resolveValidatorOverloadArgs<RegExpConditionConfig>(arg3 as string | null, arg4 as string | null);
        return finishFluentValidatorBuilder(this,
            ConditionType.RegExp, _genCDRegExp(expression, undefined, conditionConfig),
            errorMessage, summaryMessage, validatorParameters);
    }
// fall-thru
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<RegExpConditionConfig>(null, null);
    return finishFluentValidatorBuilder(this,
        ConditionType.RegExp, _genCDRegExp(expression, undefined, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
    
}

export type FluentRangeValidatorConfig = FluentValidatorConfig;

function range(
    minimum: any,
    maximum: any,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function range(
    minimum: any,
    maximum: any,
    validatorParameters: FluentRangeValidatorConfig): FluentValidatorBuilder;

function range(
    minimum: any, maximum: any,
    arg3?: string | null | FluentRangeValidatorConfig,
    arg4?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<DataTypeCheckConditionConfig>(arg3, arg4);
    return finishFluentValidatorBuilder(this,
        ConditionType.Range, _genCDRange(minimum, maximum),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentEqualToValueValidatorConfig = FluentEqualToValueConditionConfig & FluentValidatorConfig;


function equalToValue(
    secondValue: any,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function equalToValue(
    secondValue: any,
    validatorParameters: FluentEqualToValueValidatorConfig): FluentValidatorBuilder;

function equalToValue(
    secondValue: any,
    arg2?: FluentEqualToValueConditionConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<EqualToValueConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this, ConditionType.EqualToValue,
        _genDCEqualToValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentEqualToValidatorConfig = FluentEqualToConditionConfig & FluentValidatorConfig;

function equalTo(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function equalTo(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentEqualToValidatorConfig): FluentValidatorBuilder;
function equalTo(
    secondValueHostName: ValueHostName,
    args2?: FluentEqualToConditionConfig | string | null,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<EqualToConditionConfig>(args2, args3);
    
    return finishFluentValidatorBuilder(this,
        ConditionType.EqualTo, _genDCEqualTo(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentNotEqualToValueValidatorConfig = FluentNotEqualToValueConditionConfig & FluentValidatorConfig;

function notEqualToValue(
    secondValue: any,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function notEqualToValue(
    secondValue: any,
    validatorParameters: FluentNotEqualToValueValidatorConfig): FluentValidatorBuilder;    
function notEqualToValue(
    secondValue: any,
    args2?: FluentNotEqualToValueValidatorConfig | null | string,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<NotEqualToValueConditionConfig>(args2, args3);
    
    return finishFluentValidatorBuilder(this, ConditionType.NotEqualToValue,
        _genDCNotEqualToValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentNotEqualToValidatorConfig = FluentNotEqualToConditionConfig & FluentValidatorConfig;

function notEqualTo(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function notEqualTo(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentNotEqualToValidatorConfig): FluentValidatorBuilder;    
function notEqualTo(
    secondValueHostName: ValueHostName,
    args2?: FluentNotEqualToConditionConfig | string |null,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<NotEqualToConditionConfig>(args2, args3);
    return finishFluentValidatorBuilder(this,
        ConditionType.NotEqualTo, _genDCNotEqualTo(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentLessThanValueValidatorConfig = FluentLessThanValueConditionConfig & FluentValidatorConfig;

function lessThanValue(
    secondValue: any,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function lessThanValue(
    secondValue: any,
    validatorParameters: FluentLessThanValueValidatorConfig): FluentValidatorBuilder;    
function lessThanValue(
    secondValue: any,
    args2?: FluentLessThanValueValidatorConfig | string | null,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<LessThanValueConditionConfig>(args2, args3);
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanValue, _genDCLessThanValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentLessThanValidatorConfig = FluentLessThanConditionConfig & FluentValidatorConfig;

function lessThan(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function lessThan(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentLessThanValidatorConfig): FluentValidatorBuilder;    
function lessThan(
    secondValueHostName: ValueHostName,
    args2?: FluentLessThanValidatorConfig| string | null,
    args3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<LessThanConditionConfig>(args2, args3);
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThan, _genDCLessThan(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentLessThanOrEqualValueValidatorConfig = FluentLessThanOrEqualValueConditionConfig & FluentValidatorConfig;

function lessThanOrEqualValue(
    secondValue: any,
    errorMessage?: string | null, summaryMessage?: string | null): FluentValidatorBuilder;
function lessThanOrEqualValue(
    secondValue: any,
    validatorParameters: FluentLessThanOrEqualValueValidatorConfig): FluentValidatorBuilder;    
function lessThanOrEqualValue(
    secondValue: any,
    arg2?: FluentLessThanOrEqualValueValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<LessThanOrEqualValueConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanOrEqualValue, _genDCLessThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentLessThanOrEqualValidatorConfig = FluentLessThanOrEqualConditionConfig & FluentValidatorConfig;

function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentLessThanOrEqualValidatorConfig): FluentValidatorBuilder;
function lessThanOrEqual(
    secondValueHostName: ValueHostName,
    arg2?: FluentLessThanOrEqualValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<LessThanOrEqualConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.LessThanOrEqual, _genDCLessThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentGreaterThanValueValidatorConfig = FluentGreaterThanValueConditionConfig & FluentValidatorConfig;

function greaterThanValue(
    secondValue: any,
    arg2?: FluentGreaterThanValueValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<GreaterThanValueConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanValue, _genDCGreaterThanValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentGreaterThanValidatorConfig = FluentGreaterThanConditionConfig & FluentValidatorConfig;

function greaterThan(
    secondValueHostName: ValueHostName,
    arg2?: FluentGreaterThanValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<GreaterThanConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThan, _genDCGreaterThan(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentGreaterThanOrEqualValueValidatorConfig = FluentGreaterThanOrEqualValueConditionConfig & FluentValidatorConfig;

function greaterThanOrEqualValue(
    secondValue: any,
    arg2?: FluentGreaterThanOrEqualValueValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<GreaterThanOrEqualValueConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanOrEqualValue, _genDCGreaterThanOrEqualValue(secondValue, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentGreaterThanOrEqualValidatorConfig = FluentGreaterThanOrEqualConditionConfig & FluentValidatorConfig;

function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    validatorParameters: FluentGreaterThanOrEqualValidatorConfig): FluentValidatorBuilder;    
function greaterThanOrEqual(
    secondValueHostName: ValueHostName,
    arg2?: FluentGreaterThanOrEqualValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<GreaterThanOrEqualConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.GreaterThanOrEqual, _genDCGreaterThanOrEqual(secondValueHostName, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentStringLengthValidatorConfig = FluentValidatorConfig & FluentStringLengthConditionConfig;

function stringLength(
    maximum: number | null,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function stringLength(
    maximum: number | null,
    validatorParameters: FluentStringLengthValidatorConfig): FluentValidatorBuilder;
function stringLength(
    maximum: number | null,
    arg2?: FluentStringLengthValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<StringLengthConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.StringLength, _genDCStringLength(maximum, conditionConfig),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentAllMatchValidatorConfig = FluentValidatorConfig;

function all(
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function all(
    conditionsBuilder: FluentConditionBuilderHandler,
    validatorParameters?: FluentAllMatchValidatorConfig): FluentValidatorBuilder;
function all(
    conditionsBuilder: FluentConditionBuilderHandler,
    arg2?: FluentAllMatchValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<AllMatchConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.All, _genDCAll(conditionsBuilder),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentAnyMatchValidatorConfig = FluentValidatorConfig;

function any(
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function any(
    conditionsBuilder: FluentConditionBuilderHandler,
    validatorParameters?: FluentAnyMatchValidatorConfig): FluentValidatorBuilder;
function any(
    conditionsBuilder: FluentConditionBuilderHandler,
    arg2?: FluentAnyMatchValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<AnyMatchConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.Any, _genDCAny(conditionsBuilder),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentCountMatchesValidatorConfig = FluentValidatorConfig;

function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionBuilderHandler,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionBuilderHandler,
    validatorParameters?: FluentCountMatchesValidatorConfig): FluentValidatorBuilder;    
function countMatches(
    minimum: number | null,
    maximum: number | null,
    conditionsBuilder: FluentConditionBuilderHandler,
    arg4?: FluentCountMatchesValidatorConfig | string | null,
    arg5?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<CountMatchesConditionConfig>(arg4, arg5);
    return finishFluentValidatorBuilder(this,
        ConditionType.CountMatches, _genDCCountMatches(minimum, maximum, conditionsBuilder),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentPositiveValidatorConfig = FluentValidatorConfig;

function positive(
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function positive(
    validatorParameters: FluentPositiveValidatorConfig): FluentValidatorBuilder;
function positive(
    arg1?: FluentPositiveValidatorConfig | string | null,
    arg2?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<PositiveConditionConfig>(arg1, arg2);      
    return finishFluentValidatorBuilder(this,
        ConditionType.Positive, _genDCPositive(),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentIntegerValidatorConfig = FluentValidatorConfig;

function integer(
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function integer(
    validatorParameters: FluentIntegerValidatorConfig): FluentValidatorBuilder;
function integer(
    arg1?: FluentIntegerValidatorConfig | string | null,
    arg2?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<IntegerConditionConfig>(arg1, arg2);       
    return finishFluentValidatorBuilder(this,
        ConditionType.Integer, _genDCInteger(),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentMaxDecimalsValidatorConfig = FluentValidatorConfig;

function maxDecimals(
    maxDecimals: number,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function maxDecimals(
    maxDecimals: number,
    validatorParameters: FluentMaxDecimalsValidatorConfig): FluentValidatorBuilder;
function maxDecimals(
    maxDecimals: number,
    arg2?: FluentMaxDecimalsValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<MaxDecimalsConditionConfig>(arg2, arg3);      
    return finishFluentValidatorBuilder(this,
        ConditionType.MaxDecimals, _genDCMaxDecimals(maxDecimals),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentNotValidatorConfig = FluentValidatorConfig;

function not(
    childBuilder: FluentOneConditionBuilderHandler,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function not(
    childBuilder: FluentOneConditionBuilderHandler,
    validatorParameters: FluentNotValidatorConfig): FluentValidatorBuilder;
function not(
    childBuilder: FluentOneConditionBuilderHandler,
    arg2?: FluentNotValidatorConfig | string | null,
    arg3?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<NotConditionConfig>(arg2, arg3);
    return finishFluentValidatorBuilder(this,
        ConditionType.Not, _genDCNot(childBuilder),
        errorMessage, summaryMessage, validatorParameters);
}

export type FluentWhenValidatorConfig = FluentValidatorConfig;

function when(
    whenBuilder: FluentOneConditionBuilderHandler,
    thenBuilder: FluentOneConditionBuilderHandler,
    errorMessage?: string | null,
    summaryMessage?: string | null): FluentValidatorBuilder;
function when(
    whenBuilder: FluentOneConditionBuilderHandler,
    thenBuilder: FluentOneConditionBuilderHandler,
    validatorParameters?: FluentWhenValidatorConfig): FluentValidatorBuilder;    
function when(
    whenBuilder: FluentOneConditionBuilderHandler,
    thenBuilder: FluentOneConditionBuilderHandler,
    arg3?: FluentWhenValidatorConfig | string | null,
    arg4?: string | null): FluentValidatorBuilder {
    let { errorMessage, summaryMessage, conditionConfig, validatorParameters } =
        resolveValidatorOverloadArgs<WhenConditionConfig>(arg3, arg4);
    return finishFluentValidatorBuilder(this,
        ConditionType.When, _genDCWhen(whenBuilder, thenBuilder),
        errorMessage, summaryMessage, validatorParameters);
}