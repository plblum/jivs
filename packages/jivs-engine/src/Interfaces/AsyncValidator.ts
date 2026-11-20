/**
 * Async validators are used to perform validation that may involve asynchronous operations, 
 * such as server-side checks or complex computations.
 * 
 * Differences from synchronous validators:
 * - They return results asynchronously via a Promise.
 * - They can have multiple outcomes with different error codes. A NoMatch must include an error code and message.
 *   However, they still support the ErrorMessagesService ability to replace error messages based on those error codes.
 * - Does not use Conditions. User always supplies a function that performs the validation logic asynchronously.
 *   
 * 
 * Expected structures:
 * - AsyncValidatorConfig: Configuration object for the async validator, including the handler function
 *   and handler identity.
 * - AsyncValidatorEvaluationResult: The result returned by the handler function, indicating the outcome of the validation.
 * - ValidatorValidateResult: The result produced by the AsyncValidator class based on the evaluation result, 
 *   including condition evaluation, issues found, and resolution status.
 * - AsyncValidator: The class responsible for executing the async validation using the provided configuration and handler function.
 *   It is registered within the ValidatorFactory which converts AsyncValidatorConfig into AsyncValidator.
 * - IssueFound: Uses the asyncIdentity property to align issues with the corresponding async validator handler.
 *   Its value always comes from AsyncValidatorConfig.handlerIdentity.
 * - Builder will support it as a member of ValueHostConfigBuilder as asyncValidator().
 * 
 * How to use:
 * - User needs to write a handler function that matches the AsyncValidatorEvaluateHandler type.
 *   - Return a promise that resolves with an AsyncValidatorEvaluationResult.
 *   - Jivs logs unexpected throws and rejections and reports a blocking failure.
 *   - The supplied AbortSignal can be passed to APIs that support cancellation.
 * - User assigns that handler function to AsyncValidatorConfig.handler and provides a name via AsyncValidatorConfig.handlerIdentity.
 *   Both are required configuration values.
 * - To access application services, capture them in the handler's closure or retrieve them
 *   from the ValueHostsManager's metadata. See the validator configuration guide for examples.
 * - The AsyncValidator class itself implements its validate() function to:
 *      - call the handler function provided in the configuration with the appropriate value host and value hosts manager.
 *      - handle the Promise returned by the handler.
 *      - If the handler returns ConditionEvaluateResult.Match, it indicates a successful validation and it sets up
 *        a ValidatorValidateResult indicating success. No errorcode or error message is expected.
 *      - If the handler returns ConditionEvaluateResult.NoMatch, it indicates a failed validation and it sets up
 *        a ValidatorValidateResult with ConditionEvaluateResult.NoMatch and and IssueFound that gets its 
 *        details from the AsyncValidatorEvaluationResult returned by the handler. The AsyncValidator will 
 *        address localization and token resolution.
 *      - If the handler returns ConditionEvaluateResult.Undetermined, it indicates that this validator can be ignored 
 *        and no error is recorded, just like normal validation.
 *      - If the handler returns failedToResolve is assigned, it indicates that the async operation could not be completed successfully.
 *        This is the case when a API call fails or there is an exception caught.
 *        The AsyncValidator should find details in the Error object and pass them to 
 *        the log as a LoggingLevel.Error. It should set ValidatorValidateResult.ConditionEvaluateResult = Undetermined.
 *        and ValidatorValidateResult.failedToResolve is assigned.
 *        The caller should treat this case as IsValid = false, doNotSave = true, blocking further processing.
 * 
 * Builder support:
 * - ValueHostConfigBuilder.asyncValidator() will allow adding an async validator to a value host configuration.
 * - It will take these parameters:
 *   - handlerIdentity: string
 *   - handler: AsyncValidatorEvaluateHandler
 *   - options?: { remaining AsyncValidatorConfig properties }
 * - It does not take errorcode, errormessage or severity, unlike other validators, because those are all
 *   resolved by the handler function.
 * 
 * Example handler:
 * ```ts
 * // Illustrative application code; availabilityApi is an application-owned service.
 * const evaluateAvailability: AsyncValidatorEvaluateHandler = async (host, manager, abortSignal) => {
 *     try {
 *         const available = await availabilityApi.isAvailable(host.getValue(), abortSignal);
 *         
 *         return available
 *             ? { conditionEvaluateResult: ConditionEvaluateResult.Match }
 *             : {
 *                 conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
 *                 errorCode: 'NameTaken',
 *                 errorMessage: 'This name is already in use.'
 *             };
 *     }
 *     catch (error) {
 *         return {
 *             conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
 *             failedToResolve: error instanceof Error ? error : new Error(String(error))
 *         };
 *     }
 * };
 * ```
 * @module jivs-engine/Types/AsyncValidator
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionEvaluateResult } from './Conditions';
import { ValidateOptions, ValidationSeverity } from './Validation';
import { IValidator, ValidatorConfig, ValidatorConfigBase, ValidatorType, ValidatorValidateResult } from './Validator';
import { IValidatorsValueHost } from './ValidatorsValueHostBase';
import { IValueHost } from './ValueHost';
import { IValueHostsManager } from './ValueHostsManager';

/**
 * ValidatorConfig implementation for AsyncValidator.
 */
export interface AsyncValidatorConfig extends Omit<ValidatorConfig, 'errorCode' | 'conditionConfig' | 'conditionCreator' | 'errorMessage' | 'errorMessagel10n' | 'summaryMessage' | 'summaryMessagel10n'>
{
    /**
     * Required name for this configuration. It becomes the effective IValidator.errorCode
     * but async results use a separate error code because they can have many different outcomes.
     * Suggested name is the name of the handler or the validation logic it represents.
     * This value will be used to populate the asyncIdentity property in IssueFound 
     * for issues generated by this async validator.
     */
    handlerIdentity: string;
    /**
     * The handler function that performs the asynchronous validation logic.
     * It should return a Promise resolving to an AsyncValidatorEvaluationResult indicating the outcome of the validation.
     * Expectations of the function:
     * - Return a promise resolving to a result. Unexpected throws and rejections are logged
     *   and reported as blocking failures.
     * - An operational failure can be reported using AsyncValidatorEvaluationResult.failedToResolve.
     *   Supply errorCode, errorMessage, and severity to customize its displayed issue; otherwise
     *   the AsyncValidatorConfig and global async-validation settings provide fallbacks.
     * - Set errorCode and errorMessage for ConditionEvaluateResult.NoMatch.
     * - The error message can support the "{Label}" token, to be replaced by the field label.
     */
    handler: AsyncValidatorEvaluateHandler;
    /**
     * Fallback issue code for an operational failure when the handler result does not supply one.
     * The code is used to look up a localized message through ErrorMessagesService.
     */
    failedToResolveErrorCode?: string;
    /**
     * Unlocalized fallback issue text for an operational failure when the handler result does not supply one.
     */
    failedToResolveErrorMessage?: string;
    /**
     * Fallback severity for an operational failure when the handler result does not supply one.
     * Warning is normalized to Error because an unresolved failure blocks saving.
     */
    failedToResolveSeverity?: ValidationSeverity;
    /**
     * Optional array of value host names that this validator depends on.
     * If your function gets values from the ValueHostsManager to perform its validation, 
     * list the names of those value hosts. When those value hosts change, the validator may be re-evaluated accordingly.
     */
    dependencyValueHostNames?: ValueHostName[];

    /**
     * Behavior when AsyncValidator.validate() is called
     * but there is already a pending validation in progress.
     * If undefined, it uses RestartWhenPending.WhenInputsChanged as the default behavior.
     */
    restartWhenPending?: RestartWhenPending;

    /**
     * Controls whether this validator should be skipped during model-level validation.
     * If true, the validator will not be executed as part of model-level validation.
     * Only use it if the server side covers the same validation, making it unnecessary to
     * wait for client-side validation.
     * If undefined or false, the validator will be executed during model-level validation.
     */
    skipOnModelLevelValidation?: boolean;

    /**
     * The maximum time, in milliseconds, for an async evaluation.
     * If the evaluation does not complete within this time, it will act as an error
     * that blocks validation. Its value will default to IJivsServices.settings.asyncValidation.timeout.
     * The failure issue uses the same handler, validator-config, and global message fallbacks as
     * other failedToResolve outcomes.
     */
    timeout?: number;
}

/**
 * Supports AsyncValidatorConfig.restartWhenPending property
 * to indicate what happens when AsyncValidator.validate() is called but it already
 * has a pending validation in progress.
 */
export enum RestartWhenPending
{
    /**
     * Indicates that the validator should restart only when the inputs have changed
     * since the last validation. If not, the validator will not restart and will continue with the pending validation.
     */
    WhenInputsChanged = 0,
    /**
     * Indicates that the validator should always restart regardless of input changes.
     */
    Always = 1
}

/**
 * Represents the result of an asynchronous validation evaluation.
 * There are effectively four possible outcomes for an asynchronous validation evaluation:
 * 1. ConditionEvaluateResult.Match: The validation passed successfully.
 * 2. ConditionEvaluateResult.NoMatch: The validation failed, with a required error code and message.
 * 3. failedToResolve is assigned: The validation could not be completed due to an error or failed API call.
 * 4. ConditionEvaluateResult.Undetermined: The validation could not determine a result, such as input values are missing.
 */
export interface AsyncValidatorEvaluationResult
{
    /**
     * The result of the condition evaluation.
     */
    conditionEvaluateResult: ConditionEvaluateResult;
    /**
     * The error code associated with the validation result, if any.
     * Required when ConditionEvaluateResult is NoMatch. When failedToResolve is assigned, it
     * optionally identifies the operational-failure issue and its localization lookup.
     */
    errorCode?: string;
    /**
     * The error message associated with the validation result, if any.
     * Required when ConditionEvaluateResult is NoMatch. When failedToResolve is assigned, it
     * optionally provides unlocalized fallback text for the operational-failure issue.
     * It can contain the "{Label}" token which will be replaced with the appropriate ValueHost.label during evaluation.
     * The caller will:
     * - Apply HTML encoding.
     * - Localize or otherwise process the error message through the ErrorMessagesService based on the errorCode.
     * - Replace the "{Label}" token with the appropriate ValueHost.label.
     */
    errorMessage?: string;
    /**
     * The severity level of the validation result, if any.
     * If not supplied, it uses ValidationSeverity = Error.
     * For failedToResolve, Warning is normalized to Error because the operation blocks saving.
     * While you can supply ValidationSeverity = Severe, its feature is limited as it cannot stop processing
     * later validators in the ValueHost. Its use is to land in the IssueFound object for its consumers.
     */
    severity?: ValidationSeverity;
    /**
     * Indicates whether the validation could not be completed due to an error or failed API call.
     * Always assign when an exception occurs or an external API call fails during validation.
     * The Error is logged and never displayed. To customize the user-facing issue, also provide
     * errorCode, errorMessage, and/or severity. Missing values use AsyncValidatorConfig and global
     * async-validation fallbacks.
     */
    failedToResolve?: Error;
}

/**
 * Represents the handler function for evaluating an asynchronous validator.
 * It takes the value host and value hosts manager as input,
 * and returns a promise that resolves to an AsyncValidatorEvaluationResult.
 * Pass the abortSignal to supported APIs so they can stop work when Jivs cancels.
 */
export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    abortSignal: AbortSignal
) => Promise<AsyncValidatorEvaluationResult>;

/**
 * Confirms that the config represents an asynchronous validator
 * even if its validatorType is not explicitly set to AsyncValidator.
 * @param valConfig 
 * @returns 
 */
export function isAsyncValidatorConfig(valConfig: ValidatorConfigBase): boolean
{
    if (valConfig.validatorType === ValidatorType.AsyncValidator)
        return true;
    let asyncConfig = valConfig as AsyncValidatorConfig;
    if (asyncConfig.handlerIdentity !== undefined &&
        asyncConfig.handler !== undefined
    )
        return true;
    return false;
}

/**
 * Represents the context for a pending asynchronous validation operation.
 * Each AsyncValidator owns and exposes its own PendingContext to track its 
 * ongoing asynchronous validation operation.
 */
export interface IPendingContext
{
    readonly promise: Promise<ValidatorValidateResult>;
    readonly abortController: AbortController;
    inputChanged(valueHostsManager: IValueHostsManager): boolean;
 //   inputs: CapturedValueHostCounter[];
    dispose(): void;
}

/**
 * Represents an asynchronous validator that extends the base IValidator interface.
 */
export interface IAsyncValidator extends IValidator
{
    /**
     * The pending context for this asynchronous validator.
     * It is null if there is no ongoing asynchronous validation operation.
     * Its data is considered readonly to consumers of the asynchronous validator
     * as its entirely managed by the asynchronous validator itself.
     */
    readonly pendingContext: IPendingContext | null;

    /**
     * Call prior to validate() to determine if there is a pending asynchronous validation 
     * operation that this validator is responsible for.
     * This will use the AsyncValidatorConfig.restartWhenPending property to 
     * determine how to handle the pending operation.
     * When RestartWhenPending.WhenInputsChanged is specified, it will check if 
     * the input values have changed since the pending operation started.
     *    - If no change, it returns true indicating the validator is still responsible for the pending operation.
     *    - If there is a change, it works like restartWhenPending.Always is specified.
     * When RestartWhenPending.Always is specified, it will close out the pending operation
     * and return false, indicating the validator is no longer responsible for the pending operation.
     * 
     * The caller (ValueHostsManager.validator()) should skip calling its validate()
     * method if this function returns true, indicating that the validator is still responsible for the pending operation.
     * 
     * @param validatorOptions - Uses the isModelLevel property to support its
     * AsyncValidatorConfig.skipOnModelLevelValidation property.
     */
    isPendingResponsible(validatorOptions: ValidateOptions): boolean;
}

export function isAsyncValidator(validator: IValidator): validator is IAsyncValidator
{
    return 'pendingContext' in validator &&
        'isPendingResponsible' in validator &&
        typeof validator.isPendingResponsible === 'function';
}