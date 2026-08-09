/**
 * @module jivs-engine/ValueHosts/Types/ValidatorsValueHostBase
 */
import { IValidator, ValidatorConfig } from './Validator';
import {
    IValidatableValueHostBase, IValidatableValueHostBaseCallbacks,
    ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState,
    ValidatableValueHostBaseSetValueOptions,
    toIValidatableValueHostBase, toIValidatableValueHostBaseCallbacks
} from './ValidatableValueHostBase';
import { ValueHostConfig } from './ValueHost';
import { ValueHostType } from './ValueHostFactory';

/**
* Extends ValidatableValueHost to use the Validators class in support of validation.
*/
export interface IValidatorsValueHostBase<TOptions extends ValidatorsValueHostSetValueOptions = ValidatorsValueHostSetValueOptions>
    extends IValidatableValueHostBase<TOptions>  {

    /**
     * Gets an Validator already assigned to this ValidatorsValueHostBase.
     * @param errorCode - The errorCode value assigned to the Validator
     * that you want. Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
    getValidator(errorCode: string): IValidator | null;

    /**
     * Returns the InjectedError supplied by the latest call to setTextValue() or setValues().
     * Its null when not supplied or has been cleared.
     */
    getInjectedError(): InjectedError | null;
    
    /**
     * Attaches the InjectedError to this ValidatorsValueHostBase. It will be used to create a Validator
     * to report the error. If you supply an errorCode, it will be used to localize the error message.
     * If not supplied, know that TextLocalizerService will use the errorCode value of 'InjectedError'
     * to localize the error message. You can also provide a summaryMessage for use in a summary of validation errors.
     * 
     * Alternatively use the options.injectedError property when calling setTextValue() or setValues() 
     * to provide a way to inject.
     * @param injectedError 
     */
    setInjectedError(injectedError: InjectedError): void;

    /**
     * Clears the InjectedError from this ValidatorsValueHostBase. It will no longer be used to create a Validator
     * to report the error.
     */
    clearInjectedError(): void;
    
}
/**
 * Just the data that is used to describe this ValueHost.
 * It should not contain any supporting functions or services.
 * It should be generatable from JSON, and simply gets typed to ValidatorsValueHostBaseConfig.
 * This provides the backing data for each ValidatorsValueHostBase.
 * The server side could in fact supply this object via JSON,
 * allowing the server's Model to dictate this, except values are converted to their native forms
 * like a JSON date is a Date object.
 * However, there are sometimes
 * cases a business rule is client side only (parser error converting "abc" to number)
 * and times when a business rule is server side only (looking for injection attacks
 * for the purpose of logging and blocking.)
 */
export interface ValidatorsValueHostBaseConfig extends ValidatableValueHostBaseConfig {

    /**
     * How to validate based on the business rules.
     * These are used to create actual validator objects.
     * This array may need to host validators that are client-side only,
     * such as parser error converting "abc" to number.
     */
    validatorConfigs: Array<ValidatorConfig> | null;
}


/**
 * Determines if the given ValueHostConfig represents a ValidatableValueHost.
 * @param source 
 * @returns 
 */
export function isValidatableValueHostConfig(source: ValueHostConfig): boolean
{
    return source.valueHostType === ValueHostType.Field ||
        (source as ValidatorsValueHostBaseConfig).validatorConfigs !== undefined;
}

/**
 * Elements of ValidatorsValueHostBase that are stateful based on user interaction
 */
export interface ValidatorsValueHostBaseInstanceState extends ValidatableValueHostBaseInstanceState {
    /**
     * Supplied by options.injectedError when calling setValue() or setValues() to provide a way to inject.
     * If they use formatting or parsing, the injectedError will be set to the 
     * errorDetails from the DataTypeParser.
     */
    injectedError?: InjectedError;
}

export interface ValidatorsValueHostBaseSetValueOptions extends ValidatableValueHostBaseSetValueOptions
{
}


/**
 * Provides callback hooks for the consuming system to supply to IValidatorsValueHostBases.
 */
export interface IValidatorsValueHostBaseCallbacks extends IValidatableValueHostBaseCallbacks {

}

/**
 * Additional options for setTextValue().
 */
export interface ValidatorsValueHostSetValueOptions extends ValidatableValueHostBaseSetValueOptions
{
    /**
     * Provides a way to inject non-condition related error information into the validation system.
     * Create this object with at least one of the properties. It will be used to create an IssueFound object
     * even though no condition is setup. The object supplies localization keys
     * so you can set up the error message and summary message for the current culture
     * in the TextLocalizerService. The errorCode is used to identify the error in the consuming system.
     */
    injectedError?: InjectedError;
}

/**
 * Determines if the object implements IValidatorsValueHostBaseCallbacks.
 * @param source 
 * @returns source typecasted to IValidatorsValueHostBaseCallbacks if appropriate or null if not.
 */
export function toIValidatorsValueHostBaseCallbacks(source: any): IValidatorsValueHostBaseCallbacks | null
{
    if (toIValidatableValueHostBaseCallbacks(source))
    {
        return source as IValidatorsValueHostBaseCallbacks;
    }
    return null;
}

/**
 * Determines if the object implements IValidatorsValueHostBase.
 * @param source 
 * @returns source typecasted to IValidatorsValueHostBase if appropriate or null if not.
 */
export function toIValidatorsValueHostBase(source: any): IValidatorsValueHostBase | null
{
    if (toIValidatableValueHostBase(source))
    {
        const test = source as IValidatorsValueHostBase;    
        // some select members of IValidatorsValueHostBase
        if (test.getValidator !== undefined &&
            test.getInjectedError !== undefined &&
            test.setInjectedError !== undefined &&
            test.clearInjectedError !== undefined   
        )
            return test;
    }
    return null;
}

//#region InjectedErrors

/**
 * Provides a way to inject non-condition related error information into the validation system.
 * This object gets assigned to ValidatableValueHostSetValueOptions.injectedError 
 * or with ValidatableValueHostBase.setInjectedError() and is used by the Validator 
 * to create an IssueFound that is added to the ValueHost's state.
 * 
 * ValidatableValueHostBase.validate() detects it in ValueHost's state and creates a new Validator instance.
 * It still supports localization following the same rules as ValidatorConfig.errorMessagel10n 
 * and ValidatorConfig.summaryMessagel10n.
 */
export interface InjectedError
{
    /**
     * Only value required.
     * Use null to allow a localization lookup without using errorMessagel10n
     */
    errorMessage: string | null;
    /**
     * Set with TextLocalizerService.getErrorMessagel10nText to use
     * a localization setup with TextLocalizerService.registerErrorMessage.
     * Its actual format is "EM-" + errorCode + (dataTypeLookupKey ? "-" + dataTypeLookupKey : "")
     * If you setup text with TextLocalizerService.register(), this value should be set to the same value.
     */
    errorMessagel10n?: string;
    /**
     * It will use the same value as the resolved error message if not supplied.
     * If assigned, it will be used but with summaryMessagel10n supplied, it may be overridden by the localized value.
     */
    summaryMessage?: string;
    /**
     * Set with TextLocalizerService.getSummaryMessagel10nText to use
     * a localization setup with TextLocalizerService.registerSummaryMessage.
     * Its actual format is "SEM-" + errorCode + (dataTypeLookupKey ? "-" + dataTypeLookupKey : "")
     * If you setup text with TextLocalizerService.register(), this value should be set to the same value.
     */
    summaryMessagel10n?: string;
    /**
     * When unassigned, the error code uses the InjectedErrorValidatorErrorCode constant ('InjectedError').
     * Its value is used with localization lookups in TextLocalizerService.getErrorMessagel10nText and TextLocalizerService.getSummaryMessagel10nText.
     */
    errorCode?: string;
}

/**
 * Assigned to the errorCode property of IssueFound when the error was generated from an InjectedError
 * unless the InjectedError.errorCode is assigned, in which case that value is used.
 */
export const InjectedErrorValidatorErrorCode = 'InjectedError';
//#endregion InjectedErrors