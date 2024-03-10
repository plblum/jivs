import { IValueHostResolver } from "./ValueHostResolver";
import { ConditionEvaluateResult, ICondition, IConditionDescriptor } from "./Conditions";
import { IInputValueHost } from "./InputValueHost";
import { IIssueFound, IValidateOptions, ValidationSeverity } from "./Validation";
import { IGatherValueHostIds } from "./ValueHost";

/**
 * Represents a single validator for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call Validate() to get all of the results
 * of a validation, including ValidationResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 */
export interface IInputValidator extends IMessageTokenSource, IGatherValueHostIds {
    /**
     * Perform validation activity and provide the results including
     * whether there is an error (ValidationResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluationResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    Validate(options: IValidateOptions): IInputValidateResult;

    /**
     * Exposes the Condition behind the validator
     */
    Condition: ICondition;

}

/**
 * Just the data that is used to describe one validator assigned to a ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to IInputValidatorDescriptor.
 * This provides the backing data for each InputValidatorInfo.
 * When placed into the InputValidatorInfo, it is treated as immutable
 * and can be used as state in React.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this. However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface IInputValidatorDescriptor {
    // -----------------------
    // There are two ways to supply this validator's Condition.
    // 1. Pass a ConditionDescriptor and we'll create the correct Condition instance
    // registered with the ValidationServices.ConditionFactory.
    // This is limited to Condition instances that implement IConditionCore<IConditionDescriptor>.
    // 2. Provide a function that will return the instance.
    // This is ideal for when the Condition does not implement IConditionCore<IConditionDescriptor>
    // such as your custom validation functions that hook back into your business logic.
    // -----------------------

     /** 
     * ConditionDescriptor that allows the ConditionFactory to provide the Condition.
     * Like all Descriptors in this system, this is expected to be immutable.
     * Only use this when ConditionCreator is null.
     */
    ConditionDescriptor: IConditionDescriptor | null;

    /**
     * Use to create the Condition instance yourself, especially to support
     * implementations of ICondition that don't implement IConditionCore<IConditionDescriptor>.
     * Only use this when ConditionDescriptor is null.
     * @param requester
     * @returns 
     */
    ConditionCreator?: (requester: IInputValidatorDescriptor) => ICondition | null;

    /**
     * The ConditionDescriptor to create an Enabler Condition.
     * An Enabler is a Condition used to determine if validation is enabled.
     * For example, evaluate the state of a checkbox before
     * reporting an error in a textbox associated with that checkbox
     * being checked.
     * Leave it null if not needed.
     * An EnablerDescriptor instance should be considered immutable once assigned here.
     * Use this when the Condition extends IConditionCore<IConditionDescriptor>.
     * Leave null if EnablerCreator is asssigned.
     */
    EnablerDescriptor?: IConditionDescriptor | null | undefined;
    /**
     * Use to create the Condition instance yourself, especially to support
     * implementations of ICondition that don't implement IConditionCore<IConditionDescriptor>.
     * Only use this when EnablerDescriptor is null.
     * @param requester
     * @returns 
     */
    EnablerCreator?: (requester: IInputValidatorDescriptor) => ICondition | null;    

    /**
     * When false, validation is never run. This supersedes the Enabler too.
     * Values:
     * * true/false obviously.
     * * undefined - tells the InputValidator to treat it as true. (Its value 
     *   will not be updated as we want this to be immutable while the Descriptor
     *   is assigned to the host.)
     * * function - Provide a function that will return true or false, 
     *   given the InputValidator as a parameter.
     */
    Enabled?: undefined | boolean | ((host: IInputValidator) => boolean);
    /**
     * Resolves the Severity for when the Condition evaluates as NoMatch.
     * Values:
     * * ValidationSeverity itself. Recommended to set to Severe for Required and CanConvertToNativeDataTypeCondition.
     * * Undefined - tells the InputValidator to treat it as Error.
     * * function - Provide a function that will return the ValidationSeverity, 
     *   given the InputValidator as a parameter.
     */
    Severity?: undefined | ValidationSeverity | ((host: IInputValidator) => ValidationSeverity);

    /**
     * Validators can be part of one or more named groups.
     * Groups are part of validating the complete Model.
     * All validators on the page may be asked to validate.
     * Often fields are used for different aspects of the page, like 
     * a login or search field in the header is a different feature
     * from the form where data is being gathered.
     * Submit buttons usually call Validate and supply their validation group name.
     * When they do, validators associated with that button must have the same
     * group name.
     * Values:
     * * undefined, null or '*' all mean the group feature is ignored.
     * * string - a single group name. If it does not match the requested group
     *   in the Validate function, the validator is treated as disabled.
     *   Case insensitive matching.
     * * string[] - a list of group names. If none match the requested group
     *   in the Validate function, the validator is treated as disabled.
     */
    Group?: undefined | null | string | Array<string>;

    /**
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * Tokens are resolved with Services.MessageTokenResolver.
     * It should already be localized, except for the tokens.
     * It can contain HTML tags if the platform supports them. In that case,
     * be sure to use HTML encoded characters.
     * The string shown to the actual user is stored in InputValidatorState.ErrorMessage.
     * Values:
     * * String - The error message with tokens and optional HTML tags.
     * * function - Returns the error message, given the InputValidator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     */
    ErrorMessage: string | ((host: IInputValidator) => string);
    /**
     * Variation of the ErrorMessage intended to be displayed in a Validation Summary area.
     * A summary is usually not near the field with the error. 
     * As a result, it helps to shape the message differently, usually by including
     * the Label token. "{Label} is required."
     * Values:
     * * undefined and null - use the ErrorMessage as the template.
     * * String - The error message with tokens and optional HTML tags.
     * * function - Returns the error message, given the InputValidator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     */
    SummaryErrorMessage?: undefined | null | string | ((host: IInputValidator) => string);
}

/**
 * Result of the Validate function.
 */
export interface IInputValidateResult {
    /**
     * The result of Validate
     */
    ConditionEvaluateResult: ConditionEvaluateResult,

    /**
     * Assigned with issue details when an issue is found.
     * Null when no issue is found.
     */
    IssueFound: IIssueFound | null,

    /**
     * When true, Validate bailed before evaluation due to Enabled, Enabler
     * or validation group mismatch.
     */
    Skipped?: boolean;
}


export interface IMessageTokenSource
{
    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Caller will search the message for each token supplied. If found,
     * it converts the value to a string using localization rules and replaces the token.
     * The TokenLabel doesn't provide {} because we may support additional
     * attributes within the token, like {Value:AbbrevDateFormat}
     */
    GetValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver):
        Array<ITokenLabelAndValue>;
}
/**
 * Result from IMessageTokenSource.GetValuesForTokens
 */
export interface ITokenLabelAndValue
{
/**
 * The text within the {} of the token. Used to match tokens.
 */    
    TokenLabel: string,
/**
 * The value to be used as a replacement. When the value isn't a string,
 * it is converted to a string through IDataTypeLocalization.
 */    
    AssociatedValue: any,
/**
 * Provides additional guidance about the token's purpose so the
 * IMessageTokenResolver can apply additional formatting to the token,
 * such as in HTML, a span tag with a specific classname.
 * When null, no additional guidance is offered.
 * Values are:
 * 'label' - the target of the message, such as the ValueHost's label. {Label} is an example
 * 'parameter' - configuration data, such as a ConditionDescriptor's rules. {Minimum} is an example
 * 'value' - some live data, such as the ValueHost's current value. {Value} is an example
 * 'message' - text just augments the error message, like {ConversionError} of DataTypeCheckCondition
 */
    Purpose?: 'label' | 'parameter' | 'value' | 'message';
}



/**
 * Factory for generating InputValidator.
 * Most apps will use the standard InputValidator class.
 * This interface targets unit testing with mocks.
 */
export interface IInputValidatorFactory {
    Create(valueHost: IInputValueHost, descriptor: IInputValidatorDescriptor): IInputValidator;
}

/**
 * Replaces all tokens in a message with a user friendly value.
 * Tokens are single words within curley braces like {Label}. They are 
 * case insensitive.
 * Tokens can have an optional second part to identify a formatterKey.
 * The syntax is {token:formatterkey}.
 * Legal characters in token and formatterkey are letters, digits, and underscore.
 * These are matched case insensitively.
 * Some values are found in the Validator's ConditionDescriptor, 
 * such as the {Minimum} and {Maximum} of a RangeCondition. 
 * They need to be formatted according to the data type,
 * such as "number" will convert 1000 into "1,000" and "date" will convert 
 * a javascript Date into "May 20, 2001". This function uses the 
 * Services.DataTypeResolver to handle conversion and localization.
 * The "formatterkey" in {token:formatterkey} is actually the same
 * as a LookupKey in the DataTypeResolver and its DataTypeLocalizations.
 * Tokens are supplied by implementers of IMessageTokenSource.
 */
export interface IMessageTokenResolver
{
    /**
     * Replaces tokens in the message with user friendly values
     * @param message 
     * @param valueHost - makes stateful info available to IMessageTokenSources.
     * @param valueHostResolver
     * @param hosts 
     * @returns the message with formatting resolved
     */
    ResolveTokens(message: string, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver, ...hosts: Array<IMessageTokenSource>): string;
}