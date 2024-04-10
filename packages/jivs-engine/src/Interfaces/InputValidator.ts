/**
 * {@inheritDoc InputValidator/ConcreteClasses!}
 * @module InputValidator/Types
 */
import { ConditionEvaluateResult, ICondition, ConditionDescriptor } from './Conditions';
import { IssueFound, ValidateOptions, ValidationSeverity } from './Validation';
import { IGatherValueHostNames } from './ValueHost';
import { IMessageTokenSource } from './MessageTokenSource';
import { IInputValueHost } from './InputValueHost';

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
export interface IInputValidator extends IMessageTokenSource, IGatherValueHostNames {
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

    /**
     * Gets the conditionType associated with the condition
     */
    conditionType: string;

    /**
     * Use to change the enabled option. It overrides the value from InputValidatorDescriptor.enabled.
     * Use case: the list of validators on InputValueHost might change while the form is active.
     * Add all possible cases to InputValueHost and change their enabled flag here when needed.
     * Also remember that you can use the enabler property on 
     * InputValidatorDescriptor to automatically determine if the validator
     * should run or not. Enabler may not be ideal in some cases though.
     * @param enabled 
     */
    setEnabled(enabled: boolean): void;    

    /**
     * Use to change the errorMessage and/or errorMessagel10n values. 
     * It overrides the values from InputValidatorDescriptor.errorMessage and errorMessagel10n.
     * Use case: Business logic supplies a default values for errorMessage and errorMessagel10n which the UI needs to change.
     * @param errorMessage  - If undefined, reverts to InputValidatorDescriptor.errorMessage.
     * If null, does not make any changes.
     * @param errorMessagel10n  - If undefined, reverts to InputValidatorDescriptor.errorMessagel10n.
     * If null, does not make any changes.
     */
    setErrorMessage(errorMessage: string | undefined, errorMessagel10n?: string | undefined): void;

    /**
     * Use to change the summaryMessage and/or summaryMessagel10n values. 
     * It overrides the values from InputValidatorDescriptor.summaryMessage and summaryMessagel10n.
     * Use case: Business logic supplies a default values for summaryMessage and summaryMessagel10n which the UI needs to change.
     * @param summaryMessage  - If undefined, reverts to InputValidatorDescriptor.summaryMessage.
     * If null, does not make any changes.
     * @param summaryMessagel10n  - If undefined, reverts to InputValidatorDescriptor.summaryMessagel10n.
     * If null, does not make any changes.
     */
    setSummaryMessage(summaryMessage: string | undefined, summaryMessagel10n?: string | undefined): void;    

    /**
     * Use to change the severity option. It overrides the value from InputValidatorDescriptor.severity.
     * Use case: Business logic supplies a default value for severity which the UI needs to change.
     * @param severity 
     */
    setSeverity(severity: ValidationSeverity): void;    

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

    /**
     * Handy way to allow users to enter known properties without getting ts errors.
     * However, they can improve things if they typecast to the appropriate
     * inputValidator's Descriptor.
     */
    [propName: string]: any;    
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

/**
 * Factory for generating InputValidator.
 * Most apps will use the standard InputValidator class.
 * This interface targets unit testing with mocks.
 */
export interface IInputValidatorFactory {
    create(valueHost: IInputValueHost, descriptor: InputValidatorDescriptor): IInputValidator;
}

