/**
 * Asynchronous validator for performing validation that may involve asynchronous operations.
 * 
 * @module jivs-engine/Validation/ConcreteClasses/AsyncValidator
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { AsyncValidatorConfig, AsyncValidatorEvaluationResult, IAsyncValidator, IPendingContext, RestartWhenPending } from '../Interfaces/AsyncValidator';
import { ConditionCategory, ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { IJivsServices } from '../Interfaces/JivsServices';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggingService';
import { IssueFound, ValidateOptions, ValidationSeverity } from '../Interfaces/Validation';
import type { ValidatorValidateResult } from '../Interfaces/Validator';
import { IValidatorsValueHost } from '../Interfaces/ValidatorsValueHostBase';
import { IValueHost } from '../Interfaces/ValueHost';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { encodeHtml } from '../Services/HtmlMessageTokenResolverService';
import { assertNotEmptyString, assertNotNull, CodingError, ensureError } from '../Utilities/ErrorHandling';
import { LoggingFacade } from '../Utilities/LoggingFacade';
import { Validator } from './Validator';
import { ValidatorBase } from './ValidatorBase';

/**
 * An asynchronous implementation of the IValidator interface.
 * This class is intended to perform validation that may involve asynchronous operations.
 * 
 * See {@see jivs-engine/Validation/Types/AsyncValidator} for usage details.
 */
export class AsyncValidator extends ValidatorBase<AsyncValidatorConfig>
    implements IAsyncValidator
{

    constructor(valueHost: IValidatorsValueHost, config: AsyncValidatorConfig)
    {
        super(valueHost, config);
        assertNotEmptyString(config.handlerIdentity);
        assertNotNull(config.handler);

        this._condition = new InternalConditionForAsyncValidator(config.handlerIdentity);
    }


    public get errorCode(): string
    {
        return this.config.handlerIdentity;
    }
    protected resolveErrorCodeForLogger(): string
    {
        return this.config.handlerIdentity
    }

    public get conditionType(): string
    {
        return this.config.handlerIdentity;
    }
    private _condition: ICondition;
    public get condition(): ICondition
    {
        return this._condition;
    }

    public override dispose(): void
    {
        this._disposed = true;
        this.cancelPending();
        super.dispose();
        this._condition = undefined as any;
    }
    private _disposed = false;

    /**
     * The pending context for this asynchronous validator.
     * It is null if there is no ongoing asynchronous validation operation.
     * Its data is considered readonly to consumers of the asynchronous validator
     * as its entirely managed by the asynchronous validator itself.
     */
    public get pendingContext(): IPendingContext | null
    {
        return this._pendingContext;
    }
    private _pendingContext: IPendingContext | null = null;

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
     * The ValueHost should reuse pendingContext.promise instead of calling validate()
     * when this returns true.
     * 
     * @param validatorOptions - Uses the isModelLevel property to support its
     * AsyncValidatorConfig.skipOnModelLevelValidation property.
     */
    public isPendingResponsible(validatorOptions: ValidateOptions): boolean
    {
        if (validatorOptions.isModelLevel && this.config.skipOnModelLevelValidation)
        {
            this.cancelPending();
            return false;
        }

        if (!this.pendingContext)
            return false;
        if (!this.enabled || validatorOptions.preliminary || validatorOptions.duringEdit)
            return false;
        const responsible = (this.config.restartWhenPending ?? RestartWhenPending.WhenInputsChanged) ===
            RestartWhenPending.WhenInputsChanged &&
            !this.pendingContext.inputChanged(this.valueHostsManager);
        if (responsible)
            return true;

        this.cancelPending();
        return false;
        
    }

    /**
     * Async validation method that performs the validation operation based on the provided options.
     * It offloads the work to AsyncValidationOperation for asynchronous processing.
     * 
     * It is designed to handle concurrent validation requests and manage pending validation operations efficiently.
     * It is built around PendingContext, which tracks the state of ongoing validation operations and helps manage their lifecycle.
     * If PendingContext indicates that a validation operation is already in progress, it will return the existing promise instead of starting a new operation.
     * Otherwise it will initiate a new validation operation using AsyncValidationOperation and track it with PendingContext.
     * 
     * @param options The validation options to use for this validation operation.
     * @returns The result of the validation operation, which can be either a synchronous result or a promise that resolves to the result.
     */
    public validate(options: ValidateOptions): ValidatorValidateResult | Promise<ValidatorValidateResult>
    {
        assertNotNull(options);
        if (this._disposed)
            throw new CodingError('AsyncValidator has been disposed');
        if (options.isModelLevel && this.config.skipOnModelLevelValidation)
        {
            this.cancelPending();
            return skipped();
        }
        if (!this.enabled || options.preliminary || options.duringEdit)
            return skipped();
        if (this.pendingContext)
            return this.pendingContext.promise;

        const context = new PendingContext(this.valueHost, this.config);
        // The operation retains the logger so late failures can be reported after disposal.
        const operation = new AsyncValidationOperation(
            context, this.config, this.services, this.logger,
            result => this.resolveValidationResult(result),
            error => this.createFailedToResolveResult(error),
            () => this.forgetIfCurrent(context));
        // Register before invoking the handler, which may synchronously reenter validation.
        this._pendingContext = context;
        operation.start(() => this.config.handler.call(
            undefined, this.valueHost, this.valueHostsManager, context.abortController.signal));
        return context.promise;
    }

    protected resolveValidationResult(result: AsyncValidatorEvaluationResult): ValidatorValidateResult
    {
        const identity = this.config.handlerIdentity;

        if (result.failedToResolve)
        {
            this.logger.error(result.failedToResolve);
            return this.createFailedToResolveResult(result.failedToResolve, result);
        }
        switch (result.conditionEvaluateResult)
        {
            case ConditionEvaluateResult.NoMatch:
                if (!result.errorMessage)
                    throw new CodingError(`Validator ${identity} must return an error message for NoMatch condition`);
                if (!result.errorCode)
                    throw new CodingError(`Validator ${identity} must return an error code for NoMatch condition`);
                let errorMessage = this.resolveErrorMessage(result);
                let severity = this.resolveSeverity(result.severity);
                let issueFound = this.createIssueFound();
                issueFound.doNotSave = severity !== ValidationSeverity.Warning;
                issueFound.errorCode = result.errorCode;
                issueFound.errorMessage = errorMessage;
                issueFound.summaryMessage = errorMessage;
                issueFound.severity = severity;
                return {
                    issueFound: issueFound,
                    conditionEvaluateResult: result.conditionEvaluateResult
                };
            default:
                return {
                    issueFound: null,
                    conditionEvaluateResult: result.conditionEvaluateResult
                }
        }
    }

    protected createFailedToResolveResult(
        error: Error,
        failureDetails?: Pick<AsyncValidatorEvaluationResult, 'errorCode' | 'errorMessage' | 'severity'>
    ): ValidatorValidateResult
    {
        const settings = this.services.settings.asyncValidation;
        const errorCode = failureDetails?.errorCode ||
            this.config.failedToResolveErrorCode ||
            settings.failedToResolveErrorCode;
        const messageResult: AsyncValidatorEvaluationResult = {
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            errorCode,
            errorMessage: failureDetails?.errorMessage ||
                this.config.failedToResolveErrorMessage ||
                settings.failedToResolveErrorMessage
        };
        const errorMessage = this.resolveErrorMessage(messageResult);
        let severity = this.resolveSeverity(
            failureDetails?.severity ??
                this.config.failedToResolveSeverity ??
                settings.failedToResolveSeverity);
        if (severity === ValidationSeverity.Warning)
            severity = ValidationSeverity.Error;

        const issueFound = this.createIssueFound();
        issueFound.errorCode = errorCode;
        issueFound.errorMessage = errorMessage;
        issueFound.summaryMessage = errorMessage;
        issueFound.severity = severity;
        issueFound.doNotSave = true;
        return {
            issueFound,
            conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
            failedToResolve: error
        };
    }

    /**
     * Resolves the errorMessage using localization based on errorCode and resolving tokens.
     * @returns Error message from errorMessage property with localization applied
     * if ErrorMessagel10n is setup.
     */
    protected resolveErrorMessage(result: AsyncValidatorEvaluationResult): string {
        const identity = this.config.handlerIdentity;
        let cultureId = this.valueHostsManager.behaviors.activeCultureId!;
        let errorCode = result.errorCode ?? this.errorCode;

        let msg = this.services.errorMessagesService.getErrorMessage(cultureId,
            errorCode, this.valueHost.getDataType()) ?? result.errorMessage;

        if (msg == null) {
            msg = Validator.errorMessageMissing;
            this.logger.log(LoggingLevel.Error, () => {
                return {
                    message: `Error message missing for Validator ${identity} using this error code ${errorCode}`,
                    category: LoggingCategory.Configuration
                };
            });

        }
        msg = encodeHtml(msg);
        msg = this.services.messageTokenResolverService.resolveTokens(
            msg, this.valueHost, this.valueHostsManager, this);                
            
        return msg;
    }
    private cancelPending(): void
    {
        const context = this._pendingContext;
        if (!context)
            return;
        // An abort listener may synchronously start a replacement.
        this._pendingContext = null;
        context.abortController.abort();
    }

    private forgetIfCurrent(context: PendingContext): void
    {
        if (this._pendingContext === context)
            this._pendingContext = null;
    }
    protected override updateIssueFoundWhenNoMatch(issueFound: IssueFound, valueHost: IValueHost): void
    {
        issueFound.errorMessage = this.services.messageTokenResolverService.resolveTokens(
            issueFound.errorMessage, this.valueHost, this.valueHostsManager, this);       
    }
    

    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
        for (const name of this.config.dependencyValueHostNames ?? [])
            collection.add(name);
    }

    /**
     * Maps an external issue to this validator when their async identities match.
     * @returns The mapped result, or null when the identities do not match.
     */
    public override tryValidatorSwap(externalIssueFound: IssueFound): ValidatorValidateResult | null
    {
        if (externalIssueFound.asyncIdentity != null && // null/undefined
            externalIssueFound.asyncIdentity === this.config.handlerIdentity)
        {
            const issueFound = this.createIssueFound();   // set up as if ConditionEvaluateResult.Undetermined
            issueFound.severity = this.resolveSeverity(externalIssueFound.severity);
            issueFound.errorMessage = externalIssueFound.errorMessage;
            issueFound.summaryMessage = externalIssueFound.summaryMessage;
            issueFound.doNotSave = externalIssueFound.doNotSave || externalIssueFound.severity !== ValidationSeverity.Warning;
            issueFound.errorCode = externalIssueFound.errorCode ?? this.errorCode;
            const resultState: ValidatorValidateResult = {
                conditionEvaluateResult: ConditionEvaluateResult.NoMatch,
                issueFound: issueFound
            };
            return resultState;
        }
        return null;
    }
    /**
     * Creates a base representation of an issue found for an async validator.
     * @returns An issue associated with this validator and its ValueHost.
     */
    protected createIssueFound(): IssueFound {
        return {
            asyncIdentity: this.config.handlerIdentity,
            valueHostName: this.valueHost.getName(),
            severity: ValidationSeverity.Error,
            errorMessage: '',
            doNotSave: true
        };
    }

}

/**
 * Manages the callbacks and settlement of one validation operation.
 */
class AsyncValidationOperation
{
    constructor(
        private readonly context: PendingContext,
        private readonly config: AsyncValidatorConfig,
        private readonly services: IJivsServices,
        private readonly logger: LoggingFacade,
        private readonly resolveResult: (result: AsyncValidatorEvaluationResult) => ValidatorValidateResult,
        private readonly createFailureResult: (error: Error) => ValidatorValidateResult,
        private readonly forget: () => void)
    {
        this.context.promise = new Promise<ValidatorValidateResult>(resolve => { this.resolvePending = resolve; });
    }

    private finished = false;
    private timer!: ReturnType<typeof setTimeout>;
    private resolvePending!: (result: ValidatorValidateResult) => void;

    private get timeout(): number
    {
        let timeout = this.config.timeout ?? this.services.settings.asyncValidation.timeout;
        if (timeout <= 0)
            timeout = 5000;
        return timeout;
    }

    public start(handler: () => Promise<AsyncValidatorEvaluationResult>): void
    {
        const signal = this.context.abortController.signal;
        this.timer = setTimeout(() => this.handleTimeout(), this.timeout);
        signal.addEventListener('abort', this.onAbort);
        if (signal.aborted)
            this.onAbort();
        if (!this.finished)
        {
            // The executor catches a synchronous throw and adopts the handler's Promise.
            const handlerPromise = new Promise<AsyncValidatorEvaluationResult>(resolve => resolve(handler()));
            handlerPromise.then(result => this.handleResult(result), reason => this.handleFailure(reason));
        }
    }

    private readonly onAbort = (): void => { this.finish(skipped()); };

    private handleTimeout(): void
    {
        const error = new Error('Async validation timed out');
        if (this.finish(this.createFailureResult(error)))
        {
            reportFailureSafely(error, this.logger);
            // Settle as a failure before aborting, so abort cannot turn it into a skip.
            this.context.abortController.abort(error);
        }
    }

    private handleResult(result: AsyncValidatorEvaluationResult): void
    {
        try
        {
            if (!result || ![
                ConditionEvaluateResult.Match,
                ConditionEvaluateResult.NoMatch,
                ConditionEvaluateResult.Undetermined
            ].includes(result.conditionEvaluateResult))
                throw new CodingError('Invalid async validator result');
            if (this.finished)
            {
                if (result.failedToResolve)
                    reportUnexpectedLateFailureSafely(result.failedToResolve, this.context.abortController.signal, this.logger);
                return;
            }
            this.finish(this.resolveResult(result));
        }
        catch (error)
        {
            this.handleFailure(error);
        }
    }

    private handleFailure(reason: unknown): void
    {
        if (this.finished)
        {
            reportUnexpectedLateFailureSafely(reason, this.context.abortController.signal, this.logger);
            return;
        }
        const error = ensureError(reason);
        this.finish(this.createFailureResult(error));
        reportFailureSafely(error, this.logger);
    }

    private finish(result: ValidatorValidateResult): boolean
    {
        // Only the first completion may settle this operation or clear its resources.
        if (this.finished)
            return false;
        this.finished = true;
        this.forget();
        clearTimeout(this.timer);
        this.context.abortController.signal.removeEventListener('abort', this.onAbort);
        this.resolvePending(result);
        return true;
    }
}

function skipped(): ValidatorValidateResult
{
    return {
        issueFound: null,
        conditionEvaluateResult: ConditionEvaluateResult.Undetermined,
        skipped: true
    };
}

/**
 * A stub of a condition that lets consumers of AsyncValidator 
 * provide a condition's API for non-validation purposes of
 * ConditionType and Category. Those have fixed values.
 */
class InternalConditionForAsyncValidator implements ICondition
{
    constructor (conditionType: string) 
    {
        assertNotEmptyString(conditionType);
        this._conditionType = conditionType;
    }   
    get conditionType(): string
    {
        return this._conditionType;
    }
    private _conditionType: string;

    public evaluate(valueHost: IValueHost | null, valueHostsManager: IValueHostsManager): ConditionEvaluateResult
    {
        throw new Error('Method not implemented.');
    }
    public get category(): ConditionCategory
    {
        return ConditionCategory.Async; // sorts after all standard conditions, including Undetermined
    }
}

/**
 * Represents the context of a pending asynchronous validation operation.
 * Tracks the promise, abort controller, and input value host counters to determine if inputs have changed.
 */
export class PendingContext implements IPendingContext
{
    constructor(owner: IValidatorsValueHost, config: AsyncValidatorConfig)
    {
        this._promise = null;
        this._abortController = new AbortController();
        this._inputs = null;
        if (config.restartWhenPending !== RestartWhenPending.Always)
        {
            this._inputs = this.captureValueHostCounters(owner, 
                config.dependencyValueHostNames ?? []);
        }
    }
    private _promise: Promise<ValidatorValidateResult> | null;
    private _abortController: AbortController;
    private _inputs: CapturedValueHostCounter[] | null;
    public dispose(): void
    {
        this._abortController.abort();
        this._inputs = null;
    }

    /**
     * Gets the promise associated with this pending context.
     * Throws an error if the promise has not been initialized.
     */
    public get promise(): Promise<ValidatorValidateResult>
    {
        if (!this._promise)
            throw new Error('Promise has not been initialized.');
        return this._promise;
    }
    /**
     * Promise setup is deferred until after the pending context has been created.
     */
    public set promise(value: Promise<ValidatorValidateResult>)
    {
        this._promise = value;
    }
    public get abortController(): AbortController
    {
        return this._abortController;
    }

    /**
     * Determines if any of the tracked value hosts have changed since they were captured.
     * @param valueHostsManager The manager that provides access to the current value hosts.
     * @returns True if any of the tracked value hosts have changed since they were captured; otherwise, false.
     */
    public inputChanged(valueHostsManager: IValueHostsManager): boolean
    {
        if (!this._inputs)
            return false;
        return this._inputs.some(input =>
        {
            const current = valueHostsManager.getValueHost(input.name);
            return current !== input.host ||
                current.changeCounter !== input.changeCounter;
        });
    }
    
    /**
     * Captured change counters for the value hosts that this pending context is tracking.
     * Returns null if no value hosts are being tracked (RestartWhenPending=Always)
     */
    protected get inputs(): CapturedValueHostCounter[] | null
    {
        return this._inputs;
    }
    protected captureValueHostCounters(owner: IValueHost, dependencyNames: readonly ValueHostName[]): CapturedValueHostCounter[]
    {
        const ownerName = owner.getName();
        const inputs: CapturedValueHostCounter[] = [
            { name: ownerName, host: owner, changeCounter: owner.changeCounter }
        ];
        const names = new Set(dependencyNames);
        names.delete(ownerName);
        for (const name of names)
        {
            const host = owner.valueHostsManager.getValueHost(name);
            if (!host)
                throw new CodingError(`Async validation dependency "${ name }" was not found`);
            inputs.push({ name, host, changeCounter: host.changeCounter });
        }
        return inputs;
    }

}

/**
 * Part of PendingContext data that preserves one ValueHost that is a value input
 * for this asyncValidator. Each ValueHost is identified by
 * AsyncValidatorConfig.dependencyValueHostNames.
 * It retains the change counter for the ValueHost to track modifications since it was captured
 * and is used as part of resolving RestartWhenPending.WhenInputsChanged.
 */
interface CapturedValueHostCounter
{
    name: ValueHostName;
    host: IValueHost;
    changeCounter: number;
}

function reportFailureSafely(error: Error, logger: LoggingFacade): void
{
    try
    {
        logger.error(error);
    }
    catch (loggingError)
    {
        console.error('Failed to log async validation failure', error, loggingError);
    }
}

function reportUnexpectedLateFailureSafely(reason: unknown, signal: AbortSignal, logger: LoggingFacade): void
{
    if (signal.aborted && (reason === signal.reason ||
        (reason instanceof Error && reason.name === 'AbortError')))
        return;
    reportFailureSafely(ensureError(reason), logger);
}
