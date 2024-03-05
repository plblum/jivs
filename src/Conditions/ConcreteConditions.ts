import { ValueHostId } from "../DataTypes/BasicTypes";
import { ComparersResult } from "./Comparers";
import { LoggingLevel, ConfigurationCategory } from "../Interfaces/Logger";
import type { ITokenLabelAndValue } from "../Interfaces/InputValidator";
import { CodingError } from "../Utilities/ErrorHandling";

import { type IValueHost } from "../Interfaces/ValueHost";
import { IValueHostResolver } from "../Interfaces/ValueHostResolver";
import {
    type ICondition,
    ConditionCategory, ConditionEvaluateResult
} from "../Interfaces/Conditions";
import { IOneValueConditionDescriptor, OneValueConditionBase, ITwoValueConditionDescriptor } from "./OneValueConditionBase";
import { IStringConditionDescriptor, StringConditionBase } from "./StringConditionBase";
import { WidgetConditionBase } from "./WidgetConditionBase";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { EvaluateChildConditionResultsBase, IEvaluateChildConditionResultsDescriptor } from "./EvaluateChildConditionResultsBase";
import { IRegExpConditionBaseDescriptor, RegExpConditionBase } from "./RegExpConditionBase";

/**
 * Concrete implementations of Conditions, and their companion ConditionDescriptors.
 * 
 * The conditions found here all use an IConditionDescriptor for supplying 
 * their configuration. Most Condition classes have a specific interface
 * for their Descriptor, such as IRangeConditionDescriptor for RangeCondition.
 */


export interface IDataTypeCheckConditionDescriptor extends IOneValueConditionDescriptor {

}

export const DataTypeCheckConditionType = 'DataTypeCheck';

/**
 * Determines if the value of WidgetValue can be successfully converted to its native data type.
 * Since the actual work of conversion occurs by the consuming system, this really just looks
 * at both values. When WidgetValue is not undefined while Value is undefined, it reports an error
 * as the converter could not get a valid value to store in the Value.
 * Supports these tokens:
 * {ConversionError} - Uses the value from IInputValueHost.GetConversionErrorMessage()
 */
export class DataTypeCheckCondition extends WidgetConditionBase<IDataTypeCheckConditionDescriptor>
{
    public static get DefaultConditionType(): string { return DataTypeCheckConditionType; }
    
    protected EvaluateWidgetValue(value: any, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        // value has already been proven to be something other than undefined...
        return valueHost.GetValue() !== undefined ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<ITokenLabelAndValue> {
        let list: Array<ITokenLabelAndValue> = [];
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
 * Descriptor for RequiredTextCondition, which uses the WidgetValue
 */
export interface IRequiredTextConditionDescriptor extends IStringConditionDescriptor {
    /**
     * The value that means nothing is assigned.
     * If anything other than '', '' is still considered unassigned.
     * So a value of "DEFAULT" matches to both "DEFAULT" and "".
     * When undefined, it means ''.
     */
    EmptyValue?: string;
}
export const RequiredTextConditionType = 'Required';

/**
 * For any widget whose native data is textual, including <select> elements,
 * which also have an index. That can be evaluated by RequiredIndexValidator
 */
export class RequiredTextCondition extends WidgetConditionBase<IRequiredTextConditionDescriptor>
{
    public static get DefaultConditionType(): string { return RequiredTextConditionType; }    

    protected EvaluateWidgetValue(value: any, valueHost: IInputValueHost,
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
export interface IRequiredIndexConditionDescriptor extends IOneValueConditionDescriptor {

    /**
     * The index that means nothing is selected.
     * Defaults to 0.
     */
    UnselectedIndexValue?: number;
}
export const RequiredIndexConditionType = 'RequiredIndex';

/**
 * For single selection lists to have a selected value. Values are expected 
 * to be an index.
 */
export class RequiredIndexCondition extends WidgetConditionBase<IRequiredIndexConditionDescriptor>
{
    public static get DefaultConditionType(): string { return RequiredIndexConditionType; }    

    protected EvaluateWidgetValue(value: any, valueHost: IInputValueHost,
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
export interface IRegExpConditionDescriptor extends IRegExpConditionBaseDescriptor {
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

export const RegExpConditionType = 'RegExp';
/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * This implementation has the user supply the regular expression through
 * IRegExpConditionDescriptor.
 */
export class RegExpCondition extends RegExpConditionBase<IRegExpConditionDescriptor>
{
    public static get DefaultConditionType(): string { return RegExpConditionType; }
    
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
export interface IRangeConditionDescriptor extends IOneValueConditionDescriptor {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like ValueLTESecondValueConditon.
     */
    Minimum: any;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like ValueGTESecondValueConditon.
     */
    Maximum: any;
}
export const RangeConditionType = 'Range';

/**
 * Compare the native datatype value against two other values to ensure
 * it is with the range established. The minimum and maximum are included
 * in the range.
 * Supports these tokens: {Minimum} and {Maximum}
 * When data types differ or don't support GreaterThan/LessThan evaluate as Undetermined.
 */
export class RangeCondition extends OneValueConditionBase<IRangeConditionDescriptor>
{
    public static get DefaultConditionType(): string { return RangeConditionType; }
    
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.GetValue();
        if (value == null)  // includes undefined
            return ConditionEvaluateResult.Undetermined;

        let services = valueHostResolver.Services;
        let lower = this.Descriptor.Minimum != null ?  // null/undefined
            services.DataTypeResolverService.CompareValues(this.Descriptor.Minimum, value, valueHost.GetDataType()) :
            ComparersResult.Equals; // always valid
        if (lower === ComparersResult.Undetermined) {
            services.LoggerService.Log(`Type mismatch. Value cannot be compared to Minimum`,
                LoggingLevel.Warn, ConfigurationCategory, `RangeCondition for ${valueHost.GetId()}`);
            return ConditionEvaluateResult.Undetermined;
        }
        let upper = this.Descriptor.Maximum != null ?  // null/undefined
            services.DataTypeResolverService.CompareValues(this.Descriptor.Maximum, value, valueHost.GetDataType()) :
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
    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<ITokenLabelAndValue> {
        let list: Array<ITokenLabelAndValue> = [];
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
export interface ICompareToConditionDescriptor extends ITwoValueConditionDescriptor {
    /**
     * Native data type representing the minimum of the range.
     */
    SecondValue?: any;

}
export const CompareToConditionType = 'Range';

/**
 * Compare the native datatype value against a second value.
 * The second value can be supplied in the Descriptor.Value property
 * or as another ValueHost identified in Descriptor.SecondValueHostId.
 * Subclasses implement the actual comparison operator (equals, greater than, etc)
 * Supports tokens: {CompareTo}, the value from the second value host.
 */
export abstract class CompareToConditionBase extends OneValueConditionBase<ICompareToConditionDescriptor>
{
    public Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult {
        valueHost = this.EnsurePrimaryValueHost(valueHost, valueHostResolver);
        let value = valueHost.GetValue();
        if (value == null)  // null/undefined
            return ConditionEvaluateResult.Undetermined;
        let secondValue: any;
        if (this.Descriptor.SecondValueHostId) {
            let vh = this.GetValueHost(this.Descriptor.SecondValueHostId, valueHostResolver);
            if (!vh) {
                const msg = 'SecondValueHostId is unknown';
                this.LogInvalidPropertyData('SecondValueHostId', msg, valueHostResolver);
                throw new Error(msg);
            }
            secondValue = vh.GetValue();
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

        let comparison = valueHostResolver.Services.DataTypeResolverService.CompareValues(value, secondValue, valueHost.GetDataType());
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

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<ITokenLabelAndValue> {
        let list: Array<ITokenLabelAndValue> = [];
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
export class ValuesEqualCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValuesEqualConditionType; }
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        return comparison === ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}
export const ValuesEqualConditionType = 'ValuesEqual';

/**
 * Two values must not be equal. Values are native datatype.
 */
export class ValuesNotEqualCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValuesNotEqualConditionType; }
    
    protected CompareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

        return comparison !== ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}
export const ValuesNotEqualConditionType = 'ValuesNotEqual';

/**
 * Value 1 must be greater than Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class ValueGTSecondValueCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValueGTSecondValueConditionType; }
    
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
export const ValueGTSecondValueConditionType = 'ValueGreaterThanSecondValue';

/**
 * Value 1 must be less than Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class ValueLTSecondValueCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValueLTSecondValueConditionType; }
    
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
export const ValueLTSecondValueConditionType = 'ValueLessThanSecondValue';

/**
 * Value 1 must be greater than or equal Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class ValueGTESecondValueCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValueGTESecondValueConditionType; }
    
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
export const ValueGTESecondValueConditionType = 'ValueGreaterThanOrEqualSecondValue';

/**
 * Value 1 must be less than or equal Value 2. Values are native datatype.
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class ValueLTESecondValueCondition extends CompareToConditionBase {
    public static get DefaultConditionType(): string { return ValueLTESecondValueConditionType; }    

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
export const ValueLTESecondValueConditionType = 'ValueLessThanOrEqualSecondValue';

/**
 * Descriptor for StringLengthCondition
 */
export interface IStringLengthConditionDescriptor extends IStringConditionDescriptor {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like ValueLTESecondValueConditon.
     */
    Minimum?: number | null;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like ValueGTESecondValueConditon.
     */
    Maximum?: number | null;
}
export const StringLengthConditionType = 'StringLength';

/**
 * Evaluates the length of a string in characters (after trimming if Trim is true).
 * Compares the result to non-null Minimum and/or Maximum parameters.
 * Supports these tokens: {Length}, {Minimum} and {Maximum}
 */
export class StringLengthCondition extends StringConditionBase<IStringLengthConditionDescriptor>
{
    public static get DefaultConditionType(): string { return StringLengthConditionType; }
    
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

    public override GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver): Array<ITokenLabelAndValue> {
        let list: Array<ITokenLabelAndValue> = [];
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

export interface IAndConditionsDescriptor extends IEvaluateChildConditionResultsDescriptor
{
    
}

/**
 * All Children must evaluate as Match for a result of Match.
 * If any are still Undetermined after TreatUndeterminedAs is applied, this results as Undetermined.
 */
export const AndConditionsType = 'And';
export const EveryConditionType = 'Every';  // alias for AndConditions; for users who don't deal well with boolean logic can relate
export class AndConditions extends EvaluateChildConditionResultsBase<IAndConditionsDescriptor>
{
    public static get DefaultConditionType(): string { return AndConditionsType; }
    
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

export interface IOrConditionsDescriptor extends IEvaluateChildConditionResultsDescriptor
{
    
}
/**
 * At least one Child Condition must evaluate as Match for a result of Match.
 * If any are still Undetermined after TreatUndeterminedAs is applied, this results as Undetermined.
 */
export const OrConditionsType = 'Or';
export const AnyConditionsType = 'Any'; // alias for OrConditions; for users who don't deal well with boolean logic can relate
export class OrConditions extends EvaluateChildConditionResultsBase<IOrConditionsDescriptor>
{
    public static get DefaultConditionType(): string { return OrConditionsType; }

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
 * ConditionDescriptor for CountMatchingConditions.
 */
export interface ICountMatchingConditionsDescriptor extends IEvaluateChildConditionResultsDescriptor {
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

export const CountMatchingConditionsType = "CountMatches";

/**
 * Counts the number of child Conditions that evaluate as Match and determines if that count
 * is within a range of Descriptor.Minimum to Descriptor.Maximum.
 * When Minimum isn't supplied, it defaults to 1.
 */
export class CountMatchingConditions extends EvaluateChildConditionResultsBase<ICountMatchingConditionsDescriptor>
{
    public static get DefaultConditionType(): string { return CountMatchingConditionsType; }
    
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