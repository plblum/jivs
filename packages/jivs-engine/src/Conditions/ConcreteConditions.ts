/**
 * Concrete implementations of {@link Conditions/Types!ICondition | ICondition}, and their companion 
 * {@link Conditions/Types!ConditionConfig | ConditionConfig}.
 * 
 * The conditions found here all use an ConditionConfig for supplying 
 * their configuration. Most Condition classes have a specific interface
 * for their Config, such as {@link RangeConditionConfig} for {@link RangeCondition}.
 * 
 * @module Conditions/ConcreteConditions
 */

import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';

import { type IValueHost } from '../Interfaces/ValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import {
    type ICondition,
    ConditionCategory, ConditionEvaluateResult, SupportsDataTypeConverter, IEvaluateConditionDuringEdits
} from '../Interfaces/Conditions';
import { OneValueConditionBaseConfig, OneValueConditionBase } from './OneValueConditionBase';
import { StringConditionBaseConfig, StringConditionBase } from './StringConditionBase';
import { InputValueConditionBase, InputValueConditionBaseConfig } from './InputValueConditionBase';
import { EvaluateChildConditionResultsBase, EvaluateChildConditionResultsBaseConfig } from './EvaluateChildConditionResultsBase';
import { RegExpConditionBaseConfig, RegExpConditionBase } from './RegExpConditionBase';

import { ConditionType } from './ConditionTypes';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { ComparersResult } from '../Interfaces/DataTypeComparerService';
import { TokenLabelAndValue } from '../Interfaces/MessageTokenSource';
import { IInputValueHost } from '../Interfaces/InputValueHost';
import { CompareToSecondValueHostConditionBase, CompareToSecondValueHostConditionBaseConfig } from './CompareToSecondValueHostConditionBase';
import { CompareToValueConditionBase, CompareToValueConditionBaseConfig } from './CompareToValueConditionBase';
import { IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { toIInputValueHost } from '../ValueHosts/InputValueHost';
import { NumberConditionBase, NumberConditionBaseConfig } from './NumberConditionBase';
import { ConditionWithOneChildBase, ConditionWithOneChildBaseConfig } from './ConditionWithOneChildBase';


/**
 * ConditionConfig for {@link DataTypeCheckCondition}
 */
export interface DataTypeCheckConditionConfig extends InputValueConditionBaseConfig {

}


/**
 * Determines if the value of InputValue can be successfully converted to its native data type.
 * Since the actual work of conversion occurs by the consuming system, this really just looks
 * at both values. When InputValue is not undefined while Value is undefined, it reports an error
 * as the converter could not get a valid value to store in the Value.
 * Supports these tokens:
 * {ConversionError} - Uses the value from IInputValueHost.getConversionErrorMessage()
 */
export class DataTypeCheckCondition extends InputValueConditionBase<DataTypeCheckConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.DataTypeCheck; }
    
    protected evaluateInputValue(value: any, valueHost: IInputValueHost,
        valueHostsManager: IValueHostsManager): ConditionEvaluateResult {
        // value has already been proven to be something other than undefined...
        return valueHost.getValue() !== undefined ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }

    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        // same order of precidence as in Evaluate
        let ivh = toIInputValueHost(valueHost);
        if (ivh)
            list.push({
                tokenLabel: 'ConversionError',
                associatedValue: ivh.getConversionErrorMessage() ?? null,
                purpose: 'message'
            });

        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}

/**
 * ConditionConfig for {@link RequireTextCondition}
 */
export interface RequireTextConditionConfig extends OneValueConditionBaseConfig {
    /**
     * Removes leading and trailing whitespace before evaluating the string.
     * Only used with ValidateOption.DuringEdit = true as the string
     * comes from the Input value, which is actively being edited.
     * Your parser that moves data from Input to Native values is expected
     * to do its own trimming, leaving the DuringEdit = false no need to trim.
     */
    trim?: boolean;    

    /**
     * Normally a value of null is considered NoMatch so both an empty string and null are NoMatch.
     * When this is set, it determines the value.
     * If you want to consider null as valid, supply Match. If you don't want to evaluate null
     * at all, supply Undetermined.
     */    
    nullValueResult?: ConditionEvaluateResult;    
}

/**
 * For any input field/element whose native data is a string to determine if the required
 * rule has been met or not, optionally require the absence of surrounding whitespace and optionally
 * not null in native value.
 * It has two evaluation features:
 * - ICondition.evaluate() evaluates the native value. It ignores the trim property.
 * - IEvaluateConditionDuringEdits.evaluateDuringEdit() evaluates the input value as the user is
 * editing the input. It is invoked by InputValueHost.setInputValue(option.DuringEdit = true)
 * and supports the trim property.
 */
export class RequireTextCondition extends OneValueConditionBase<RequireTextConditionConfig>
    implements IEvaluateConditionDuringEdits
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.RequireText; }    

    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();
        if (value === undefined) 
            return ConditionEvaluateResult.Undetermined;
        if (value === null)
            return this.config.nullValueResult ?? ConditionEvaluateResult.NoMatch;

        if (typeof value !== 'string')
            return ConditionEvaluateResult.Undetermined;
        let text = value;
        if (text == '')
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    public evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult {
        if (this.config.trim ?? true)
            text = text.trim();
        if (text == '')
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }    
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Require;
    }    
}


/**
 * ConditionConfig for {@link NotNullCondition}
 */
export interface NotNullConditionConfig extends OneValueConditionBaseConfig {

}

/**
 * To evaluate the Native Value when it may contain a null,
 * and null is not valid in this case.
 * Reports NoMatch when the value is null.

 * See also RequireTextCondition which includes checking for null in addition to the empty string.
 */
export class NotNullCondition extends OneValueConditionBase<NotNullConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotNull; }    

    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();
        if (value === undefined) 
            return ConditionEvaluateResult.Undetermined;
        if (value === null)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Require;
    }
}

/**
 * ConditionConfig for {@link RegExpCondition}
 */
export interface RegExpConditionConfig extends RegExpConditionBaseConfig {
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
}

/**
 * Evaluates the native value, which must be a string, against a regular expression.
 * This implementation has the user supply the regular expression through
 * RegExpConditionConfig.
 * 
 * Supports validateOptions.duringEdit = true so long as Config.supportsDuringEdit
 * is true or undefined.
 */
export class RegExpCondition extends RegExpConditionBase<RegExpConditionConfig>
{
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        this._savedRE = undefined!;
    }        
    public static get DefaultConditionType(): ConditionType { return ConditionType.RegExp; }
    
    private _savedRE: RegExp | null = null; // cache the results. By design, any change to the Config requires creating a new instance of the condition, discarding this

    protected getRegExp(services: IValidationServices): RegExp {
        if (!this._savedRE) {
            let re: RegExp | null = this.config.expression ?? null;
            if (!re) {
                if (this.config.expressionAsString) {
                    // this may throw an exception due to bad expression pattern
                    re = new RegExp(this.config.expressionAsString,
                        (this.config.ignoreCase ? 'i' : '') +
                        (this.config.multiline ? 'm' : ''));
                }
                else
                    throw new CodingError('RegExpConditionConfig does not have a regular expression assigned to expression or ExpressionOrString properties.');
            }
            this._savedRE = re;
        }
        return this._savedRE;
    }
    protected evaluateString(text: string, valueHost: IValueHost, services: IValidationServices): ConditionEvaluateResult {
        let found = this.getRegExp(services).test(text);
        return found ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }    

}


/**
 * ConditionConfig for {@link RangeCondition}
 */
export interface RangeConditionConfig extends OneValueConditionBaseConfig, SupportsDataTypeConverter {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like LessThanOrEqualConditon.
     */
    minimum: any;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualConditon.
     */
    maximum: any;
}

/**
 * Compare the native datatype value against two other values to ensure
 * it is with the range established. The minimum and maximum are included
 * in the range.
 * 
 * Supports these tokens: {Minimum} and {Maximum}
 * 
 * When data types differ or don't support GreaterThan/LessThan evaluate as Undetermined.
 * Supports Config.conversionLookupKey, but its only applied to the incoming value, not Min/Max.
 */
export class RangeCondition extends OneValueConditionBase<RangeConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Range; }
    
    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        valueHost = this.ensurePrimaryValueHost(valueHost, valueHostsManager);
        let value = valueHost.getValue();
        if (value == null)  // includes undefined
            return ConditionEvaluateResult.Undetermined;

        let services = valueHostsManager.services;
        let lookupKey = this.config.conversionLookupKey ?? valueHost.getDataType();
        let lower = this.config.minimum != null ?  // null/undefined
            services.dataTypeComparerService.compare(this.config.minimum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always valid
        if (lower === ComparersResult.Undetermined) {
            this.logTypeMismatch(services, 'Value', 'Minimum', value, lower);

            return ConditionEvaluateResult.Undetermined;
        }
        let upper = this.config.maximum != null ?  // null/undefined
            services.dataTypeComparerService.compare(this.config.maximum, value,
                null, lookupKey) :
            ComparersResult.Equals; // always value
        if (upper === ComparersResult.Undetermined) {
            this.logTypeMismatch(valueHostsManager.services, 'Value', 'Maximum', value, upper);            
            return ConditionEvaluateResult.Undetermined;
        }
        if (lower === ComparersResult.Equals || lower === ComparersResult.LessThan)
            if (upper === ComparersResult.Equals || upper === ComparersResult.GreaterThan)
                return ConditionEvaluateResult.Match;


        return ConditionEvaluateResult.NoMatch;
    }
    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        // same order of precidence as in Evaluate

        list.push({
            tokenLabel: 'Minimum',
            associatedValue: this.config.minimum ?? null,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Maximum',
            associatedValue: this.config.maximum ?? null,
            purpose: 'parameter'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}
//#region CompareToSecondValueHost conditions

/**
 * ConditionConfig for {@link EqualToCondition}
 */
export interface EqualToConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }

/**
 * Two values must be equal. Both values are retrieved from ValueHosts.
 */
export class EqualToCondition extends CompareToSecondValueHostConditionBase<EqualToConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.EqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        return comparison === ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}

/**
 * ConditionConfig for {@link NotEqualToCondition}
 */
export interface NotEqualToConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }

/**
 * Two values must not be equal. Both values are retrieved from ValueHosts.
 */
export class NotEqualToCondition extends CompareToSecondValueHostConditionBase<NotEqualToConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotEqualTo; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

        return comparison !== ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}

/**
 * ConditionConfig for {@link GreaterThanCondition}
 */
export interface GreaterThanConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }
/**
 * Value 1 must be greater than Value 2. Both values are retrieved from ValueHosts.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined.
 */
export class GreaterThanCondition extends CompareToSecondValueHostConditionBase<GreaterThanConditionConfig> {
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
 * ConditionConfig for {@link LessThanCondition}
 */
export interface LessThanConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }

/**
 * Value 1 must be less than Value 2. Both values are retrieved from ValueHosts.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined.
 */
export class LessThanCondition extends CompareToSecondValueHostConditionBase<LessThanConditionConfig> {
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
 * ConditionConfig for {@link GreaterThanOrEqualCondition}
 */
export interface GreaterThanOrEqualConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }

/**
 * Value 1 must be greater than or equal Value 2. Both values are retrieved from ValueHosts.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanOrEqualCondition extends CompareToSecondValueHostConditionBase<GreaterThanOrEqualConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThanOrEqual; }
    
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
 * ConditionConfig for {@link LessThanOrEqualCondition}
 */
export interface LessThanOrEqualConditionConfig extends CompareToSecondValueHostConditionBaseConfig { }

/**
 * Value 1 must be less than or equal Value 2. Both values are retrieved from ValueHosts.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanOrEqualCondition extends CompareToSecondValueHostConditionBase<LessThanOrEqualConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanOrEqual; }    

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
//#endregion CompareToSecondValueHost

//#region CompareToSecondValue condition
/**
 * ConditionConfig for {@link EqualToValueCondition}
 */
export interface EqualToValueConditionConfig extends CompareToValueConditionBaseConfig { }
/**
 * Value from ValueHost must be equal to a second value, assigned in its ConditionConfig.secondValue.
 */
export class EqualToValueCondition extends CompareToValueConditionBase<EqualToValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.EqualToValue; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {
        return comparison === ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}

/**
 * ConditionConfig for {@link NotEqualToValueCondition}
 */
export interface NotEqualToValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must not be equal to a second value, assigned in its ConditionConfig.secondValue.
 */
export class NotEqualToValueCondition extends CompareToValueConditionBase<NotEqualToValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.NotEqualToValue; }
    
    protected compareTwoValues(comparison: ComparersResult): ConditionEvaluateResult {

        return comparison !== ComparersResult.Equals ?
            ConditionEvaluateResult.Match :
            ConditionEvaluateResult.NoMatch;
    }
}


/**
 * ConditionConfig for {@link GreaterThanValueCondition}
 */
export interface GreaterThanValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be greater than a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanValueCondition extends CompareToValueConditionBase<GreaterThanValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThanValue; }
    
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
 * ConditionConfig for {@link LessThanValueCondition}
 */
export interface LessThanValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanValueCondition extends CompareToValueConditionBase<LessThanValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanValue; }
    
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
 * ConditionConfig for {@link GreaterThanOrEqualValueCondition}
 */
export interface GreaterThanOrEqualValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be greater than or equal to a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class GreaterThanOrEqualValueCondition extends CompareToValueConditionBase<GreaterThanOrEqualValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.GreaterThanOrEqualValue; }
    
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
 * ConditionConfig for {@link LessThanOrEqualValueCondition}
 */
export interface LessThanOrEqualValueConditionConfig extends CompareToValueConditionBaseConfig { }

/**
 * Value from ValueHost must be less than or equal to a second value, assigned in its ConditionConfig.secondValue.
 * 
 * Evaluates data types that do not support GreaterThan/LessThan as Undetermined
 */
export class LessThanOrEqualValueCondition extends CompareToValueConditionBase<LessThanOrEqualValueConditionConfig> {
    public static get DefaultConditionType(): ConditionType { return ConditionType.LessThanOrEqualValue; }    

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

//#endregion CompareToSecondValue condition





/**
 * ConditionConfig for {@link StringLengthCondition}
 */
export interface StringLengthConditionConfig extends StringConditionBaseConfig {
    /**
     * Native data type representing the minimum of the range.
     * When undefined or null, no minimum, like LessThanOrEqualConditon.
     */
    minimum?: number | null;

    /**
     * Native data type representing the maximum of the range.
     * When undefined or null, no maximum, like GreaterThanOrEqualConditon.
     */
    maximum?: number | null;
}

/**
 * Evaluates the length of a string in characters (after trimming if Trim is true).
 * 
 * Compares the result to non-null Minimum and/or Maximum parameters.
 * 
 * Supports these tokens: {Length}, {Minimum} and {Maximum}
 * 
 * Supports validateOptions.duringEdit = true so long as Config.supportsDuringEdit
 * is true or undefined. In that case, it respects the Config.trim property.
 */
export class StringLengthCondition extends StringConditionBase<StringLengthConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.StringLength; }
    
    protected evaluateString(text: string, valueHost: IValueHost, services: IValidationServices): ConditionEvaluateResult {
        let len = text.length;  // already trimmed
        return this.evaluateLength(len, valueHost);
    }
    private evaluateLength(len: number, valueHost: IValueHost): ConditionEvaluateResult
    {
        valueHost.saveIntoInstanceState('Len', len);
        if (this.config.minimum != null)    // null/undefined
            if (len < this.config.minimum)
                return ConditionEvaluateResult.NoMatch;
        if (this.config.maximum != null)    // null/undefined
            if (len > this.config.maximum)
                return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }

    public override getValuesForTokens(valueHost: IValidatorsValueHostBase, valueHostsManager: IValueHostsManager): Array<TokenLabelAndValue> {
        let list: Array<TokenLabelAndValue> = [];
        list = list.concat(super.getValuesForTokens(valueHost, valueHostsManager));
        // same order of precidence as in Evaluate

        list.push({
            tokenLabel: 'Length',
            associatedValue: valueHost.getFromInstanceState('Len') ?? 0,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Minimum',
            associatedValue: this.config.minimum ?? null,
            purpose: 'parameter'
        });
        list.push({
            tokenLabel: 'Maximum',
            associatedValue: this.config.maximum ?? null,
            purpose: 'parameter'
        });
        return list;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.Comparison;
    }
}
/**
 * ConditionConfig for {@link AllMatchCondition}
 */
export interface AllMatchConditionConfig extends EvaluateChildConditionResultsBaseConfig
{
    
}

/**
 * All Children must evaluate as Match for a result of Match.
 * 
 * If any are still Undetermined after treatUndeterminedAs is applied, this results as Undetermined.
 * 
 * Any child that does not specify its Config.valueHostName will use the ValueHost passed into evaluate()
 */
export class AllMatchCondition extends EvaluateChildConditionResultsBase<AllMatchConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.And; }
    
    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult {
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostsManager))) {
                case ConditionEvaluateResult.NoMatch:
                    return ConditionEvaluateResult.NoMatch;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        return ConditionEvaluateResult.Match;
    }
}
/**
 * ConditionConfig for {@link AnyMatchCondition}
 */
export interface AnyMatchConditionConfig extends EvaluateChildConditionResultsBaseConfig
{
    
}
/**
 * At least one Child Condition must evaluate as Match for a result of Match.
 * 
 * If any are still Undetermined after treatUndeterminedAs is applied, this results as Undetermined.
 * 
 * Any child that does not specify its Config.valueHostName will use the ValueHost passed into evaluate()
 */
export class AnyMatchCondition extends EvaluateChildConditionResultsBase<AnyMatchConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Or; }

    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostsManager))) {
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
 * ConditionConfig for {@link CountMatchesCondition}
 */
export interface CountMatchesConditionConfig extends EvaluateChildConditionResultsBaseConfig {
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
 * is within a range of Config.minimum to Config.maximum.
 * When Minimum isn't supplied, it defaults to 1.
 * 
 * Any child that does not specify its Config.valueHostName will use the ValueHost passed into evaluate()
 */
export class CountMatchesCondition extends EvaluateChildConditionResultsBase<CountMatchesConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.CountMatches; }
    
    protected evaluateChildren(conditions: ICondition[], parentValueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult {
        let countMatches = 0;
        for (let condition of conditions)
            switch (this.cleanupChildResult(condition.evaluate(parentValueHost, valueHostsManager))) {
                case ConditionEvaluateResult.Match:
                    countMatches++;
                    break;
                case ConditionEvaluateResult.Undetermined:
                    return ConditionEvaluateResult.Undetermined;
            }
        let minimum = this.config.minimum ?? 1;
        if (minimum !== undefined && countMatches < minimum)
            return ConditionEvaluateResult.NoMatch;
        if (this.config.maximum !== undefined && countMatches > this.config.maximum)
            return ConditionEvaluateResult.NoMatch;
        return ConditionEvaluateResult.Match;
    }
}

/**
 * ConditionConfig for {@link PositiveCondition}
 */
export interface PositiveConditionConfig extends NumberConditionBaseConfig
{

}
/**
 * Evaluates a number to confirm it is a value of 0 or higher.
 * The value can be from an object that has a DataTypeConverter to make it into a number.
 * Defaults to a DataTypeCheck ConditionCategory.
 */
export class PositiveCondition extends NumberConditionBase<PositiveConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Positive; }    
    protected evaluateNumber(value: number, valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return value >= 0 ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}

/**
 * ConditionConfig for {@link IntegerCondition}
 */
export interface IntegerConditionConfig extends NumberConditionBaseConfig
{

}
/**
 * Evaluates a number to confirm it is a value is an integer.
 * The value can be from an object that has a DataTypeConverter to make it into a number.
 * Defaults to a DataTypeCheck ConditionCategory.
 */
export class IntegerCondition extends NumberConditionBase<IntegerConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.Integer; }    
    protected evaluateNumber(value: number, valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        return value === Math.floor(value) ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}

/**
 * ConditionConfig for {@link MaxDecimalsCondition}
 */
export interface MaxDecimalsConditionConfig extends NumberConditionBaseConfig
{
    /**
     * Maximum number of decimal places allowed.
     * Requires a value.
     */
    maxDecimals: number;
}
/**
 * Evaluates a number to confirm it is a value of 0 or higher.
 * The value can be from an object that has a DataTypeConverter to make it into a number.
 * Defaults to a DataTypeCheck ConditionCategory.
 */
export class MaxDecimalsCondition extends NumberConditionBase<MaxDecimalsConditionConfig>
{
    public static get DefaultConditionType(): ConditionType { return ConditionType.MaxDecimals; }
    
    constructor(config: MaxDecimalsConditionConfig)
    {
        super(config);
        assertNotNull(config.maxDecimals, 'maxDecimals');
        if (config.maxDecimals < 1)
            throw new CodingError('maxDecimals must be 1 or higher');
    }
    protected evaluateNumber(value: number, valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult | Promise<ConditionEvaluateResult> {
        let poweredValue = value * Math.pow(10, this.config.maxDecimals);
        
        return poweredValue === Math.floor(poweredValue) ? ConditionEvaluateResult.Match : ConditionEvaluateResult.NoMatch;
    }
    protected get defaultCategory(): ConditionCategory {
        return ConditionCategory.DataTypeCheck;
    }
}
