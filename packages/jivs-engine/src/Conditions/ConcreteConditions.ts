/**
 * Concrete implementations of {@link Conditions/Types!ICondition | ICondition}, and their companion 
 * {@link Conditions/Types!ConditionDescriptor | ConditionDescriptor}.
 * 
 * The conditions found here all use an ConditionDescriptor for supplying 
 * their configuration. Most Condition classes have a specific interface
 * for their Descriptor, such as {@link RangeConditionDescriptor} for {@link RangeCondition}.
 * 
 * @module Conditions/ConcreteConditions
 */

import { ValueHostId } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError } from '../Utilities/ErrorHandling';

import type { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import {
    type ICondition,
    ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter, IEvaluateConditionDuringEdits
} from '../Interfaces/Conditions';
import { OneValueConditionDescriptor, OneValueConditionBase, TwoValueConditionDescriptor } from './OneValueConditionBase';
import { StringConditionDescriptor, StringConditionBase } from './StringConditionBase';
import { InputValueConditionBase } from './InputValueConditionBase';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { EvaluateChildConditionResultsBase, EvaluateChildConditionResultsDescriptor } from './EvaluateChildConditionResultsBase';
import { RegExpConditionBaseDescriptor, RegExpConditionBase } from './RegExpConditionBase';

import { ConditionType } from './ConditionTypes';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';


/**
 * ConditionDescriptor to use with {@link DataTypeCheckCondition}
 */
export interface DataTypeCheckConditionDescriptor extends OneValueConditionDescriptor {

}


/**
 * Determines if the value of InputValue can be successfully converted to its native data type.
 * Since the actual work of conversion occurs by the consuming system, this really just looks
 * at both values. When InputValue is not undefined while Value is undefined, it reports an error
 * as the converter could not get a valid value to store in the Value.
 * Supports these tokens:
 * {ConversionError} - Uses the value from IInputValueHost.GetConversionErrorMessage()
 */
export class DataTypeCheckCondition extends InputValueConditionBase<DataTypeCheckConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.DataTypeCheck; }
    
    protected evaluateInputValue(value: any, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        // value has already been proven to be something other than undefined...
        return valueHost.getValue() !== undefined ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }

    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            tokenLabel: 'ConversionError',
            associatedValue: valueHost.getConversionErrorMessage() ?? null,
            purpose: 'message'
        });

        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}

/**
 * Descriptor for RegExpCondition.
 */
export interface RegExpConditionDescriptor extends RegExpConditionBaseDescriptor {
    /**
     * Used either expressionAsString or expression for the expression.
     * When using expressionAsString, it is combined with IgnoreCase and Global to create
     * the regular expression.
     * Expressions must be compatible with JavaScript RegExp. Tests ignore captures and matches.
     * Expect RegExp.test() to evaluate.
     */
    expressionAsString?: string;
    /**
     * Used together with expressionAsString to set the case insensitive search option on the Regexp when true.
     * If undefined, it is treated as false.
     */
    ignoreCase?: boolean;
    /**
     * Used together with expressionAsString to set the global search option on the Regexp when true.
     * If undefined, it is treated as false.
     */
    global?: boolean;

    /**
     * Used together with expressionAsString to set the multiline option on the Regexp when true.
     * When used, ^ and $ match to newlines, not just start and end of the full string.
     * If undefined, it is treated as false.
     */
    multiline?: boolean;

    /**
     * Actual JavaScript Regular Expression object, complete with its flags.
     * It is an alternative to expressionAsString. If both are supplied, this takes precedence.
     */
    expression?: RegExp;

    /**
     * Use the expression to find something wrong with the string instead of proving it to be valid.
     * For example, if you want to tell the user "The period character is not allowed" and similar
     * for invalid characters, you could have separate Validators using a regexp to detect the illegal
     * character.
     * When true, a string that matches the expression
     * returns NoMatch instead of Match.
     * When undefined, the value is false.
     */
    not?: boolean;    
}

/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * This implementation has the user supply the regular expression through
 * RegExpConditionDescriptor.
 * Supports validateOptions.duringEdit = true so long as Descriptor.supportsDuringEdit
 * is true or undefined. In that case, 
 * it respects the Descriptor.trim property.
 */
export class RegExpCondition extends RegExpConditionBase<RegExpConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RegExp; }
    
    private _savedRE: RegExp | null = null; // cache the results. By design, any change to the Descriptor requires creating a new instance of the condition, discarding this

    protected getRegExp(services: IValidationServices): RegExp {
        if (!this._savedRE) {
            let re: RegExp | null = this.descriptor.expression ?? null;
            if (!re) {
                if (this.descriptor.expressionAsString) {
                    // this may throw an exception due to bad expression pattern
                    re = new RegExp(this.descriptor.expressionAsString,
                        (this.descriptor.ignoreCase ? 'i' : '') +
                        (this.descriptor.global ? 'g' : '') +
                        (this.descriptor.multiline ? 'm' : ''));
                }
                else
                    throw new CodingError('RegExpConditionDescriptor does not have a regular expression assigned to expression or ExpressionOrString properties.');
            }
            this._savedRE = re;
        }
        return this._savedRE;
    }
    protected evaluateString(text: string, valueHost: IValueHost, services: IValidationServices): ConditionEvaluateResult {
        let found = this.getRegExp(services).test(text);
        if (this.descriptor.not)
            found = !found;
        return found ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }    

}


/**
 * Descriptor for RangeCondition
 */
export interface RangeConditionDescriptor extends OneValueConditionDescriptor, SupportsDataTypeConverter {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like LessThanOrEqualToConditon.
     */
    minimum: any;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualToConditon.
     */
    maximum: any;
}

/**
 * Compare the native datatype value against two other values to ensure
 * it is with the range established. The minimum and maximum are included
 * in the range.
 * Supports these tokens: {Minimum} and {Maximum}
 * When data types differ or don't support GreaterThan/LessThan evaluate as Undetermined.
 * Supports Descriptor.ConversionLookupKey, but its only applied to the incoming value, not Min/Max.
 */
export class RangeCondition extends OneValueConditionBase<RangeConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Range; }
    
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value == null)  // includes undefined
            return ConditionEvaluateResult.Undetermined;

        let services = valueHostResolver.services;
        let lookupKey = this.descriptor.conversionLookupKey ?? valueHost.getDataType();
        let lower = this.descriptor.minimum != null ?  // null/undefined
            services.dataTypeComparerService.compare(this.descriptor.minimum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always valid
        if (lower === ComparersResult.Undetermined) {
            services.loggerService.log('Type mismatch. Value cannot be compared to Minimum',
                LoggingLevel.Warn, LoggingCategory.TypeMismatch, `RangeCondition for ${valueHost.getId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        let upper = this.descriptor.maximum != null ?  // null/undefined
            services.dataTypeComparerService.compare(this.descriptor.maximum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always value
        if (upper === ComparersResult.Undetermined) {
            services.loggerService.log('Type mismatch. Value cannot be compared to Maximum',
                LoggingLevel.Warn, LoggingCategory.TypeMismatch, `RangeCondition for ${valueHost.getId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        if (lower === ComparersResult.Equals || lower === ComparersResult.LessThan)
            if (upper === ComparersResult.Equals || upper === ComparersResult.GreaterThan)
                return ConditionEvaluateResult.Match;


        return ConditionEvaluateResult.NoMatch;
    }
    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            tokenLabel: 'Minimum',
            associatedValue: this.descriptor.minimum ?? null,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Maximum',
            associatedValue: this.descriptor.maximum ?? null,
            purpose: 'parameter'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}
/**
 * Descriptor for CompareToConditionBase.
 */
export interface CompareToConditionDescriptor extends TwoValueConditionDescriptor, SupportsDataTypeConverter {
    /**
     * Native data type representing the minimum of the range.
     */
    secondValue?: any;
    /**
     * Associated with secondValue/secondValueHostId only.
     * Assign to a LookupKey that is associated with a DataTypeConverter.
     * Use it to convert the value prior to comparing, to handle special cases like
     * case insensitive matching ("CaseInsensitive"), rounding a number to an integer ("Round"),
     * just the Day or Month or any other number in a Date object ("Day", "Month").
     */
    secondConversionLookupKey?: string | null;
}

/**
 * Compare the native datatype value against a second value.
 * The second value can be supplied in the Descriptor.Value property
 * or as another ValueHost identified in Descriptor.secondValueHostId.
 * Subclasses implement the actual comparison operator (equals, greater than, etc)
 * Supports tokens: {CompareTo}, the value from the second value host.
 */
export abstract class CompareToConditionBase<TDescriptor extends CompareToConditionDescriptor> extends OneValueConditionBase<TDescriptor>
{
    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value == null)  // null/undefined
            return ConditionEvaluateResult.Undetermined;
        let secondValue: any = undefined;
        let secondValueLookupKey: string | null = null;
        if (this.descriptor.secondValueHostId) {
            let vh2 = this.getValueHost(this.descriptor.secondValueHostId, valueHostResolver);
            if (!vh2) {
                const msg = 'secondValueHostId is unknown';
                this.logInvalidPropertyData('secondValueHostId', msg, valueHostResolver);
                throw new Error(msg);
            }
            secondValue = vh2.getValue();
            secondValueLookupKey = this.descriptor.secondConversionLookupKey ?? vh2.getDataType();
        }
        if (secondValue == null)  // null/undefined
        {
            if (this.descriptor.secondValue == null)    // null/undefined
            {
                const msg = 'secondValue lacks value to evaluate';
                this.logInvalidPropertyData('secondValue', msg, valueHostResolver);
                throw new Error(msg);
            }
            secondValue = this.descriptor.secondValue;
        }

        let comparison = valueHostResolver.services.dataTypeComparerService.compare(
            value, secondValue,
            this.descriptor.conversionLookupKey ?? valueHost.getDataType(), secondValueLookupKey);
        if (comparison === ComparersResult.Undetermined) {
            valueHostResolver.services.loggerService.log('Type mismatch. Value cannot be compared to secondValue',
                LoggingLevel.Warn, LoggingCategory.TypeMismatch, `${this.constructor.name} for ${valueHost.getId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        return this.compareTwoValues(comparison);
    }
    protected abstract compareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void {
        super.gatherValueHostIds(collection, valueHostResolver);
        if (this.descriptor.secondValueHostId)
            collection.add(this.descriptor.secondValueHostId);
    }

    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate
        let secondValue: any = undefined;
        if (this.descriptor.secondValueHostId) {
            let vh = this.getValueHost(this.descriptor.secondValueHostId, valueHostResolver);
            if (vh)
                secondValue = vh.getValue();
        }
        if (secondValue == null)  // includes undefined
        {
            secondValue = this.descriptor.secondValue;
        }
        list.push({
            tokenLabel: 'CompareTo',
            associatedValue: secondValue ?? null,
            purpose: 'value'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

/**
 * Two values must be equal. Values are native datatype.
 */
export class EqualToCondition extends CompareToConditionBase<EqualToConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.EqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        return comparison === ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}
/**
 * Descriptor for EqualToCondition
 */
export interface EqualToConditionDescriptor extends CompareToConditionDescriptor { }

/**
 * Two values must not be equal. Values are native datatype.
 */
export class NotEqualToCondition extends CompareToConditionBase<NotEqualToConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotEqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

        return comparison !== ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}

/**
 * Descriptor for NotEqualToCondition
 */
export interface NotEqualToConditionDescriptor extends CompareToConditionDescriptor { }
/**
 * Value 1 must be greater than Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanCondition extends CompareToConditionBase<GreaterThanConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThan; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.GreaterThan:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEquals:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * Descriptor for GreaterThanCondition
 */
export interface GreaterThanConditionDescriptor extends CompareToConditionDescriptor { }
/**
 * Value 1 must be less than Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanCondition extends CompareToConditionBase<LessThanConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThan; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.LessThan:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEquals:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * Descriptor for LessThanCondition
 */
export interface LessThanConditionDescriptor extends CompareToConditionDescriptor { }
/**
 * Value 1 must be greater than or equal Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanOrEqualToCondition extends CompareToConditionBase<GreaterThanOrEqualToConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThanOrEqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.GreaterThan:
            case ComparersResult.Equals:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEquals:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * Descriptor for GreaterThanOrEqualToCondition
 */
export interface GreaterThanOrEqualToConditionDescriptor extends CompareToConditionDescriptor { }
/**
 * Value 1 must be less than or equal Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanOrEqualToCondition extends CompareToConditionBase<LessThanOrEqualToConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanOrEqualTo; }    

    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        switch (comparison) {
            case ComparersResult.LessThan:
            case ComparersResult.Equals:
                return ConditionEvaluateResult.Match;
            case ComparersResult.NotEquals:
                return ConditionEvaluateResult.Undetermined;
            default:
                return ConditionEvaluateResult.NoMatch;
        }
    }
}

/**
 * Descriptor for LessThanOrEqualToCondition
 */
export interface LessThanOrEqualToConditionDescriptor extends CompareToConditionDescriptor { }
/**
 * Descriptor for StringLengthCondition
 */
export interface StringLengthConditionDescriptor extends StringConditionDescriptor {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like LessThanOrEqualToConditon.
     */
    minimum?: number | null;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualToConditon.
     */
    maximum?: number | null;
}

/**
 * Evaluates the length of a string in characters (after trimming if Trim is true).
 * Compares the result to non-null Minimum and/or Maximum parameters.
 * Supports these tokens: {Length}, {Minimum} and {Maximum}
 * Supports validateOptions.duringEdit = true so long as Descriptor.supportsDuringEdit
 * is true or undefined. In that case, 
 * it respects the Descriptor.trim property.
 */
export class StringLengthCondition extends StringConditionBase<StringLengthConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.StringLength; }
    
    protected evaluateString(text: string, valueHost: IValueHost, services: IValidationServices): ConditionEvaluateResult {
        let len = text.length;  // already trimmed
        return this.evaluateLength(len, valueHost);
    }
    private evaluateLength(len: number, valueHost: IValueHost): ConditionEvaluateResult
    {
        valueHost.saveIntoState('Len', len);
        if (this.descriptor.minimum != null)    // null/undefined
            if (len < this.descriptor.minimum)
                return ConditionEvaluateResult.NoMatch;
        if (this.descriptor.maximum != null)    // null/undefined
            if (len > this.descriptor.maximum)
                return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    public override getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            tokenLabel: 'Length',
            associatedValue: valueHost.getFromState('Len') ?? 0,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Minimum',
            associatedValue: this.descriptor.minimum ?? null,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Maximum',
            associatedValue: this.descriptor.maximum ?? null,
            purpose: 'parameter'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

export interface AllMatchConditionDescriptor extends EvaluateChildConditionResultsDescriptor
{
    
}

/**
 * All Children must evaluate as Match for a result of Match.
 * If any are still Undetermined after treatUndeterminedAs is applied, this results as Undetermined.
 * Any child that does not specify its Descriptor.valueHostId will have access to the ValueHost that
 * contains the InputValidator.
 */
export class AllMatchCondition extends EvaluateChildConditionResultsBase<AllMatchConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.And; }
    
    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostResolver))) {
                case ConditionEvaluateResult.NoMatch:
                    return ConditionEvaluateResult.NoMatch;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        return ConditionEvaluateResult.Match;
    }
}

export interface AnyMatchConditionDescriptor extends EvaluateChildConditionResultsDescriptor
{
    
}
/**
 * At least one Child Condition must evaluate as Match for a result of Match.
 * If any are still Undetermined after treatUndeterminedAs is applied, this results as Undetermined.
 * Any child that does not specify its Descriptor.valueHostId will have access to the ValueHost that
 * contains the InputValidator.
 */
export class AnyMatchCondition extends EvaluateChildConditionResultsBase<AnyMatchConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Or; }

    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostResolver))) {
                case ConditionEvaluateResult.Match:
                    countMatches++;
                    break;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        return countMatches > 0 ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
}

/**
 * ConditionDescriptor for CountMatchesCondition.
 */
export interface CountMatchesConditionDescriptor extends EvaluateChildConditionResultsDescriptor {
    /**
     * Must have at least this many matches. 0 or higher.
     * When undefined, the Minimum is 1.
     * 0 is supported, allowing for there to be 0 matches. However,
     * that is a special case. Its more likely the user wants to count
     * at least 1.
     */
    minimum?: number;
    /**
     * Must have no more than this many matches.
     * When undefined, there is no Maximum.
     */
    maximum?: number;
}

/**
 * Counts the number of child Conditions that evaluate as Match and determines if that count
 * is within a range of Descriptor.Minimum to Descriptor.Maximum.
 * When Minimum isn't supplied, it defaults to 1.
 * Any child that does not specify its Descriptor.valueHostId will have access to the ValueHost that
 * contains the InputValidator.
 */
export class CountMatchesCondition extends EvaluateChildConditionResultsBase<CountMatchesConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.CountMatches; }
    
    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostResolver))) {
                case ConditionEvaluateResult.Match:
                    countMatches++;
                    break;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        let minimum = this.descriptor.minimum ?? 1;
        if (minimum !== undefined && countMatches < minimum)
            return ConditionEvaluateResult.NoMatch;
        if (this.descriptor.maximum !== undefined && countMatches > this.descriptor.maximum)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }
}

/**
 * Descriptor for StringNotEmptyCondition.
 */
export interface StringNotEmptyConditionDescriptor extends OneValueConditionDescriptor {
/**
 * Normally a value of null is considered NoMatch so both an empty string and null are NoMatch.
 * When this is set, it determines the value.
 * If you want to consider null as valid, supply Match. If you don't want to evaluate null
 * at all, supply Undetermined.
 */    
    nullValueResult?: ConditionEvaluateResult;
}

/**
 * Base class to evaluate the Native Value when it is expected to contain a string.
 * Reports NoMatch when the value is an empty string ("").
 * No whitespace trimming is applied. The value of the InputValue may need trimming,
 * but the InputValue is expected to be the final value, already trimmed.
 * See also its InputValue companion, RequiredTextCondition.
 */
export abstract class StringNotEmptyConditionBase<TDescriptor extends StringNotEmptyConditionDescriptor>
    extends OneValueConditionBase<TDescriptor>
{

    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value === undefined) 
            return ConditionEvaluateResult.Undetermined;
        if (value === null)
            return this.descriptor.nullValueResult ?? ConditionEvaluateResult.NoMatch;

        if (typeof value !== 'string')
            return ConditionEvaluateResult.Undetermined;
        let text = value;
        if (text == '')
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }
}
/**
 * To evaluate the Native Value when it is expected to contain a string.
 * Reports NoMatch when the value is an empty string ("").
 * No whitespace trimming is applied. The value of the InputValue may need trimming,
 * but the InputValue is expected to be the final value, already trimmed.
 * See also its InputValue companion, RequiredTextCondition.
 */
export class StringNotEmptyCondition extends StringNotEmptyConditionBase<StringNotEmptyConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.StringNotEmpty; }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Required;
    }    
}

/**
 * Descriptor for RequiredTextCondition, which uses the InputValue
 */
export interface RequiredTextConditionDescriptor extends StringNotEmptyConditionDescriptor {
    /**
     * The value that means "nothing is assigned". This is often
     * known as a watermark or placeholder.
     * If assigned to anything other than '', '' is still considered unassigned.
     * So a value of "DEFAULT" matches to both "DEFAULT" and "".
     * When undefined, it means ''.
     * Only used with ValidateOption.DuringEdit = true as the string
     * comes from the Input value, which is actively being edited.
     * Your parser that moves data from Input to Native values is expected
     * to do its own trimming, leaving the DuringEdit = false no need to trim.
     */
    emptyValue?: string;

    /**
     * Removes leading and trailing whitespace before evaluating the string.
     * Only used with ValidateOption.DuringEdit = true as the string
     * comes from the Input value, which is actively being edited.
     * Your parser that moves data from Input to Native values is expected
     * to do its own trimming, leaving the DuringEdit = false no need to trim.
     */
    trim?: boolean;    
}

/**
 * For any input field/element whose native data is a string to determine if the required
 * rule has been met or not, based on the present of no whitespace in text and optionally
 * not null in native value.
 * It has two evaluation features:
 * - ICondition.evaluate() evaluates the native value. Its implementation comes from
 * StringNotEmptyCondition, which does not deal with trimming as that was expected during
 * conversion from input value to native value.
 * - IEvaluateConditionDuringEdits.evaluateDuringEdit() evaluates the input value as the user is
 * editing the input. It is invoked by InputValueHost.SetInputValue(option.DuringEdit = true)
 * and deals with both trimming and the possible default text (aka watermark) which you can set
 * in Descriptor.emptyValue.
 */
export class RequiredTextCondition extends StringNotEmptyConditionBase<RequiredTextConditionDescriptor>
    implements IEvaluateConditionDuringEdits
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RequiredText; }    

    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        if (this.descriptor.trim ?? true)
            text = text.trim();
        if (text == '' || text === this.descriptor.emptyValue)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }    
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Required;
    }    
}


/**
 * Descriptor for NotNullCondition.
 */
export interface NotNullConditionDescriptor extends OneValueConditionDescriptor {

}

/**
 * To evaluate the Native Value when it may contain a null,
 * and null is not valid in this case.
 * Reports NoMatch when the value is null.

 * See also StringNotEmptyCondition which includes checking for null in addition to the empty string.
 */
export class NotNullCondition extends OneValueConditionBase<NotNullConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotNull; }    

    public evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.getValue();
        if (value === undefined) 
            return ConditionEvaluateResult.Undetermined;
        if (value === null)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Required;
    }
}