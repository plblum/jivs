/**
 * Implements a fluent syntax to chain together conditions quickly.
 * Each condition gets its own function that expects to have
 * 'this' as FluentValidationRule and return this for the next in the chain.
 * See @link ValueHosts/Fluent
 * @module Conditions/Fluent
 */

import { FluentConditionCollector, FluentCollectorBase, finishFluentConditionCollector } from "../ValueHosts/Fluent";
import { AllMatchConditionDescriptor, AnyMatchConditionDescriptor, CountMatchesConditionDescriptor, DataTypeCheckConditionDescriptor, EqualToConditionDescriptor, GreaterThanConditionDescriptor, GreaterThanOrEqualConditionDescriptor, LessThanConditionDescriptor, LessThanOrEqualConditionDescriptor, NotEqualToConditionDescriptor, NotNullConditionDescriptor, RangeConditionDescriptor, RegExpConditionDescriptor, RequiredTextConditionDescriptor, StringLengthConditionDescriptor, StringNotEmptyConditionDescriptor } from "./ConcreteConditions";
import { ConditionType } from "./ConditionTypes";
import { ValueHostName } from "../DataTypes/BasicTypes";
import { assertNotNull } from "../Utilities/ErrorHandling";

// How TypeScript merges functions with the FluentValidationRule class
declare module "./../ValueHosts/Fluent"
{
    export interface FluentConditionCollector {
        dataTypeCheck(): FluentCollectorBase;
        regExp(
            valueHostName: ValueHostName | null,
            expression: string, ignoreCase?: boolean | null,
            conditionDescriptor?: FluentRegExpConditionDescriptor): FluentCollectorBase;
        range(
            valueHostName: ValueHostName | null,
            minimum: any, maximum: any): FluentCollectorBase;
        equalToValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentEqualToValueConditionDescriptor): FluentCollectorBase;
        equalTo(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentEqualToConditionDescriptor): FluentCollectorBase;
        notEqualToValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentNotEqualToValueConditionDescriptor): FluentCollectorBase;
        notEqualTo(
            valueHostName: ValueHostName | null,
            secondValueHostName: string,
            conditionDescriptor?: FluentNotEqualToConditionDescriptor): FluentCollectorBase;
        lessThanValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentLessThanValueConditionDescriptor): FluentCollectorBase;
        lessThan(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanConditionDescriptor): FluentCollectorBase;
        lessThanOrEqualValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor): FluentCollectorBase;
        lessThanOrEqual(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor): FluentCollectorBase;
        greaterThanValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanValueConditionDescriptor): FluentCollectorBase;
        greaterThan(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanConditionDescriptor): FluentCollectorBase;
        greaterThanOrEqualValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor): FluentCollectorBase;
        greaterThanOrEqual(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor): FluentCollectorBase;
       
        stringLength(
            valueHostName: ValueHostName | null,
            maximum: number | null,
            conditionDescriptor?: FluentStringLengthConditionDescriptor | null): FluentCollectorBase;
        all(
            configChildren: FluentConditionCollector): FluentCollectorBase;
        any(
            configChildren: FluentConditionCollector): FluentCollectorBase;        
        countMatches(
            minimum: number | null, maximum: number | null,
            configChildren: FluentConditionCollector): FluentCollectorBase;
        stringNotEmpty(
            valueHostName: ValueHostName | null,
            conditionDescriptor?: FluentStringNotEmptyConditionDescriptor): FluentCollectorBase;        
        requiredText(
            valueHostName: ValueHostName | null,
            conditionDescriptor?: FluentRequiredTextConditionDescriptor): FluentCollectorBase;        
        notNull(valueHostName: ValueHostName | null): FluentCollectorBase;        
        
        
    //#region shorter names for some
        ltValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentLessThanValueConditionDescriptor): FluentCollectorBase;
        lt(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanConditionDescriptor): FluentCollectorBase;
        lteValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor): FluentCollectorBase;
        lte(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor): FluentCollectorBase;
        gtValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanValueConditionDescriptor): FluentCollectorBase;
        gt(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanConditionDescriptor): FluentCollectorBase;
        gteValue(
            valueHostName: ValueHostName | null,
            secondValue: any,
            conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor): FluentCollectorBase;
        gte(
            valueHostName: ValueHostName | null,
            secondValueHostName: ValueHostName,
            conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor): FluentCollectorBase;        
    //#endregion shorter names for some        
        
    }    
}

/**
 * Initialization code that is called by initFluent(), but safe to call repeatedly.
 * @remarks
 * Inside of a function to allow apps that don't use these fluent classes
 * to avoid any time setting up something not used.
 */
export function initFluentConditions(): void {
    if (typeof FluentConditionCollector.prototype.dataTypeCheck === 'function')
        return;
    // How JavaScript sees the functions added to the FluentConditionCollector class
    FluentConditionCollector.prototype.dataTypeCheck = dataTypeCheck;
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
    FluentConditionCollector.prototype.stringNotEmpty = stringNotEmpty;
    FluentConditionCollector.prototype.requiredText = requiredText;
    FluentConditionCollector.prototype.notNull = notNull;

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
 * Common code to setup DataTypeCheckConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDDataTypeCheck(): DataTypeCheckConditionDescriptor
{
    return {} as DataTypeCheckConditionDescriptor; 
}

function dataTypeCheck(): FluentCollectorBase {
// no ConditionDescriptor parameter because without type and valueHostName, it will always be empty    
    return finishFluentConditionCollector(this, ConditionType.DataTypeCheck, null, _genCDDataTypeCheck());
}

export type FluentRegExpConditionDescriptor = Omit<RegExpConditionDescriptor, 'type' | 'valueHostName' | 'expressionAsString' | 'expression' | 'ignoreCase'>;
/**
 * Common code to setup RegExpConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDRegExp(
    expression: RegExp | string | null, ignoreCase?: boolean | null,
    conditionDescriptor?: FluentRegExpConditionDescriptor | null): RegExpConditionDescriptor {
    let condDescriptor: RegExpConditionDescriptor = (conditionDescriptor ? { ...conditionDescriptor } : {}) as RegExpConditionDescriptor;
    if (expression != null)
        if (expression instanceof RegExp)
            condDescriptor.expression = expression;
        else 
        condDescriptor.expressionAsString = expression;
    if (ignoreCase != null)
        condDescriptor.ignoreCase = ignoreCase;
    return condDescriptor as RegExpConditionDescriptor;
}

function regExp(
    valueHostName: ValueHostName | null,
    expression: RegExp | string | null, ignoreCase?: boolean | null,
    conditionDescriptor?: FluentRegExpConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.RegExp, valueHostName, _genCDRegExp(expression, ignoreCase, conditionDescriptor));
}

/**
 * Common code to setup RangeConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genCDRange(
    minimum: any, maximum: any): RangeConditionDescriptor {
    let condDescriptor = {} as RangeConditionDescriptor;    
    if (minimum != null)
        condDescriptor.minimum = minimum;
    if (maximum != null)
        condDescriptor.maximum = maximum;
    return condDescriptor;
}

function range(
    valueHostName: ValueHostName | null,
    minimum: any, maximum: any): FluentCollectorBase {
// no ConditionDescriptor parameter because without type, valueHostName, minimum, and maximum, it will always be empty    

    return finishFluentConditionCollector(this,
        ConditionType.Range, valueHostName, _genCDRange(minimum, maximum));
}
export type FluentEqualToValueConditionDescriptor = Omit<EqualToConditionDescriptor, 'type' | 'valueHostName' | 'secondValue' | 'secondValueHostName'>;
/**
 * Common code to setup EqualToConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCEqualToValue(
    secondValue: any,
    conditionDescriptor?: FluentEqualToValueConditionDescriptor | null): EqualToConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as EqualToConditionDescriptor;    
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return condDescriptor;
}

function equalToValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentEqualToValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.EqualTo, valueHostName, _genDCEqualToValue(secondValue, conditionDescriptor));
}

export type FluentEqualToConditionDescriptor = Omit<EqualToConditionDescriptor, 'type' | 'valueHostName' | 'secondValue' | 'secondValueHostName' >
/**
 * Common code to setup EqualToConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCEqualTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentEqualToConditionDescriptor | null): EqualToConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as EqualToConditionDescriptor;    
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return condDescriptor;
}
function equalTo(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentEqualToConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.EqualTo, valueHostName, _genDCEqualTo(secondValueHostName, conditionDescriptor));
}

export type FluentNotEqualToValueConditionDescriptor = Omit<NotEqualToConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName'>;

/**
 * Common code to setup NotEqualToConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotEqualToValue(
    secondValue: any,
    conditionDescriptor?: FluentNotEqualToValueConditionDescriptor | null): NotEqualToConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as NotEqualToConditionDescriptor;    
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return condDescriptor;
}
function notEqualToValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentNotEqualToValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.NotEqualTo, valueHostName, _genDCNotEqualToValue(secondValue, conditionDescriptor));
}

export type FluentNotEqualToConditionDescriptor = Omit<NotEqualToConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' >

/**
 * Common code to setup NotEqualToConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotEqualTo(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentNotEqualToConditionDescriptor | null): NotEqualToConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as NotEqualToConditionDescriptor;    
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return condDescriptor;
}
function notEqualTo(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentNotEqualToConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.NotEqualTo, valueHostName, _genDCNotEqualTo(secondValueHostName, conditionDescriptor));
}

export type FluentLessThanValueConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 

/**
 * Common code to setup LessThanConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanValue(
    secondValue: any,
    conditionDescriptor?: FluentLessThanValueConditionDescriptor | null): LessThanConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as LessThanConditionDescriptor;    
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return condDescriptor;
}

function lessThanValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentLessThanValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.LessThan, valueHostName, _genDCLessThanValue(secondValue, conditionDescriptor));
}

export type FluentLessThanConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 

/**
 * Common code to setup LessThanConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanConditionDescriptor | null): LessThanConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as LessThanConditionDescriptor;    
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return condDescriptor;
}

function lessThan(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.LessThan, valueHostName, _genDCLessThan(secondValueHostName, conditionDescriptor));
}

export type FluentLessThanOrEqualValueConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 

/**
 * Common code to setup LessThanOrEqualConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqualValue(
    secondValue: any,
    conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor | null): LessThanOrEqualConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as LessThanOrEqualConditionDescriptor;        
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return condDescriptor;
}

function lessThanOrEqualValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentLessThanOrEqualValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanOrEqual, valueHostName, _genDCLessThanOrEqualValue(secondValue, conditionDescriptor));
}

export type FluentLessThanOrEqualConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 

/**
 * Common code to setup LessThanOrEqualConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCLessThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor | null): LessThanOrEqualConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as LessThanOrEqualConditionDescriptor;        
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return condDescriptor;
}

function lessThanOrEqual(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentLessThanOrEqualConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.LessThanOrEqual, valueHostName, _genDCLessThanOrEqual(secondValueHostName, conditionDescriptor));
}
export type FluentGreaterThanValueConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 
export type FluentGreaterThanConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 
export type FluentGreaterThanOrEqualValueConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 
export type FluentGreaterThanOrEqualConditionDescriptor = Omit<LessThanConditionDescriptor, 'type' | 'valueHostName' |  'secondValue' | 'secondValueHostName' > 

/**
 * Common code to setup GreaterThanConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanValue(
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanValueConditionDescriptor | null): GreaterThanConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as GreaterThanConditionDescriptor;    
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return condDescriptor;
}

function greaterThanValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThan, valueHostName, _genDCGreaterThanValue(secondValue, conditionDescriptor));
}

/**
 * Common code to setup GreaterThanConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThan(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanConditionDescriptor | null): GreaterThanConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as GreaterThanConditionDescriptor;    
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return  condDescriptor;
}


function greaterThan(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThan, valueHostName, _genDCGreaterThan(secondValueHostName, conditionDescriptor));
}

/**
 * Common code to setup GreaterThanOrEqualConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqualValue(
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor | null): GreaterThanOrEqualConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as GreaterThanOrEqualConditionDescriptor;    
    if (secondValue != null)
        condDescriptor.secondValue = secondValue;
    return  condDescriptor;
}

function greaterThanOrEqualValue(
    valueHostName: ValueHostName | null,
    secondValue: any,
    conditionDescriptor?: FluentGreaterThanOrEqualValueConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanOrEqual, valueHostName, _genDCGreaterThanOrEqualValue(secondValue, conditionDescriptor));
}

/**
 * Common code to setup GreaterThanOrEqualConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCGreaterThanOrEqual(
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor | null): GreaterThanOrEqualConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as GreaterThanOrEqualConditionDescriptor;    
    if (secondValueHostName != null)
        condDescriptor.secondValueHostName = secondValueHostName;
    return condDescriptor;
}

function greaterThanOrEqual(
    valueHostName: ValueHostName | null,
    secondValueHostName: ValueHostName,
    conditionDescriptor?: FluentGreaterThanOrEqualConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.GreaterThanOrEqual, valueHostName, _genDCGreaterThanOrEqual(secondValueHostName, conditionDescriptor));
}

export type FluentStringLengthConditionDescriptor = Omit<StringLengthConditionDescriptor, 'type' | 'valueHostName' | 'maximum'>;
/**
 * Common code to setup StringLengthConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCStringLength(
    maximum: number | null,
    conditionDescriptor?: FluentStringLengthConditionDescriptor | null): StringLengthConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor } : {}) as StringLengthConditionDescriptor;    
    if (maximum != null)
        condDescriptor.maximum = maximum;
    return condDescriptor;
}

function stringLength(
    valueHostName: ValueHostName | null,
    maximum: number | null,
    conditionDescriptor?: FluentStringLengthConditionDescriptor | null): FluentCollectorBase {
// no ConditionDescriptor parameter because without type, valueHostName, minimum and maximum, it will always be empty        
    return finishFluentConditionCollector(this,
        ConditionType.StringLength, valueHostName, _genDCStringLength(maximum, conditionDescriptor));
}
/**
 * Common code to setup AllMatchConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAll(
    configChildren: FluentConditionCollector): AllMatchConditionDescriptor {
    assertNotNull(configChildren, 'configChildren');
    return { conditionDescriptors: configChildren.descriptor.conditionDescriptors } as AllMatchConditionDescriptor;
}
function all(
    configChildren: FluentConditionCollector): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.All, null, _genDCAll(configChildren));
}

/**
 * Common code to setup AnyMatchConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCAny(
    configChildren: FluentConditionCollector): AnyMatchConditionDescriptor {
    assertNotNull(configChildren, 'configChildren');
    return { conditionDescriptors: configChildren.descriptor.conditionDescriptors } as AnyMatchConditionDescriptor;
}
function any(
    configChildren: FluentConditionCollector): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.Any, null, _genDCAny(configChildren));
}

/**
 * Common code to setup CountMatchesConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCCountMatches(
    minimum: number | null,
    maximum: number | null,
    configChildren: FluentConditionCollector): CountMatchesConditionDescriptor {
    assertNotNull(configChildren, 'configChildren');
    let condDescriptor: CountMatchesConditionDescriptor =
        { conditionDescriptors: configChildren.descriptor.conditionDescriptors } as CountMatchesConditionDescriptor;    
    if (minimum !== null)
        condDescriptor.minimum = minimum;
    if (maximum !== null)
        condDescriptor.maximum = maximum;
    return condDescriptor;
}
function countMatches(
    minimum: number | null,
    maximum: number | null,
    configChildren: FluentConditionCollector): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.CountMatches, null, _genDCCountMatches(minimum, maximum, configChildren));
}

export type FluentStringNotEmptyConditionDescriptor = Omit<StringNotEmptyConditionDescriptor, 'type' | 'valueHostName'>;
/**
 * Common code to setup StringNotEmptyConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCStringNotEmpty(
    conditionDescriptor?: FluentStringNotEmptyConditionDescriptor | null): StringNotEmptyConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as StringNotEmptyConditionDescriptor;    
    return condDescriptor;
}

function stringNotEmpty(
    valueHostName: ValueHostName | null,
    conditionDescriptor?: FluentStringNotEmptyConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.StringNotEmpty, valueHostName, _genDCStringNotEmpty(conditionDescriptor));
}
export type FluentRequiredTextConditionDescriptor = Omit<RequiredTextConditionDescriptor, 'type' | 'valueHostName'>;
/**
 * Common code to setup RequiredTextConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCRequiredText(
    conditionDescriptor?: FluentRequiredTextConditionDescriptor | null): RequiredTextConditionDescriptor {
    let condDescriptor = (conditionDescriptor ? { ...conditionDescriptor  } : {}) as RequiredTextConditionDescriptor;    
    return condDescriptor;
}
function requiredText(
    valueHostName: ValueHostName | null,
    conditionDescriptor?: FluentRequiredTextConditionDescriptor | null): FluentCollectorBase {
    return finishFluentConditionCollector(this,
        ConditionType.RequiredText, valueHostName, _genDCRequiredText(conditionDescriptor));
}

/**
 * Common code to setup NotNullConditionDescriptor for support within
 * FluentValidatorCollector and FluentConditionCollector fluent functions.
 * @internal
 */
export function _genDCNotNull(): NotNullConditionDescriptor {
    return {} as NotNullConditionDescriptor;
}

function notNull(valueHostName: ValueHostName | null): FluentCollectorBase {
    // no ConditionDescriptor parameter because without type and valueHostName, it will always be empty        

    return finishFluentConditionCollector(this,
        ConditionType.NotNull, valueHostName, _genDCNotNull());
}