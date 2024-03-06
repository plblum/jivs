import { IValueHostResolver } from "./ValueHostResolver";
import { IValueHost } from "./ValueHost";

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
 * - ICondition - Provides the Evaluate function for implementations.
 * - IConditionDescriptor - A description of the rules for evaluation, such
 *   as ValueHostId="TextBox1", Type (of Condition to use)="Range",
 *   Minimum=3, and Maximum=5.
 * - IConditionCore<TConditionDescriptor> - Blending the ICondition with 
 *   the IConditionDescriptor, for implementing conditions that are configured
 *   through the Descriptor. Most Condition classes supplied in this library
 *   implement this interface.
 */


/**
 * The basis for any condition that you want to work with these validators.
 * There are a number of implementations based on its subclass IConditionCore,
 * all which allow a Descriptor approach of configuration.
 * Implement this directly when you want to handle all of the work in the Evaluate
 * function yourself, and supply your own way of configuring.
 */
export interface ICondition {
    /**
     * A unique identifier for the specific implementation, like "Required" or "Range".
     * Its value appears in the IIssueFound that comes from Validation, and in 
     * IIssueSnapshot that comes from retrieving a list of errors to display.
     * It allows the consumer of both to correlate those instances with the specific condition.
     * When defining conditions through a ConditionDescriptor, the Type property must 
     * be assigned with a valid ConditionType.
     */
    ConditionType: string;

    /**
     * Evaluate something against the rules defined in the implementation. Return whether
     * the data was consistent or violates the rules, or the data couldn't be used to run the rule. 
     * @param valueHost - Most values are found amongst the ValueHosts in the ValueHostsManager.
     * Conditions can look them up using ValueHostsManager.GetValueHost().GetValue or GetInputValue.
     * This parameter is used as an optimization, both to avoid that lookup and to avoid
     * the user typing in a ValueHostId when creating the Condition instance.
     * InputValidator.Validate knows to pass the ValueHostId that hosts the InputValidator.
     * Expect this to be null in other cases, such as when Condition is a child of the AndConditions
     * and its peers. In otherwords, support both ways.
     * @param valueHostResolver - Its primary use is to lookup ValueHosts to get their data.
     * @returns Any of these values:
     * - Match - consistent with the rule
     * - NoMatch - violates the rule
     * - Undetermined - Cannot invoke the rule. Usually data incompatible with use within the rule,
     *    like the value is null, undefined, or the wrong data type.
     */
    Evaluate(valueHost: IValueHost | null, valueHostResolver: IValueHostResolver): ConditionEvaluateResult;

    /**
     * Helps identify the purpose of the Condition. Impacts:
     * * Sort order of the list of Conditions evaluated by an InputValidator,
     *   placing Required first and DataTypeCheck second.
     * * Sets InputValueHostDescriptor.Required.
     * * Sets IInputValidatorDescriptor.Severity when undefined, where Required
     *   and DataTypeCheck will use Severe. Others will use Error.
     * Many Conditions have this value predefined. However, all will let the user
     * override it with IConditionDescriptor.Category.
     */
    Category: ConditionCategory;
}


/**
 * Just the data that is used to identify a Condition that is needed,
 * along with data that supports its ability to evaluate its business rule.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to IConditionDescriptor.
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
export interface IConditionDescriptor {
    /**
     * Identifies the class to create. Class must implement ICondition
     * and be able to process the propertys of IConditionDescriptor.
     * Used by the ConditionFactory
     */
    Type: string;

    /**
     * Most Condition classes have an official value for Category.
     * This allows you to override that official value in special situations
     * and supply a value when the Condition does not.
     */
    Category?: ConditionCategory;
}

/**
 * The base for conditions implemented within this library.
 */
export interface IConditionCore<TConditionDescriptor extends IConditionDescriptor> extends ICondition {

    /**
     * Data that supports the business rule defined in Evaluate.
     * Consider this immutable.
     * Expect to create a new Condition instance if its data needs to be changed.
     */
    Descriptor: TConditionDescriptor;
}

/**
 * The result of a condition's Evaluate method.
 */
export enum ConditionEvaluateResult {
    Undetermined,
    Match,
    NoMatch
}

export const ConditionEvaluateResultStrings = [
    "Undetermined",
    "Match",
    "NoMatch"
];

/**
 * Each Category gets assigned a category. For the most part, these are merely info.
 * However, Required and DataTypeCheck have special meaning.
 * Required - the IInputValueHostDescriptor.Required property is set if this is found.
 *   These conditions are always placed first in the evaluation order.
 *   When Required, IInputValidatorDescriptor.Severity of Undefined is treated as Severe, not Error
 *   to stop further Condition evaluation.
 * DataTypeCheck - used to ensure we have a valid native object that can be used by other
 *   conditions. Because these should be evaluated before those, these conditions
 *   are placed just after Required.
 *   When DataTypeCheck, IInputValidatorDescriptor.Severity of Undefined is treated as Severe, not Error,
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
     * if evaluation is NoMatch (unless user explicitly sets IInputValidatorDescriptor.Severity to Error or Warning.)
     */
    Required,
    /**
     * Use to check the data is in its expected final form, whether a primitive, object (like Date), or
     * if it remains a string, it contains the expected pattern: DataTypeCheckCondition, RegExpCondition
     * These will be evaluated before all other conditions except Required, and will stop further evaluation
     * if evaluation is NoMatch (unless user explicitly sets IInputValidatorDescriptor.Severity to Error or Warning.)
      */
    DataTypeCheck,
    /**
     * Provides logical comparison: ValuesEqualCondition, ValueGTSecondValueCondition, etc.
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
     * AndConditions/EveryCondition, OrConditions/AnyCondition, CountMatchingConditions
     */
    Children,
    /**
     * For anything else.
     */
    Undetermined
}

/**
 * Creates instances of Conditions given an IConditionDescriptor.
 * IConditionDescriptor.Type is used to determine the Condition class to create.
 */
export interface IConditionFactory {
    /**
     * Create an instance of a Condition from the IConditionDescriptor.
     * @param descriptor 
     * @returns 
     */
    Create(descriptor: IConditionDescriptor): ICondition;
}
