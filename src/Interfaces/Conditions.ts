/**
 * A Condition is a tool to evaluate value(s) against a rule
 * to see if the value(s) conform.
 * Conditions exist for each business rule pattern, such as 
 * required, string matches the data type, compare value to another.
 * Instances should be registered in the ConditionFactory.
 * Conditions can get data from any ValueHost registered in the ValueHostsManager.
 * They can also be implemented specific to the consuming system, such as 
 * calling an API function, and using the result to determine how evaluation went.
 * 
 * Key interfaces:
 * - {@link ICondition} - Provides the evaluate() function for implementations.
 * - {@link ConditionDescriptor} - A description of the rules for evaluation, such
 *   as ValueHostId="TextBox1", Type (of Condition to use)="Range",
 *   Minimum=3, and Maximum=5.
 * - {@link IConditionCore } - Blending the ICondition with 
 *   the ConditionDescriptor, for implementing conditions that are configured
 *   through the Descriptor. Most Condition classes supplied in this library
 *   implement this interface.
 * @module Conditions/Interfaces
 */

import { IValueHostResolver } from './ValueHostResolver';
import { IValueHost } from './ValueHost';
import { IValidationServices } from './ValidationServices';
import { IInputValueHost } from './InputValueHost';

/**
 * The basis for any condition that you want to work with these validators.
 * There are a number of implementations based on its subclass IConditionCore,
 * all which allow a Descriptor approach of configuration.
 * Implement this directly when you want to handle all of the work in the evaluate()
 * function yourself, and supply your own way of configuring.
 */
export interface ICondition {
    /**
     * A unique identifier for the specific implementation, like "Required" or "Range".
     * Its value appears in the IssueFound that comes from Validation, and in 
     * IssueSnapshot that comes from retrieving a list of errors to display.
     * It allows the consumer of both to correlate those instances with the specific condition.
     * When defining conditions through a ConditionDescriptor, the Type property must 
     * be assigned with a valid ConditionType.
     */
    conditionType: string;

    /**
     * Evaluate something against the rules defined in the implementation. Return whether
     * the data was consistent or violates the rules, or the data couldn't be used to run the rule. 
     * @param valueHost - Most values are found amongst the ValueHosts in the ValueHostsManager.
     * Conditions can look them up using ValueHostsManager.getValueHost().getValue() or getInputValue().
     * This parameter is used as an optimization, both to avoid that lookup and to avoid
     * the user typing in a ValueHostId when creating the Condition instance.
     * InputValidator.validate() knows to pass the ValueHostId that hosts the InputValidator.
     * Expect this to be null in other cases, such as when Condition is a child of the AllMatchCondition
     * and its peers. In otherwords, support both ways.
     * @param valueHostResolver - Its primary use is to lookup ValueHosts to get their data.
     * @returns Any of these values:
     * - Match - consistent with the rule
     * - NoMatch - violates the rule
     * - Undetermined - Cannot invoke the rule. Usually data incompatible with use within the rule,
     *    like the value is null, undefined, or the wrong data type.
     */
    evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult | Promise<ConditionEvaluateResult>;

    /**
     * Helps identify the purpose of the Condition. Impacts:
     * * Sort order of the list of Conditions evaluated by an InputValidator,
     *   placing Required first and DataTypeCheck second.
     * * Sets InputValueHostDescriptor.Required.
     * * Sets InputValidatorDescriptor.Severity when undefined, where Required
     *   and DataTypeCheck will use Severe. Others will use Error.
     * Many Conditions have this value predefined. However, all will let the user
     * override it with ConditionDescriptor.category.
     */
    category: ConditionCategory;
}


/**
 * Just the data that is used to identify a Condition that is needed,
 * along with data that supports its ability to evaluate its business rule.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to ConditionDescriptor.
 * This provides the backing data for each ICondition.
 * When placed into the ICondition, it is treated as immutable
 * and can be used as state in React.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this. However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 * Examples: 
 * RequiredTextValidator: { type: 'Required' }
 * RangeValidator:  { type: 'Range', minimum: any, maximum: any } // datatype sensitive values are in their native datatype
 *  CustomValidator: { type: 'Custom' } // this needs the user to supply a function callback for validation
 */
export interface ConditionDescriptor {
    /**
     * Identifies the class to create. Class must implement ICondition
     * and be able to process the propertys of ConditionDescriptor.
     * Used by the ConditionFactory
     */
    type: string;

    /**
     * Most Condition classes have an official value for Category.
     * This allows you to override that official value in special situations
     * and supply a value when the Condition does not.
     */
    category?: ConditionCategory;
}

/**
 * The base for conditions implemented within this library.
 */
export interface IConditionCore<TConditionDescriptor extends ConditionDescriptor> extends ICondition {

    /**
     * Data that supports the business rule defined in evaluate().
     * Consider this immutable.
     * Expect to create a new Condition instance if its data needs to be changed.
     */
    descriptor: TConditionDescriptor;
}

/**
 * The result of a condition's evaluate() method.
 */
export enum ConditionEvaluateResult {
    Undetermined,
    Match,
    NoMatch
}

export const ConditionEvaluateResultStrings = [
    'Undetermined',
    'Match',
    'NoMatch'
];

/**
 * Each Category gets assigned a category. For the most part, these are merely info.
 * However, Required and DataTypeCheck have special meaning.
 * Required - the InputValueHostDescriptor.Required property is set if this is found.
 *   These conditions are always placed first in the evaluation order.
 *   When Required, InputValidatorDescriptor.Severity of Undefined is treated as Severe, not Error
 *   to stop further Condition evaluation.
 * DataTypeCheck - used to ensure we have a valid native object that can be used by other
 *   conditions. Because these should be evaluated before those, these conditions
 *   are placed just after Required.
 *   When DataTypeCheck, InputValidatorDescriptor.Severity of Undefined is treated as Severe, not Error,
 *   to stop further Condition evaluation.
 *   Users may set RegExpCondition's Category to DataTypeCheck if the expression confirms 
 *   a string is the expected data type, like USPhoneNumber or EmailAddress.
 * In fact, these categories determine a sort order for the Conditions on one InputValueHost.
 * Thus, its imperitive we preserve the order of first two.
 */
export enum ConditionCategory {
    /**
     * Use when the data is required: RequiredTextCondition and RequiredIndexCondition.
     * These will be evaluated first by the InputValueHost, and will stop further evaluation
     * if evaluation is NoMatch (unless user explicitly sets InputValidatorDescriptor.Severity to Error or Warning.)
     */
    Required,
    /**
     * Use to check the data is in its expected final form, whether a primitive, object (like Date), or
     * if it remains a string, it contains the expected pattern: DataTypeCheckCondition, RegExpCondition
     * These will be evaluated before all other conditions except Required, and will stop further evaluation
     * if evaluation is NoMatch (unless user explicitly sets InputValidatorDescriptor.Severity to Error or Warning.)
      */
    DataTypeCheck,
    /**
     * Provides logical comparison: EqualToCondition, GreaterThanCondition, etc.
     */
    Comparison,
    /**
     * For string data that is expected to have specific contents, but isn't required to conform to the data type.
     * For example, a postal code is a good DataTypeCheck regular expression. 
     * If you want to include specific postal codes, you might use a regular expression and its category 
     * would be Contents.
     */
    Contents,
    /**
     * Evaluation is based on the evaluation results of Child conditions: 
     * AllMatchCondition/EveryCondition, AnyMatchCondition/AnyCondition, CountMatchesCondition
     */
    Children,
    /**
     * For anything else.
     */
    Undetermined
}

/**
 * Conditions that compare values using DataTypeServices.compareValues()
 * will provide LookupKeys from the ValueHost.DataType. 
 * Often the comparison needs a little more work done to the value.
 * Examples:
 * - Case insensitive comparison needs to convert the strings to lowercase
 * - Dates may be compared to each other as the difference between two in days, months, or years.
 *   Conversion would get the total days/months/years (instead of milliseconds).
 * Implement this interface to provide ConversionLookupKey to
 * the ConditionDescriptor. If ConversionLookupKey is assigned, pass it
 * to compareValues() instead of ValueHost.DataType.
 * Some LookupKeys that might be used: CaseInsensitive, Integer, TotalDays
 */
export interface SupportsDataTypeConverter extends ConditionDescriptor
{
    /**
     * Assign to a LookupKey that is associated with a DataTypeConverter.
     * Use it to convert the value prior to comparing, to handle special cases like
     * case insensitive matching ("CaseInsensitive"), rounding a number to an integer ("Integer"),
     * just the Day or Month or any other number in a Date object ("Day", "Month").
     */
    conversionLookupKey?: string | null;
}

/**
 * Implement this interface when your condition should evaluate the text
 * of your Input as its being edited. Your evaluateDuringEdit() function
 * is called by the InputValidator.validate() function instead of the 
 * ICondition.evaluate() when validateOption.DuringEdit is true.
 * This is a specialized validator, and not part of model validation.
 * Instead, it takes a string that is provided by the UI Input (via
 * InputValueHost.SetInputValue()) and determines if the content is valid.
 * Most validation is based on the already converted native value, 
 * like comparing two values. This validation should be limitd to rules
 * that are limited to a string that is likely not in good enough shape
 * to be converted to native. Examples:
 * - Required: does the string have any non-whitespace text?
 * - Reg exp to check for invalid characters, such as entering a password.
 *   This allows you to report immediate problems as the user types.
 * - String length: if the user has exceeded the maximum, they know immediately.
 * In fact, the provided RequiredTextCondition, RegExpCondition, and StringLengthCondition
 * have already been setup for this, although their ConditionDescriptors let you disable
 * this feature.
 */
export interface IEvaluateConditionDuringEdits extends ICondition
{
    /**
     * Evaluates the text from an Input that is actively being edited to determine if it violates
     * the rules of this condition. However, this implementation is often very different from
     * the implementation built around the native value. It works with a string value from the Input,
     * and you aren't expected to retrieve any other value from a ValueHost host. 
     * @param text - Current Input Value from InputValueHost. It has not been modified, so if
     * you need to work with trimmed (lead and trail whitespace removed) text, you must take
     * care of that yourself.
     * @param valueHost - the ValueHost that invoked this.
     * @param services - just in case, your logic needs more info. However, if the data you need
     * is constant, add a property to your condition's ConditionDescriptor to supply it.
     */
    evaluateDuringEdits(text: string, valueHost: IInputValueHost, services: IValidationServices): ConditionEvaluateResult;
}

/**
 * Determines if the source implements IEvaluateConditionDuringEdits, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIEvaluateConditionDuringEdits(source: any): IEvaluateConditionDuringEdits | null {
    if (source && typeof source === 'object') {
        let test = source as IEvaluateConditionDuringEdits;       
        if (test.evaluateDuringEdits !== undefined)
            return test;
    }
    return null;
}


/**
 * Creates instances of Conditions given an ConditionDescriptor.
 * ConditionDescriptor.Type is used to determine the Condition class to create.
 */
export interface IConditionFactory {
    /**
     * Create an instance of a Condition from the ConditionDescriptor.
     * @param descriptor 
     * @returns 
     */
    create(descriptor: ConditionDescriptor): ICondition;
}
