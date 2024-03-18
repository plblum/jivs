/**
 * Concrete implementations of {@link Conditions/Interfaces!ICondition | ICondition}, and their companion 
 * {@link Conditions/Interfaces!ConditionDescriptor | ConditionDescriptor}.
 * 
 * The conditions found here all use an ConditionDescriptor for supplying 
 * their configuration. Most Condition classes have a specific interface
 * for their Descriptor, such as {@link RangeConditionDescriptor} for {@link RangeCondition}.
 * 
 * @module Conditions/ConcreteConditions
 */

import { ValueHostId } from "../DataTypes/BasicTypes";
import { LoggingLevel, ConfigurationCategory } from "../Interfaces/Logger";
import type { TokenLabelAndValue } from "../Interfaces/InputValidator";
import { CodingError } from "../Utilities/ErrorHandling";

import { type IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import {
    type ICondition,
    ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter
} from "../Interfaces/Conditions";
import { OneValueConditionDescriptor, OneValueConditionBase, TwoValueConditionDescriptor } from "./OneValueConditionBase";
import { StringConditionDescriptor, StringConditionBase } from "./StringConditionBase";
import { InputValueConditionBase } from "./InputValueConditionBase";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { EvaluateChildConditionResultsBase, EvaluateChildConditionResultsDescriptor } from "./EvaluateChildConditionResultsBase";
import { RegExpConditionBaseDescriptor, RegExpConditionBase } from "./RegExpConditionBase";
import { ComparersResult } from "../Interfaces/DataTypes";
import { ConditionType } from "./ConditionTypes";


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
    
    protected EvaluateInputValue(value: any, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        // value has already been proven to be something other than undefined...
        return valueHost.GetValue() !== undefined ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.GetValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            TokenLabel: 'ConversionError',
            AssociatedValue: valueHost.GetConversionErrorMessage() ?? null,
            Purpose: 'message'
        });

        return list;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}

/**
 * Descriptor for RequiredTextCondition, which uses the InputValue
 */
export interface RequiredTextConditionDescriptor extends StringConditionDescriptor {
    /**
     * The value that means nothing is assigned.
     * If anything other than '', '' is still considered unassigned.
     * So a value of "DEFAULT" matches to both "DEFAULT" and "".
     * When undefined, it means ''.
     */
    EmptyValue?: string;
}

/**
 * For any input field/element whose native data is textual, including HTML's <select> elements,
 * which also have an index. That can be evaluated by RequiredIndexValidator
 */
export class RequiredTextCondition extends InputValueConditionBase<RequiredTextConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RequiredText; }    

    protected EvaluateInputValue(value: any, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        // value of undefined has been rejected already, but still need to be sure we have a string
        if (typeof value !== 'string')
            return ConditionEvaluateResult.Undetermined;
        let text = value;
        if (this.Descriptor.Trim ?? true)
            text = text.trim();
        if (text == '' || text === this.Descriptor.EmptyValue)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Required;
    }
}

/**
 * Descriptor for RequiredIndexCondition
 */
export interface RequiredIndexConditionDescriptor extends OneValueConditionDescriptor {

    /**
     * The index that means nothing is selected.
     * Defaults to 0.
     */
    UnselectedIndexValue?: number;
}

/**
 * For single selection lists to have a selected value. Values are expected 
 * to be an index.
 */
export class RequiredIndexCondition extends InputValueConditionBase<RequiredIndexConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RequiredIndex; }    

    protected EvaluateInputValue(value: any, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        // value of undefined has been rejected already, but still need to be sure we have a number
        if (typeof value !== 'number')
            return ConditionEvaluateResult.Undetermined;
        let unselected = this.Descriptor.UnselectedIndexValue ?? 0;
        return value === unselected ? ConditionEvaluateResult.NoMatch : ConditionEvaluateResult.Match;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Required;
    }
}

/**
 * Descriptor for RegExpCondition.
 */
export interface RegExpConditionDescriptor extends RegExpConditionBaseDescriptor {
    /**
     * Used either ExpressionAsString or Expression for the expression.
     * When using ExpressionAsString, it is combined with IgnoreCase and Global to create
     * the regular expression.
     * Expressions must be compatible with JavaScript RegExp. Tests ignore captures and matches.
     * Expect RegExp.test() to evaluate.
     */
    ExpressionAsString?: string;
    /**
     * Used together with ExpressionAsString to set the case insensitive search option on the Regexp when true.
     * If undefined, it is treated as false.
     */
    IgnoreCase?: boolean;
    /**
     * Used together with ExpressionAsString to set the global search option on the Regexp when true.
     * If undefined, it is treated as false.
     */
    Global?: boolean;

    /**
     * Used together with ExpressionAsString to set the multiline option on the Regexp when true.
     * When used, ^ and $ match to newlines, not just start and end of the full string.
     * If undefined, it is treated as false.
     */
    Multiline?: boolean;

    /**
     * Actual JavaScript Regular Expression object, complete with its flags.
     * It is an alternative to ExpressionAsString. If both are supplied, this takes precedence.
     */
    Expression?: RegExp;
}

/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * This implementation has the user supply the regular expression through
 * RegExpConditionDescriptor.
 */
export class RegExpCondition extends RegExpConditionBase<RegExpConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RegExp; }
    
    private _savedRE: RegExp | null = null; // cache the results. By design, any change to the Descriptor requires creating a new instance of the condition, discarding this

    protected GetRegExp(valueHostResolver: IValueHostResolver): RegExp {
        if (!this._savedRE) {
            let re: RegExp | null = this.Descriptor.Expression ?? null;
            if (!re) {
                if (this.Descriptor.ExpressionAsString) {
                    // this may throw an exception due to bad expression pattern
                    re = new RegExp(this.Descriptor.ExpressionAsString,
                        (this.Descriptor.IgnoreCase ? 'i' : '') +
                        (this.Descriptor.Global ? 'g' : '') +
                        (this.Descriptor.Multiline ? 'm' : ''));
                }
                else
                    throw new CodingError('RegExpConditionDescriptor does not have a regular expression assigned to Expression or ExpressionOrString properties.')
            }
            this._savedRE = re;
        }
        return this._savedRE;
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
    Minimum: any;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualToConditon.
     */
    Maximum: any;
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
    
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.GetValue();
        if (value == null)  // includes undefined
            return ConditionEvaluateResult.Undetermined;

        let services = valueHostResolver.Services;
        let lookupKey = this.Descriptor.ConversionLookupKey ?? valueHost.GetDataType();
        let lower = this.Descriptor.Minimum != null ?  // null/undefined
            services.DataTypeServices.CompareValues(this.Descriptor.Minimum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always valid
        if (lower === ComparersResult.Undetermined) {
            services.LoggerService.Log(`Type mismatch. Value cannot be compared to Minimum`,
                LoggingLevel.Warn, ConfigurationCategory, `RangeCondition for ${valueHost.GetId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        let upper = this.Descriptor.Maximum != null ?  // null/undefined
            services.DataTypeServices.CompareValues(this.Descriptor.Maximum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always value
        if (upper === ComparersResult.Undetermined) {
            services.LoggerService.Log(`Type mismatch. Value cannot be compared to Maximum`,
                LoggingLevel.Warn, ConfigurationCategory, `RangeCondition for ${valueHost.GetId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        if (lower === ComparersResult.Equals || lower === ComparersResult.LessThan)
            if (upper === ComparersResult.Equals || upper === ComparersResult.GreaterThan)
                return ConditionEvaluateResult.Match;


        return ConditionEvaluateResult.NoMatch;
    }
    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.GetValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            TokenLabel: 'Minimum',
            AssociatedValue: this.Descriptor.Minimum ?? null,
            Purpose: 'parameter'
        });
        list.push({
            TokenLabel: 'Maximum',
            AssociatedValue: this.Descriptor.Maximum ?? null,
            Purpose: 'parameter'
        });
        return list;
    }
    protected get DefaultCategory(): ConditionCategory {
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
    SecondValue?: any;
    /**
     * Associated with SecondValue/SecondValueHostId only.
     * Assign to a LookupKey that is associated with a DataTypeConverter.
     * Use it to convert the value prior to comparing, to handle special cases like
     * case insensitive matching ("CaseInsensitive"), rounding a number to an integer ("Round"),
     * just the Day or Month or any other number in a Date object ("Day", "Month").
     */
    SecondConversionLookupKey?: string | null;
}

/**
 * Compare the native datatype value against a second value.
 * The second value can be supplied in the Descriptor.Value property
 * or as another ValueHost identified in Descriptor.SecondValueHostId.
 * Subclasses implement the actual comparison operator (equals, greater than, etc)
 * Supports tokens: {CompareTo}, the value from the second value host.
 */
export abstract class CompareToConditionBase<TDescriptor extends CompareToConditionDescriptor> extends OneValueConditionBase<TDescriptor>
{
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.GetValue();
        if (value == null)  // null/undefined
            return ConditionEvaluateResult.Undetermined;
        let secondValue: any;
        let secondValueLookupKey: string | null = null;
        if (this.Descriptor.SecondValueHostId) {
            let vh2 = this.GetValueHost(this.Descriptor.SecondValueHostId, valueHostResolver);
            if (!vh2) {
                const msg = 'SecondValueHostId is unknown';
                this.LogInvalidPropertyData('SecondValueHostId', msg, valueHostResolver);
                throw new Error(msg);
            }
            secondValue = vh2.GetValue();
            secondValueLookupKey = this.Descriptor.SecondConversionLookupKey ?? vh2.GetDataType();
        }
        if (secondValue == null)  // null/undefined
        {
            if (this.Descriptor.SecondValue == null)    // null/undefined
            {
                const msg = 'SecondValue lacks value to evaluate';
                this.LogInvalidPropertyData('SecondValue', msg, valueHostResolver);
                throw new Error(msg);
            }
            secondValue = this.Descriptor.SecondValue;
        }

        let comparison = valueHostResolver.Services.DataTypeServices.CompareValues(
            value, secondValue,
            this.Descriptor.ConversionLookupKey ?? valueHost.GetDataType(), secondValueLookupKey);
        if (comparison === ComparersResult.Undetermined) {
            valueHostResolver.Services.LoggerService.Log(`Type mismatch. Value cannot be compared to SecondValue`,
                LoggingLevel.Warn, ConfigurationCategory, `${this.constructor.name} for ${valueHost.GetId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        return this.CompareTwoValues(comparison);
    }
    protected abstract CompareTwoValues(comparison: ComparersResult):
        ConditionEvaluateResult;

    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void {
        super.GatherValueHostIds(collection, valueHostResolver);
        if (this.Descriptor.SecondValueHostId)
            collection.add(this.Descriptor.SecondValueHostId);
    }

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.GetValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate
        let secondValue: any;
        if (this.Descriptor.SecondValueHostId) {
            let vh = this.GetValueHost(this.Descriptor.SecondValueHostId, valueHostResolver);
            if (vh)
                secondValue = vh.GetValue();
        }
        if (secondValue == null)  // includes undefined
        {
            secondValue = this.Descriptor.SecondValue;
        }
        list.push({
            TokenLabel: 'CompareTo',
            AssociatedValue: secondValue ?? null,
            Purpose: 'value'
        })
        return list;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

/**
 * Two values must be equal. Values are native datatype.
 */
export class EqualToCondition extends CompareToConditionBase<EqualToConditionDescriptor> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.EqualTo; }
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
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
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

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
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
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
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
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
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
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

    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
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
    Minimum?: number | null;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualToConditon.
     */
    Maximum?: number | null;
}

/**
 * Evaluates the length of a string in characters (after trimming if Trim is true).
 * Compares the result to non-null Minimum and/or Maximum parameters.
 * Supports these tokens: {Length}, {Minimum} and {Maximum}
 */
export class StringLengthCondition extends StringConditionBase<StringLengthConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.StringLength; }
    
    protected EvaluateString(text: string, valueHost: IValueHost, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let len = text.length;  // already trimmed
        valueHost.SaveIntoState('Len', len);
        if (this.Descriptor.Minimum != null)    // null/undefined
            if (len < this.Descriptor.Minimum)
                return ConditionEvaluateResult.NoMatch;
        if (this.Descriptor.Maximum != null)    // null/undefined
            if (len > this.Descriptor.Maximum)
                return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.GetValuesForTokens(valueHost, valueHostResolver));
        // same order of precidence as in Evaluate

        list.push({
            TokenLabel: 'Length',
            AssociatedValue: valueHost.GetFromState('Len') ?? 0,
            Purpose: 'parameter'
        });
        list.push({
            TokenLabel: 'Minimum',
            AssociatedValue: this.Descriptor.Minimum ?? null,
            Purpose: 'parameter'
        });
        list.push({
            TokenLabel: 'Maximum',
            AssociatedValue: this.Descriptor.Maximum ?? null,
            Purpose: 'parameter'
        });
        return list;
    }
    protected get DefaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}

export interface AllMatchConditionDescriptor extends EvaluateChildConditionResultsDescriptor
{
    
}

/**
 * All Children must evaluate as Match for a result of Match.
 * If any are still Undetermined after TreatUndeterminedAs is applied, this results as Undetermined.
 */
export class AllMatchCondition extends EvaluateChildConditionResultsBase<AllMatchConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.And; }
    
    protected EvaluateChildren(conditions: ICondition[], valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        for (let condition of conditions)
            switch (this.CleanupChildResult(condition.Evaluate(null, valueHostResolver))) {
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
 * If any are still Undetermined after TreatUndeterminedAs is applied, this results as Undetermined.
 */
export class AnyMatchCondition extends EvaluateChildConditionResultsBase<AnyMatchConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Or; }

    protected EvaluateChildren(conditions: ICondition[], valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.CleanupChildResult(condition.Evaluate(null, valueHostResolver))) {
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
    Minimum?: number;
    /**
     * Must have no more than this many matches.
     * When undefined, there is no Maximum.
     */
    Maximum?: number;
}

/**
 * Counts the number of child Conditions that evaluate as Match and determines if that count
 * is within a range of Descriptor.Minimum to Descriptor.Maximum.
 * When Minimum isn't supplied, it defaults to 1.
 */
export class CountMatchesCondition extends EvaluateChildConditionResultsBase<CountMatchesConditionDescriptor>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.CountMatches; }
    
    protected EvaluateChildren(conditions: ICondition[], valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.CleanupChildResult(condition.Evaluate(null, valueHostResolver))) {
                case ConditionEvaluateResult.Match:
                    countMatches++;
                    break;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        let minimum = this.Descriptor.Minimum ?? 1;
        if (minimum !== undefined && countMatches < minimum)
            return ConditionEvaluateResult.NoMatch;
        if (this.Descriptor.Maximum !== undefined && countMatches > this.Descriptor.Maximum)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }
}