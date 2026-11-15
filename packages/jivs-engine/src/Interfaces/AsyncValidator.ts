/**
 * Async validators are used to perform validation that may involve asynchronous operations, 
 * such as server-side checks or complex computations.
 * 
 * Differences from synchronous validators:
 * - They return results asynchronously via a Promise.
 * - They can have multiple outcomes with different error codes, thus always must return an errorCode and error message.
 *   However, they still support the ErrorMessagesService ability to replace error messages based on those error codes.
 * - Does not use Conditions. User always supplies a function that performs the validation logic asynchronously.
 *   
 * 
 * Expected structures:
 * - AsyncValidatorConfig: Configuration object for the async validator, including the handler function, 
 *   handler identity, and optional payload.
 * - AsyncValidatorEvaluationResult: The result returned by the handler function, indicating the outcome of the validation.
 * - ValidatorValidateResult: The result produced by the AsyncValidator class based on the evaluation result, 
 *   including condition evaluation, issues found, and resolution status.
 * - AsyncValidator: The class responsible for executing the async validation using the provided configuration and handler function.
 *   It is registered within the ValidatorFactory which converts AsyncValidatorConfig into AsyncValidator.
 * - Builder will support it as a member of ValueHostConfigBuilder as asyncValidator().
 * 
 * How to use:
 * - User needs to write a handler function that matches the AsyncValidatorEvaluateHandler type.
 *   - The promise must always resolve with an AsyncValidatorEvaluationResult, even if an error occurs internally
 *     including an exception.
 *   - The resolved AsyncValidatorEvaluationResult should accurately reflect the outcome of the validation, 
 *     including any errors or failures to resolve.
 * - User assigns that handler function to AsyncValidatorConfig.handler and provides a name via AsyncValidatorConfig.handlerIdentity.
 *   Both are required configuration values.
 * - Since the async operation often depends on other systems and services that the validator does not have,
 *   the user can provide an object representing that external context via the payload property of AsyncValidatorConfig.
 * - The AsyncValidator class itself implements its validate() function to:
 *      - call the handler function provided in the configuration with the appropriate value host, value hosts manager, and payload.
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
 * Planned Builder support:
 * - ValueHostConfigBuilder.asyncValidator() will allow adding an async validator to a value host configuration.
 * - It will take these parameters:
 *   - handlerIdentity: string
 *   - handler: AsyncValidatorEvaluateHandler
 *   - payload?: unknown
 *   - dependencyValueHostNames?: ValueHostName[]
 * - It does not take errorcode, errormessage or severity, unlike other validators, because those are all
 *   resolved by the handler function.
 * 
 * Example handler:
 * ```ts
 * // Illustrative application code; AvailabilityApi is application-defined.
 * const evaluateAvailability: AsyncValidatorEvaluateHandler = async (host, manager, payload) => {
 *     try {
 *         const api = requireAvailabilityApi(payload);
 *         const available = await api.isAvailable(host.getValue());
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
 *             failedToResolve: error as Error
 *         };
 *     }
 * };
 * ```
 * @module jivs-engine/Types/AsyncValidator
 */

import { ValueHostName } from '../DataTypes/BasicTypes';
import { ConditionEvaluateResult } from './Conditions';
import { ValidationSeverity } from './Validation';
import { ValidatorConfig, ValidatorConfigBase, ValidatorType } from './Validator';
import { IValidatorsValueHost } from './ValidatorsValueHostBase';
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
     */
    handlerIdentity: string;
    /**
     * The handler function that performs the asynchronous validation logic.
     * It should return a Promise resolving to an AsyncValidatorEvaluationResult indicating the outcome of the validation.
     * Expectations of the function:
     * - Always returns a promise that will always resolve, not reject. 
     * - All thrown errors must be caught and are expected to return AsyncValidatorEvaluationResult.failedToResolve is assigned
     *   and an error code and error message.
     * - All failed API calls should do the same as caught errors, returning AsyncValidatorEvaluationResult.failedToResolve is assigned
     *   
     * - Only set errorCode and errorMessage on ConditionEvaluateResult.NoMatch or failedToResolve is assigned.
     * - The error message can support the "{Label}" token, to be replaced by the field label.
     */
    handler: AsyncValidatorEvaluateHandler;
    /**
     * Optional payload to be passed to the handler function during evaluation.
     * This can be any data that the handler function requires to execute its async process, such
     * as objects to call upon an API.
     */
    payload?: unknown;
    /**
     * Optional array of value host names that this validator depends on.
     * If your function gets values from the ValueHostsManager to perform its validation, 
     * list the names of those value hosts. When those value hosts change, the validator may be re-evaluated accordingly.
     */
    dependencyValueHostNames?: ValueHostName[];
}

/**
 * Represents the result of an asynchronous validation evaluation.
 * There are effectively four possible outcomes for an asynchronous validation evaluation:
 * 1. ConditionEvaluateResult.Match: The validation passed successfully.
 * 2. ConditionEvaluateResult.NoMatch: The validation failed, with an optional error code and message.
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
     * Assign when ConditionEvaluateResult is NoMatch or failedToResolve is assigned.
     */
    errorCode?: string;
    /**
     * The error message associated with the validation result, if any.
     * Assign when ConditionEvaluateResult is NoMatch or failedToResolve is assigned.
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
     * While you can supply ValidationSeverity = Severe, its feature is limited as it cannot stop processing
     * later validators in the ValueHost. Its use is to land in the IssueFound object for its consumers.
     */
    severity?: ValidationSeverity;
    /**
     * Indicates whether the validation could not be completed due to an error or failed API call.
     * Always assign when an exception occurs or an external API call fails during validation.
     * When assigned, always set errorcode and errormessage, both which are logged.
     */
    failedToResolve?: Error;
}

/**
 * Represents the handler function for evaluating an asynchronous validator.
 * It takes the value host, value hosts manager, and an optional payload as input,
 * and returns a promise that resolves to an AsyncValidatorEvaluationResult.
 */
export type AsyncValidatorEvaluateHandler = (
    valueHost: IValidatorsValueHost,
    valueHostsManager: IValueHostsManager,
    payload: unknown
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
        asyncConfig.handlerIdentity !== undefined
    )
        return true;
    return false;
}