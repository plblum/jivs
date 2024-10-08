/**
 * {@inheritDoc Validator/ConcreteClasses!}
 * @module Validator/Types
 */
import { ConditionEvaluateResult, ICondition, ConditionConfig } from './Conditions';
import { BusinessLogicError, IssueFound, ValidateOptions, ValidationSeverity } from './Validation';
import { IGatherValueHostNames } from './ValueHost';
import { IMessageTokenSource } from './MessageTokenSource';
import { IValidatorsValueHostBase } from './ValidatorsValueHostBase';
import { IDisposable } from './General_Purpose';

/**
 * Represents a single validator for the value of an InputValueHost.
 * It is stateless.
 * Basically you want to call validate() to get all of the results
 * of a validation, including ConditionEvaluateResult, error messages,
 * severity, and more.
 * That data ends up in the ValidationManager as part of its state,
 * allowing the system consumer to know how to deal with the data
 * of the ValueHost (save or not) and the UI to display the state.
 */
export interface IValidator extends IDisposable, IMessageTokenSource, IGatherValueHostNames {
    /**
     * Perform validation activity and provide the results including
     * whether there is an error (ConditionEvaluateResult), fully formatted
     * error messages, severity, and Condition type.
     * @param options - Provides guidance on which validators to include.
     * @returns Identifies the ConditionEvaluateResult.
     * If there were any NoMatch cases, they are in the IssuesFound array.
     */
    validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>;

    /**
     * Exposes the Condition behind the validator
     */
    condition: ICondition;

    /**
     * Provides the error code associated with this instance.
     * It uses ValidatorConfig.errorCode when assigned
     * and ConditionType when not assigned.
     */
    errorCode: string;

    /**
     * Gets the conditionType associated with the condition
     */
    conditionType: string;

    /**
     * Use to change the enabled option. It overrides the value from ValidatorConfig.enabled.
     * Use case: the list of validators on InputValueHost might change while the form is active.
     * Add all possible cases to InputValueHost and change their enabled flag here when needed.
     * Also remember that you can use the enabler property on 
     * ValidatorConfig to automatically determine if the validator
     * should run or not. Enabler may not be ideal in some cases though.
     * @param enabled 
     */
    setEnabled(enabled: boolean): void;    

    /**
     * When ValueHost.setBusinessLogicError is called, it provides each entry to the existing
     * list of Validators through this. This function determines if the businessLogicError is
     * actually for the same error code as itself, and returns a ValidatorValidateResult, just
     * like calling validate() itself.
     * The idea is to use the UI's representation of the validator, including its error messages
     * with its own tokens, instead of those supplied by the business logic.
     * @param businessLogicError 
     * @returns if null, it did not handle the BusinessLogicError. If a ValidatorValidateResult,
     * it should be used in the ValueHost's state of validation.
     */
    tryValidatorSwap(businessLogicError: BusinessLogicError): ValidatorValidateResult | null;

}

/**
 * Just the data that is used to describe one validator assigned to a ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to ValidatorConfig.
 * This provides the backing data for each ValidatorInfo.
 * When placed into the ValidatorInfo, it is treated as immutable
 * and can be used as state in React.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this. However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 * 
 * NOTE: extensions of this interface can implement IDisposable knowing
 * that the Validator will call dispose() if supplied, during its own disposal.
 */
export interface ValidatorConfig {
    /**
     * The ValidatorType used by the ValidatorFactory.
     * Leave it null or undefined to use the built-in Validator class.
     */
    validatorType?: string;
    /**
     * Provides the error code associated with this instance.
     * When unassigned, the Validator uses the ConditionType as the error code.
     */
    errorCode?: string;
    
    // -----------------------
    // There are two ways to supply this validator's Condition.
    // 1. Pass a ConditionConfig and we'll create the correct Condition instance
    // registered with the ValidationServices.ConditionFactory.
    // This is limited to Condition instances that implement IConditionCore<ConditionConfig>.
    // 2. Provide a function that will return the instance.
    // This is ideal for when the Condition does not implement IConditionCore<ConditionConfig>
    // such as your custom validation functions that hook back into your business logic.
    // -----------------------

    /** 
    * ConditionConfig that allows the ConditionFactory to provide the Condition.
    * Like all Configs in this system, this is expected to be immutable.
    * Only use this when ConditionCreator is null.
    */
    conditionConfig: ConditionConfig | null;

    /* eslint-disable @typescript-eslint/naming-convention */
    /**
     * Use to create the Condition instance yourself, especially to support
     * implementations of ICondition that don't implement IConditionCore<ConditionConfig>.
     * Only use this when ConditionConfig is null.
     * @param requester
     * @returns 
     */
    conditionCreator?: ConditionCreatorHandler;

    /* eslint-enable @typescript-eslint/naming-convention */

    /**
     * When false, validation is never run. This supersedes the Enabler too.
     * Values:
     * - true/false obviously.
     * - undefined - tells the Validator to treat it as true. (Its value 
     *   will not be updated as we want this to be immutable while the Config
     *   is assigned to the host.)
     * - function - Provide a function that will return true or false, 
     *   given the Validator as a parameter.
     */
    enabled?: undefined | boolean | ((host: IValidator) => boolean);
    /**
     * Resolves the Severity for when the Condition evaluates as NoMatch.
     * Values:
     * - ValidationSeverity enum. Set to Severe by default for conditions with
     *   Category=Require and DataTypeCheck.
     * - Undefined - tells the Validator to treat it as Error.
     * - function - Provide a function that will return the ValidationSeverity, 
     *   given the Validator as a parameter.
     */
    severity?: undefined | ValidationSeverity | ((host: IValidator) => ValidationSeverity);

    /**
     * The error message "template" that will appear on screen when the condition is NoMatch.
     * It can use tokens, which are resolved with current data at the time of validation.
     * Tokens are resolved with Services.MessageTokenResolver.
     * It should already be localized, except for the tokens.
     * It can contain HTML tags if the platform supports them. In that case,
     * be sure to use HTML encoded characters.
     * The string shown to the actual user is stored in ValueHostInstanceState.errorMessage.
     * Values:
     * - String - The error message with tokens and optional HTML tags.
     * - function - Returns the error message, given the Validator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     * When localization is setup in ErrorMessagel10n, the value can be set to ''
     * so long as your TextLocalizerService ALWAYS returns the text.
     * Otherwise, this should be the fallback.
     * If you have setup defaults for error messages with TextLocalizerService,
     * leave this null to use the default. Any value here supersedes default error messages.
     */
    errorMessage?: undefined | null | string | ((host: IValidator) => string);

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
     * - undefined and null - use the errorMessage as the template.
     * - string - The error message with tokens and optional HTML tags.
     * - function - Returns the error message, given the Validator,
     *   allowing you to replace or customize the message during validation.
     *   The function must return a string, although an empty string is valid.
     * When localization is setup in SummaryMessagel10n, the value can be set to ''
     * so long as your TextLocalizerService ALWAYS returns the text.
     * Otherwise, this should be the fallback.
     * If you have setup defaults for error messages with TextLocalizerService,
     * leave this null to use the default. Any value here supersedes default error messages.
     */
    summaryMessage?: undefined | null | string | ((host: IValidator) => string);

    /**
     * Localization key for summaryMessage. Its value will be matched to an entry
     * made to ValidationServices.TextLocalizerService, specific to the active culture.
     * If setup and no entry was found in TextLocalizerService,
     * the value from the errorMessage property is used.
     */
    summaryMessagel10n?: string | null | undefined;

    //!! Interferes with intellisense support for building with known properties    
    // /**
    //  * Handy way to allow users to enter known properties without getting ts errors.
    //  * However, they can improve things if they typecast to the appropriate
    //  * validator's Config.
    //  */
    // [propName: string]: any;    
}

/**
 * Function definition used with ValidatorConfig.conditionCreator.
 */
export type ConditionCreatorHandler = (requester: ValidatorConfig) => ICondition | null;

/**
 * Result of the validate() function.
 */
export interface ValidatorValidateResult {
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
 * Factory for generating Validator.
 * Most apps will use the standard Validator class.
 * This interface targets unit testing with mocks.
 */
export interface IValidatorFactory {
    create(valueHost: IValidatorsValueHostBase, config: ValidatorConfig): IValidator;
    canCreate(config: ValidatorConfig): boolean;
}

