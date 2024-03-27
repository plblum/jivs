/**
 * {@inheritDoc InputValidator/ConcreteClasses!}
 * @module InputValidator/Interfaces
 */
import { IValueHostResolver } from './ValueHostResolver';
import { ConditionEvaluateResult, ICondition, ConditionDescriptor } from './Conditions';
import { IInputValueHost } from './InputValueHost';
import { IssueFound, ValidateOptions, ValidationSeverity } from './Validation';
import { IGatherValueHostIds } from './ValueHost';

/**
 * Represents a single validator for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call validate() to get all of the results
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
    validate(options: ValidateOptions): InputValidateResult | Promise<InputValidateResult>;

    /**
     * Exposes the Condition behind the validator
     */
    condition: ICondition;

}

/**
 * Just the data that is used to describe one validator assigned to a ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to InputValidatorDescriptor.
 * This provides the backing data for each InputValidatorInfo.
 * When placed into the InputValidatorInfo, it is treated as immutable
 * and can be used as state in React.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this. However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface InputValidatorDescriptor {
    // -----------------------
    // There are two ways to supply this validator's Condition.
    // 1. Pass a ConditionDescriptor and we'll create the correct Condition instance
    // registered with the ValidationServices.ConditionFactory.
    // This is limited to Condition instances that implement IConditionCore<ConditionDescriptor>.
    // 2. Provide a function that will return the instance.
    // This is ideal for when the Condition does not implement IConditionCore<ConditionDescriptor>
    // such as your custom validation functions that hook back into your business logic.
    // -----------------------

    /** 
    * ConditionDescriptor that allows the ConditionFactory to provide the Condition.
    * Like all Descriptors in this system, this is expected to be immutable.
    * Only use this when ConditionCreator is null.
    */
    conditionDescriptor: ConditionDescriptor | null;

    /* eslint-disable @typescript-eslint/naming-convention */
    /**
     * Use to create the Condition instance yourself, especially to support
     * implementations of ICondition that don't implement IConditionCore<ConditionDescriptor>.
     * Only use this when ConditionDescriptor is null.
     * @param requester
     * @returns 
     */
    conditionCreator?: (requester: InputValidatorDescriptor) => ICondition | null;
    /* eslint-enable @typescript-eslint/naming-convention */

    /**
     * The ConditionDescriptor to create an Enabler Condition.
     * An Enabler is a Condition used to determine if validation is enabled.
     * For example, evaluate the state of a checkbox before
     * reporting an error in a textbox associated with that checkbox
     * being checked.
     * Leave it null if not needed.
     * An EnablerDescriptor instance should be considered immutable once assigned here.
     * Use this when the Condition extends IConditionCore<ConditionDescriptor>.
     * Leave null if EnablerCreator is asssigned.
     */
    enablerDescriptor?: ConditionDescriptor | null | undefined;

    /* eslint-disable @typescript-eslint/naming-convention */
    /**
     * Use to create the Condition instance yourself, especially to support
     * implementations of ICondition that don't implement IConditionCore<ConditionDescriptor>.
     * Only use this when EnablerDescriptor is null.
     * @param requester
     * @returns 
     */
    enablerCreator?: (requester: InputValidatorDescriptor) => ICondition | null;
    /* eslint-enable @typescript-eslint/naming-convention */

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
    enabled?: undefined | boolean | ((host: IInputValidator) => boolean);
    /**
     * Resolves the Severity for when the Condition evaluates as NoMatch.
     * Values:
     * * ValidationSeverity itself. Recommended to set to Severe for Required and CanConvertToNativeDataTypeCondition.
     * * Undefined - tells the InputValidator to treat it as Error.
     * * function - Provide a function that will return the ValidationSeverity, 
     *   given the InputValidator as a parameter.
     */
    severity?: undefined | ValidationSeverity | ((host: IInputValidator) => ValidationSeverity);

    /**
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * Tokens are resolved with Services.MessageTokenResolver.
     * It should already be localized, except for the tokens.
     * It can contain HTML tags if the platform supports them. In that case,
     * be sure to use HTML encoded characters.
     * The string shown to the actual user is stored in InputValidatorState.errorMessage.
     * Values:
     * * String - The error message with tokens and optional HTML tags.
     * * function - Returns the error message, given the InputValidator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     * When localization is setup in ErrorMessagel10n, the value can be set to ''
     * so long as your TextLocalizerService ALWAYS returns the text.
     * Otherwise, this should be the fallback.
     * If you have setup defaults for error messages with TextLocalizerService,
     * leave this null to use the default. Any value here supersedes default error messages.
     */
    errorMessage?: undefined | null | string | ((host: IInputValidator) => string);

    /**
     * Localization key for errorMessage. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the errorMessage property is used.
     */
    errorMessagel10n?: string | null | undefined;
    /**
     * Variation of the errorMessage intended to be displayed in a Validation Summary area.
     * A summary is usually not near the field with the error. 
     * As a result, it helps to shape the message differently, usually by including
     * the Label token. "{Label} is required."
     * Values:
     * * undefined and null - use the errorMessage as the template.
     * * String - The error message with tokens and optional HTML tags.
     * * function - Returns the error message, given the InputValidator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     * When localization is setup in SummaryMessagel10n, the value can be set to ''
     * so long as your TextLocalizerService ALWAYS returns the text.
     * Otherwise, this should be the fallback.
     * If you have setup defaults for error messages with TextLocalizerService,
     * leave this null to use the default. Any value here supersedes default error messages.
     */
    summaryMessage?: undefined | null | string | ((host: IInputValidator) => string);

    /**
     * Localization key for summaryMessage. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the errorMessage property is used.
     */
    summaryMessagel10n?: string | null | undefined;
}

/**
 * Result of the validate() function.
 */
export interface InputValidateResult {
    /**
     * The result of validate()
     */
    conditionEvaluateResult: ConditionEvaluateResult;

    /**
     * Assigned with issue details when an issue is found.
     * Null when no issue is found.
     */
    issueFound: IssueFound | null;

    /**
     * When true, validate() bailed before evaluation due to Enabled or Enabler
     */
    skipped?: boolean;
}


export interface IMessageTokenSource {
    /**
     * Returns an array of 0 or more tokens supported by this MessageTokenSource.
     * Each returned has the token supported (omitting {} so {Label} is "Label")
     * and the value in its native data type (such as Date, number, or string).
     * Caller will search the message for each token supplied. If found,
     * it converts the value to a string using localization rules and replaces the token.
     * The TokenLabel doesn't provide {} because we may support additional
     * attributes within the token, like {Value:AbbrevDateFormat}
     */
    getValuesForTokens(valueHost: IInputValueHost, valueHostResolver: IValueHostResolver):
        Array<TokenLabelAndValue>;
}

/**
 * Determines if the source implements IMessageTokenSource, and returns it typecasted.
 * If not, it returns null.
 * @param source 
 */
export function toIMessageTokenSource(source: any): IMessageTokenSource | null {
    if (source && typeof source === 'object') {
        let test = source as IMessageTokenSource;       
        if (test.getValuesForTokens !== undefined)
            return test;
    }
    return null;
}

/**
 * Result from IMessageTokenSource.getValuesForTokens
 */
export interface TokenLabelAndValue {
    /**
     * The text within the {} of the token. Used to match tokens.
     */
    tokenLabel: string;
    /**
     * The value to be used as a replacement. When the value isn't a string,
     * it is converted to a string through 
     * {@link DataTypes/Interfaces!IDataTypeFormatter | IDataTypeFormatter} classes
     * registered with {@link DataTypes/ConcreteClasses/DataTypeServices!DataTypeServices | DataTypeServices}.
     */
    associatedValue: any;
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
    purpose?: 'label' | 'parameter' | 'value' | 'message';
}



/**
 * Factory for generating InputValidator.
 * Most apps will use the standard InputValidator class.
 * This interface targets unit testing with mocks.
 */
export interface IInputValidatorFactory {
    create(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor): IInputValidator;
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
 * Services.DataTypeServices to handle conversion and localization.
 * The "formatterkey" in {token:formatterkey} is actually the same
 * as a {@link DataTypes/LookupKeys | LookupKey } used to identify a data type.
 * Tokens are supplied by implementers of IMessageTokenSource.
 */
export interface IMessageTokenResolver {
    /**
     * Replaces tokens in the message with user friendly values
     * @param message 
     * @param valueHost - makes stateful info available to IMessageTokenSources.
     * @param valueHostResolver
     * @param hosts 
     * @returns the message with formatting resolved
     */
    resolveTokens(message: string, valueHost: IInputValueHost,
        valueHostResolver: IValueHostResolver, ...hosts: Array<IMessageTokenSource>): string;
}