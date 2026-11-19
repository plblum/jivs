/**
 * A ValueHost that uses the Validator class to provide validation.
 * @module jivs-engine/ValueHosts/AbstractClasses/ValidatorsValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggingService';
import { objectKeysCount, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionCategory, ConditionEvaluateResult, ICondition } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, IssueFound } from '../Interfaces/Validation';
import { ValidatorValidateResult, IValidator, ValidatorConfig, ValidatorType } from '../Interfaces/Validator';
import { CodingError, SevereErrorBase, assertNotEmptyString, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import
    {
        ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState,
        IValidatorsValueHost, ValidatorsValueHostSetValueOptions,
        type InjectedError, InjectedErrorValidatorErrorCode
    } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { ConditionType } from '../Conditions/ConditionTypes';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { IValueHost } from '../Interfaces/ValueHost';
import { ErrorMessagesService } from '../Services/ErrorMessagesService';
import { resolveErrorCode } from '../Utilities/Validation';
import { AsyncValidatorConfig, isAsyncValidatorConfig } from '../Interfaces/AsyncValidator';

/**
 * Standard implementation of IValidatorsValueHost. It owns a list of Validators
 * which support its validate() function.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager 
* - ValidatorsValueHostBaseConfig - The business logic supplies these rules
*   to implement a ValueHost's name, label, data type, validation rules,
*   and other business logic metadata.
* - ValidatorsValueHostBaseInstanceState - InstanceState used by this ValidatorsValueHostBase including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export abstract class ValidatorsValueHostBase<TConfig extends ValidatorsValueHostBaseConfig,
    TState extends ValidatorsValueHostBaseInstanceState,
    TOptions extends ValidatorsValueHostSetValueOptions = ValidatorsValueHostSetValueOptions>
    extends ValidatableValueHostBase<TConfig, TState, TOptions>
    implements IValidatorsValueHost<TOptions> {
    constructor(valueHostsManager: IValueHostsManager, config: TConfig, state: TState) {
        super(valueHostsManager, config, state);
    }

    // Version token for validation runs: async results may update the host only
    // while their captured generation matches this one. New runs, value changes,
    // clearing validation, and disposal invalidate older results; they do not
    // cancel the underlying async operations.
    private _validationGeneration = 0;

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public override dispose(): void
    {
        this._validationGeneration++;
        this.config.validatorConfigs = undefined!;
        super.dispose();
        this._validators?.forEach((validator) => { validator.dispose(); });
        this._validators = undefined!;
    }

    protected override additionalInstanceStateUpdatesOnSetValue(stateToUpdate: TState, valueChanged: boolean, options: TOptions): void
    {
        super.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, valueChanged, options);
        if (valueChanged)
        {
            this._validationGeneration++;
            delete stateToUpdate.asyncProcessing;
        }
        if (options && options.injectedError)
            stateToUpdate.injectedError = options.injectedError;
        else
            delete stateToUpdate.injectedError;
    }

    //#endregion IFieldValueHost


    protected override clearValidationDataFromInstanceState(stateToUpdate: TState): void
    {
        this._validationGeneration++;
        super.clearValidationDataFromInstanceState(stateToUpdate);
        delete stateToUpdate.injectedError;
    }

    /**
     * Extends the rules for determining the validation status to 
     * return ValidationStatus.Failed if the ValueHost is enabled and either the status is Failed
     */
    public override get validationStatus(): ValidationStatus
    {
        if (this.isEnabled() && (this.instanceState.status === ValidationStatus.Failed ||
            this.instanceState.failedAsyncIdentities?.length))
            return ValidationStatus.Failed;
        return super.validationStatus;
    }

    /**
     * Returns the InjectedError supplied by the latest call to setTextValue() or setValues().
     * Its null when not supplied or has been cleared.
     */
    public getInjectedError(): InjectedError | null
    {
        return this.instanceState.injectedError ?? null;
    }
    /**
     * Attaches the InjectedError to this ValidatorsValueHostBase. It will be used to create a Validator
     * to report the error. If you supply an errorCode, it will be used to localize the error message.
     * If not supplied, know that ErrorMessagesService will use the errorCode value of 'InjectedError'
     * to localize the error message. You can also provide a summaryMessage for use in a summary of validation errors.
     * 
     * Alternatively use the options.injectedError property when calling setTextValue() or setValues() 
     * to provide a way to inject.
     * @param injectedError 
     */
    public setInjectedError(injectedError: InjectedError): void
    {
        assertNotNull(injectedError, 'injectedError');
        this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.injectedError = injectedError;
            return stateToUpdate;
        }, this);
    }

    /**
     * Clears the InjectedError from this ValidatorsValueHostBase. It will no longer be used to create a Validator
     * to report the error.
     */
    public clearInjectedError(): void
    {
        if (this.instanceState.injectedError) {
            this.updateInstanceState((stateToUpdate) => {
                delete stateToUpdate.injectedError;
                return stateToUpdate;
            }, this);
        }
    }

    /**
     * Determines if this ValueHost handles validation for a specific error code.
     * @param errorCode 
     */
    protected handlesErrorCode(errorCode: string): boolean
    {
        return this.getValidator(errorCode) !== null;
    }

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns ValueHostValidateResult
     * with all of the NoMatches in issuesFound.
     * If all were Matched, it returns ValueHostValidateResult.Value and issuesFound=null.
     * If there are no validators, or all validators were skipped (disabled),
     * it returns ValidationStatus.Undetermined.
     * If an async validator fails to resolve, its identity is retained and the
     * host reports ValidationStatus.Failed until that validator completes successfully.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * 
     * When called an it is disabled, it clears existing data and returns null.
     * If the enabled state changes, the user must call validate again to get the new state.
     * 
     * @param options - Provides guidance on which validators to include.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult | null {
        if (!this.isEnabled())
        {
            this.clearValidation();
            this.logger.message(LoggingLevel.Debug, () => `Validation skipped because ValueHost "${this.getName()}" is disabled`);            
            return null;
        }
        const self = this;
        if (!options)
            options = {};
        this.logger.message(LoggingLevel.Debug, ()=> `Validating ValueHost "${this.getName()}"`);
        
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        const result: ValueHostValidateResult = {
            status: ValidationStatus.Undetermined,
            issuesFound: null
        };

        if (!this.groupsMatch(options.group, false))
            return bailout(`Group names do not match "${options.group}" vs "${this.config.group as any}"`);

        // async validators that are processing are associated with a specific validation generation.
        // A change of _validationGeneration is because the original value changed or a new validation cycle has started.
        // Only results from the current generation will be applied to the ValueHost's state.
        const runGeneration = ++this._validationGeneration;
        const failedIdentities = new Set(this.instanceState.failedAsyncIdentities ?? []);
        let requestedStatus = result.status;
        let disposalSurvivingLogger = this.logger;   // logError may occur after this.logger is disposed...

        try {
            try {
                const validators = this.validators();
                let stop = false;
                let validatorsInUse = 0;

                for (let i = 0; !stop && i < validators.length; i++) {
                    const iv = validators[i];
                    const potentialIVR = iv.validate(options);
                    // promises will update the results later
                    // All other validators in this loop will still finish
                    // by updating the state. The state is just missing the results
                    // from this validator. When this completes, it updates the state again.
                    if (potentialIVR instanceof Promise) {
                        processPromise(potentialIVR, iv);
                        continue;
                    }
                    // synchronous (normal) processing
                    const fieldValResult = potentialIVR as ValidatorValidateResult;
                    if (fieldValResult.skipped)
                        continue;
                    validatorsInUse++;    // eslint-disable-line @typescript-eslint/no-unused-vars
                    if (fieldValResult.issueFound)
                    {
                        // options.preliminary focuses on stopping processing early for required conditions that are invalid
                        // to avoid reporting required field errors prematurely.
                        if (options.preliminary && iv.condition.category === ConditionCategory.Require)
                        {
                            stop = true;
                            continue; // don't let it add its issueFound to the result.                        
                        }
                        fieldValResult.issueFound.doNotSave = true;
                        switch (fieldValResult.issueFound.severity) {
                            case ValidationSeverity.Error:
                                result.status = ValidationStatus.Invalid;
                                break;
                            case ValidationSeverity.Severe:
                                result.status = ValidationStatus.Invalid;
                                stop = true;
                                break;
                            case ValidationSeverity.Warning:
                                if (result.status === ValidationStatus.Undetermined)
                                    result.status = ValidationStatus.Valid;
                                fieldValResult.issueFound.doNotSave = false;
                                break;
                        }

                        if (!result.issuesFound)
                            result.issuesFound = [];
                        const issueFound = fieldValResult.issueFound;
                        result.issuesFound.push(issueFound);
                            
                    }
                    else if (result.status === ValidationStatus.Undetermined)
                        if (fieldValResult.conditionEvaluateResult === ConditionEvaluateResult.Match)
                            result.status = ValidationStatus.Valid;    // may be overwritten by a later validator

                }
                // unnecessary as this should always be the case at this point
                // if (validatorsInUse === 0)
                //     result.status = ValidationStatus.Undetermined; 

            }
            catch (e) {
                const err = ensureError(e);                

                logError(err.message);
                if (err instanceof SevereErrorBase)
                {
                    if (runGeneration === this._validationGeneration)
                    {
                        this._validationGeneration++;
                        try {
                            const changed = this.updateInstanceState((stateToUpdate) => {
                                this.setInstanceStateStatus(stateToUpdate, ValidationStatus.NeedsValidation);
                                delete stateToUpdate.asyncProcessing;
                                delete stateToUpdate.corrected;
                                return stateToUpdate;
                            }, this);
                            if (changed)
                                this.invokeOnValueHostValidationStateChanged(options);
                        }
                        catch (cleanupError) {
                            logError(`Validation cleanup failed: ${ensureError(cleanupError).message}`);
                        }
                    }
                    throw err;
                }

                // resume normal processing with Undetermined state
                result.status = ValidationStatus.Undetermined;
            }
            requestedStatus = result.status;
            adjustCorrectedFlag();
            reviseStatusIfFailed();
            if (updateInstanceStateWithResult(result))
                self.invokeOnValueHostValidationStateChanged(options);
            // when the result hasn't changed from the start, report null as there were no issues found
            return result.status !== ValidationStatus.Undetermined || result.issuesFound !== null || result.pending ?
                result : null;
        }

        finally {
            this.logger.log(LoggingLevel.Info, (options) => {
                return {
                    message: `Validation result: ${ValidationStatus[result.status]} Issues found:` +
                        (result.issuesFound ? JSON.stringify(result.issuesFound) : 'none'),
                    category: LoggingCategory.Result
                };
            });

        }
        function reviseStatusIfFailed(): void {
            result.status = failedIdentities.size ? ValidationStatus.Failed : requestedStatus;
            if (failedIdentities.size)
                delete result.corrected;
        }

        function updateInstanceStateWithResult(result: ValueHostValidateResult): boolean {
            return self.updateInstanceState((stateToUpdate) => {
                if (result.corrected)
                {
                    stateToUpdate.corrected = true;
                }
                else
                    delete stateToUpdate.corrected;
                self.setInstanceStateStatus(stateToUpdate, requestedStatus);
                stateToUpdate.issuesFound = result.issuesFound;
                if (failedIdentities.size)
                    stateToUpdate.failedAsyncIdentities = [...failedIdentities];
                else
                    delete stateToUpdate.failedAsyncIdentities;
                if (options!.group)
                    stateToUpdate.group = options!.group;
                else
                    delete stateToUpdate.group;
                if (result.pending)
                    stateToUpdate.asyncProcessing = true;
                else
                    delete stateToUpdate.asyncProcessing;
                return stateToUpdate;
            }, self);
        }
        function processPromise(promise: Promise<ValidatorValidateResult>, validator: IValidator): void {
            // Legacy Validators can also return Promises, but only AsyncValidators have
            // an identity that can be retained as a failure and cleared by a later retry.
            const asyncIdentity = validator.condition.category === ConditionCategory.Async ? validator.errorCode : null;
            function completeThePromise(finish: () => void): void {
                if (result.pending && result.pending.includes(promise)) {
                    const index = result.pending.indexOf(promise);
                     
                    // Settle this run's pending list even when the run is obsolete. An
                    // obsolete completion must not change the current host state.
                    result.pending.splice(index, 1);
                    if (result.pending.length === 0)
                        delete result.pending;

                    if (runGeneration === self._validationGeneration)
                        finish();
                }
            }
            function deleteAsyncProcessFlag(): boolean {
                // Skipped and Undetermined results have no status or issue to publish.
                // Only the last pending result needs to update the host's pending flag.
                if (!result.pending)
                    return self.updateInstanceState((stateToUpdate) => {
                        delete stateToUpdate.asyncProcessing;
                        return stateToUpdate;
                    }, self);
                return false;
            }
            /**
             * In async situations, the callback's exception should be caught and logged to prevent unhandled promise rejections.
             * Prevents callback errors from being mistaken for validator failures.
             */
            function notifyAsyncStateChanged(): void
            {
                try
                {
                    self.invokeOnValueHostValidationStateChanged(options);
                }
                catch (error)
                {
                    logError(`Async validation notification failed: ${ ensureError(error).message }`);
                }
            }
            /**
             * Adds one resolved validator's outcome to this run's shared result and
             * publishes any resulting state change. Called only for the current run,
             * after completeThePromise has removed this Promise from pending.
             */
            function applyResolvedValidatorResult(ivr: ValidatorValidateResult): void
            {
                if (ivr.failedToResolve)
                {
                    // A failed async handler blocks saving without creating a user-facing
                    // issue. Legacy Promise validators instead record Failed as the status.
                    if (asyncIdentity !== null)
                        failedIdentities.add(asyncIdentity);
                    else
                        requestedStatus = ValidationStatus.Failed;
                    reviseStatusIfFailed();
                    if (updateInstanceStateWithResult(result))
                        notifyAsyncStateChanged();
                }
                else if (ivr.skipped)
                {
                    // A skipped validator cannot clear an earlier failure.
                    if (deleteAsyncProcessFlag())
                        notifyAsyncStateChanged();
                }
                else if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch)
                {
                    if (!ivr.issueFound)
                        throw new CodingError(`Validator "${ validator.errorCode }" returned NoMatch without an issue`);
                    // A definitive result clears this handler's failure, even when it
                    // reports an issue. Other handlers' failures remain in effect.
                    if (asyncIdentity !== null)
                        failedIdentities.delete(asyncIdentity);
                    if (ivr.issueFound.severity === ValidationSeverity.Warning)
                    {
                        // Warnings do not block saving and must not override an invalid status.
                        ivr.issueFound.doNotSave = false;
                        if (requestedStatus === ValidationStatus.Undetermined)
                            requestedStatus = ValidationStatus.Valid;
                    }
                    else if (requestedStatus !== ValidationStatus.Failed)
                        requestedStatus = ValidationStatus.Invalid;
                    if (!result.issuesFound)
                        result.issuesFound = [];
                    result.issuesFound.push(ivr.issueFound);
                    reviseStatusIfFailed();
                    if (updateInstanceStateWithResult(result))
                        notifyAsyncStateChanged();

                }
                else if (ivr.conditionEvaluateResult === ConditionEvaluateResult.Match)
                {
                    // Match clears only this handler's failure and cannot override
                    // a more significant status already produced by another validator.
                    if (asyncIdentity !== null)
                        failedIdentities.delete(asyncIdentity);
                    if (requestedStatus === ValidationStatus.Undetermined)
                        requestedStatus = ValidationStatus.Valid;

                    reviseStatusIfFailed();
                    if (updateInstanceStateWithResult(result))
                        notifyAsyncStateChanged();
                }
                else // ConditionEvaluateResult.Undetermined
                {
                    // Undetermined is not a definitive retry, so retain any failure.
                    if (deleteAsyncProcessFlag())
                        notifyAsyncStateChanged();
                }
            }

            if (!result.pending)
                result.pending = [];
            result.pending.push(promise);
            promise.then(
                (ivr) => {
                    completeThePromise(() => applyResolvedValidatorResult(ivr));
                },
                (failureInfo) => {
                    logError(failureInfo ? failureInfo.toString() : 'unspecified');
                    completeThePromise(() => {
                        if (asyncIdentity !== null)
                        {
                            failedIdentities.add(asyncIdentity);
                            reviseStatusIfFailed();
                            if (updateInstanceStateWithResult(result))
                                notifyAsyncStateChanged();
                        }
                        else if (deleteAsyncProcessFlag())
                            notifyAsyncStateChanged();
                    });
                }
            ).catch(error => {
                logError(ensureError(error).message);
                if (asyncIdentity !== null && runGeneration === self._validationGeneration)
                {
                    failedIdentities.add(asyncIdentity);
                    reviseStatusIfFailed();
                    if (updateInstanceStateWithResult(result))
                    {
                        notifyAsyncStateChanged();
                    }
                }
            });
            // no change to the ValidationStatus here            
        }
        function adjustCorrectedFlag(): void
        {
            // corrected=true only for the validation that moves Invalid->Valid.
            // The previous status is in instanceState.status when validate() is called directly.
            // When a setter ran first, status is NeedsValidation and lastStatus holds the previous status.
            // As a rule, async validation will not prepare the corrected flag.
            let isValid = result.status === ValidationStatus.Valid && !result.pending;
            let wasInvalid = self.instanceState.status === ValidationStatus.Invalid ||
                (self.instanceState.status === ValidationStatus.NeedsValidation &&
                    self.instanceState.lastStatus === ValidationStatus.Invalid);

            if (wasInvalid && isValid)
                result.corrected = true;
            else
                delete result.corrected;                        
        }

        function bailout(errorMessage: string): null {
            self.logger.message(LoggingLevel.Info, () => errorMessage);
            return null;
        }

        function logError(message: string): void {
            disposalSurvivingLogger.log(LoggingLevel.Error, (options) => {
                return {
                    message: message ??
                        /* istanbul ignore next */  // defensive             
                        'Reason unspecified',
                    category: LoggingCategory.Exception
                };
            });            
        }
    }

    //#region validation
    /**
     * Provides the list of IValidator instances derived
     * from the ValidatorConfigs. Lazy loads the instances.
     */
    protected validators(): Array<IValidator> {
        if (this._validators === null)
        {
            this._validators = this.orderValidators(this.generateValidators());
            this.tryToAddInjectedErrorValidator(this._validators);
        }
        return this._validators;
    }
    // populated by Validators() when null. Set to null by UpdateValueHostConfig
    // to account for changes made there.
    private _validators: Array<IValidator> | null = null;
    
    /**
     * Determines if this ValidatorsValueHostBase has any asynchronous validators.
     * @returns True if there are async validators, false otherwise.
     */
    public get hasAsyncValidators(): boolean {
        if (this._hasAsyncValidators === undefined) {
            this._hasAsyncValidators = this.config.validatorConfigs?.some(v => isAsyncValidatorConfig(v)) ?? false;
        }
        return this._hasAsyncValidators;
    }
    private _hasAsyncValidators: boolean | undefined = undefined;

    /**
     * Adds an injected error validator to the beginning of the validators array if an injected error exists.
     * The validator's configuration will use Severity=Severe, which will stop further validation processing and require the user to fix the issue before continuing.
     * The InjectedError object delivers both error message and summary message.
     * @param validators The array of validators to which the injected error validator will be added.
     */
    protected tryToAddInjectedErrorValidator(validators: Array<IValidator>): void
    {
        let injectedError = this.getInjectedError();
        if (injectedError)
        {
            let validatorConfig: ValidatorConfig = this.createValConfigFromInjectedError(injectedError);
            const injectedErrorValidator = this.services.validatorFactory.create(this, validatorConfig);
            validators.unshift(injectedErrorValidator);
        }
    }   
    protected createValConfigFromInjectedError(injectedError: InjectedError): ValidatorConfig
    {
        let errorCode = injectedError.errorCode ?? InjectedErrorValidatorErrorCode;
        return {
            validatorType: ValidatorType.Validator,
            conditionCreator: (valConfig) => new InjectedErrorCondition(),
            conditionConfig: null,
            errorCode: errorCode, // may be null
            errorMessage: injectedError.errorMessage,
            errorMessagel10n: injectedError.errorMessagel10n ?? ErrorMessagesService.getErrorMessagel10nText(errorCode, null),
            summaryMessage: injectedError.summaryMessage,
            summaryMessagel10n: injectedError.summaryMessagel10n ?? ErrorMessagesService.getSummaryMessagel10nText(errorCode, null),
            // always severe since its blocking. It stops further processing of validators, and the user must fix it before continuing.
            severity: ValidationSeverity.Severe
        };
    }   

    /**
     * Generates an array of all Validators from ValueHostConfig.validatorConfigs.
     * Sorts the by Category so Require is always first, DataTypeCheck is just after Require.
     * @returns 
     */
    protected generateValidators(): Array<IValidator> {
        const factory = this.services.validatorFactory;
        const validators: Array<IValidator> = [];
        this.config.validatorConfigs?.forEach((valDesc) => {
            const pv = factory.create(this, valDesc);
            validators.push(pv);
        });
        return validators;
    }

    /**
     * Validators are sorted so category=Require comes first and category=DataTypeCheck second.
     * AsyncValidators have category=Async, which is last, ensuring they
     * will always be ordered after standard validators.
     * @param unordered 
     * @returns 
     */
    protected orderValidators(unordered: Array<IValidator>): Array<IValidator> {
        const fn = (a: IValidator, b: IValidator): number => a.condition.category - b.condition.category;
         /* istanbul ignore if */
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else        /* istanbul ignore next */ // we don't run our unit tests in pre-ES2016 mode required to test this.
            return unordered.sort(fn);
    }

    /*
    * Standard validators may replace external issues using their error code.
    * Async issues replace an existing validator issue only when their identities match.
    */
    public override addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        if (error) {
            if (!this.isEnabled())
            {
                this.logger.message(LoggingLevel.Warn, () => `IssueFound applied on disabled ValueHost "${this.getName()}"`);                
            }
        
            const asyncIdentity = error.asyncIdentity;
            if (asyncIdentity != null &&
                !this.instanceState.issuesFound?.some(issue => issue.asyncIdentity === asyncIdentity))
                return super.addExternalIssueFound(error, determinedLocally, options);

            // If the issue aligns to a validator, create that validator's IssueFound shape instead.
            // From this point on, the issue is treated as a validator result, not as an external issue.
            // That means validator semantics apply, including the validator's doNotSave behavior.
            // The external IssueFound likely starts with doNotSave = false
            if (error.errorCode || asyncIdentity != null)
                for (let i = 0; i < this.validators().length; i++) {
                    const validator = this.validators()[i];
                    const valResult = validator.tryValidatorSwap(error);
                    if (valResult &&
                        (asyncIdentity == null || valResult.issueFound?.asyncIdentity === asyncIdentity)) {
                // We are replacing the external issue with a validator-owned IssueFound.
                // Preserve an explicit severity override from the external issue, and if that
                // override makes the issue a warning, also make it non-blocking.
                        if (error.severity !== undefined) {
                            valResult.issueFound!.severity = error.severity;
                            if (error.severity == ValidationSeverity.Warning)
                                valResult.issueFound!.doNotSave = false;
                        }

                        const changed = this.updateInstanceState((stateToUpdate) => {
                            let replacementIndex = -1;
                            if (!stateToUpdate.issuesFound)
                              /* istanbul ignore next */ // defensive. Current code always sets this up
                                stateToUpdate.issuesFound = [];
                            // replace if the same issuefound exists
                            for (let issueIndex = 0; issueIndex < stateToUpdate.issuesFound.length; issueIndex++)
                            {
                                const issueFound = stateToUpdate.issuesFound[issueIndex];
                                if (asyncIdentity != null)
                                {
                                    if (issueFound.asyncIdentity === asyncIdentity)
                                    {
                                        replacementIndex = issueIndex;
                                        break;
                                    }
                                    continue;
                                }
                                if (issueFound.asyncIdentity == null && issueFound.errorCode === error.errorCode) {
                                    replacementIndex = issueIndex;
                                    break;
                                }
                            }

                            if (replacementIndex === -1)
                                stateToUpdate.issuesFound.push(valResult.issueFound!);
                            else
                                stateToUpdate.issuesFound[replacementIndex] = valResult.issueFound!;
                            const onlyWarnings = asyncIdentity != null &&
                                stateToUpdate.issuesFound.every(issue => issue.severity === ValidationSeverity.Warning);
                            this.setInstanceStateStatus(stateToUpdate,
                                onlyWarnings ? ValidationStatus.Valid : ValidationStatus.Invalid);
                            //NOTE: leave stateToUpdate.group and asyncProcessing alone
                            return stateToUpdate;
                        }, this);
                        if (changed) {
                            this.invokeOnValueHostValidationStateChanged(options);
                        }
                        return changed;
                    }
                }
        }
        return super.addExternalIssueFound(error, determinedLocally, options);        
    }

    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        const validators = this.validators();
        for (const validator of validators)
            validator.gatherValueHostNames(collection, valueHostResolver);
    }

    /**
     * Gets an Validator already assigned to this ValidatorsValueHostBase.
     * @param errorCode - Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
    public getValidator(errorCode: string): IValidator | null {
        const ec = cleanString(errorCode);
        if (ec)
            for (const iv of this.validators())
                if (iv.errorCode === ec)
                    return iv;
        return null;
    }
}


export abstract class ValidatorsValueHostBaseGenerator extends ValidatableValueHostBaseGenerator {

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatus for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatus Valid.
     * @param state 
     * @param config 
     */
    public cleanupInstanceState(state: ValidatorsValueHostBaseInstanceState, config: ValidatorsValueHostBaseConfig): void {
        assertNotNull(state, 'state');
        assertNotNull(config, 'config');
        let configChanged = false;
        let oldStateCount = 0;
        let issuesFound: Array<IssueFound> | null = null;

        if (state.failedAsyncIdentities?.length)
        {
            const configuredIdentities = new Set<string>();
            config.validatorConfigs?.forEach(valConfig => {
                if (isAsyncValidatorConfig(valConfig))
                {
                    const identity = (valConfig as AsyncValidatorConfig).handlerIdentity;
                    assertNotEmptyString(identity, 'handlerIdentity');
                    configuredIdentities.add(identity);
                }
            });
            const retained = state.failedAsyncIdentities.filter(identity => configuredIdentities.has(identity));
            if (retained.length !== state.failedAsyncIdentities.length)
            {
                if (retained.length)
                    state.failedAsyncIdentities = retained;
                else
                {
                    delete state.failedAsyncIdentities;
                    if (state.status !== ValidationStatus.Invalid)
                        state.status = ValidationStatus.NeedsValidation;
                }
            }
        }
        if (state.asyncProcessing)
        {
            delete state.asyncProcessing;
            delete state.corrected;
            if (state.status !== ValidationStatus.Failed)
                state.status = ValidationStatus.NeedsValidation;
        }

        if (state.issuesFound) {
            const oldState = state.issuesFound;

            config.validatorConfigs?.forEach((valConfig) =>
            {
                let found: IssueFound | undefined;
                if (isAsyncValidatorConfig(valConfig))
                {
                    const identity = 'handlerIdentity' in valConfig ? valConfig.handlerIdentity : undefined;
                    assertNotEmptyString(identity, 'handlerIdentity');
                    found = oldState.find(value => value.asyncIdentity != null && value.asyncIdentity === identity);
                    if (!found)
                        return;
                }
                else
                {
                    let errorCode: string | null = cleanString(valConfig.errorCode);
                    const vc = valConfig as ValidatorConfig;
                    if (!errorCode && vc.conditionConfig)
                        errorCode = vc.conditionConfig.conditionType;
                    else if (vc.conditionCreator)
                    {
                        const cond = vc.conditionCreator(vc);   // return null is actually a configuration bug reported to the user in Validator.Condition
                        if (cond)
                            errorCode = cond.conditionType;
                    }
                    if (!errorCode)
                        /* istanbul ignore next */  // defensive. Current code always establishes an error code
                        errorCode = ConditionType.Unknown;
                    found = oldState.find(value => value.asyncIdentity == null && value.errorCode === errorCode);
                }
                if (found) {
                    if (!issuesFound)
                        issuesFound = [];
                    issuesFound.push(found);
                    oldStateCount++;
                }
                else
                    configChanged = true;
            });
        }
        if (!configChanged && (oldStateCount === objectKeysCount(state.issuesFound)))
            return;

        state.issuesFound = issuesFound as (Array<IssueFound> | null);
        // fix validation result for when validation had occurred
        if (state.status === ValidationStatus.Invalid) {
            let vr = ValidationStatus.NeedsValidation;
            let warningFound = false;
            if (issuesFound) {
                for (const issueFound of state.issuesFound!) {
                    if (issueFound.severity !== ValidationSeverity.Warning) {
                        vr = ValidationStatus.Invalid;
                        break;
                    }
                    else
                        warningFound = true;
                }
                if (warningFound && vr === ValidationStatus.NeedsValidation)
                    vr = ValidationStatus.Valid;
            }
            state.status = vr;
            delete state.lastStatus;
        }
    }

}


/**
 * Internally managed Condition that is used to represent an injected error when
 * the ValidatorsValueHostBase has an injected error. It is used to provide a ConditionEvaluateResult.NoMatch.
 * Expected to be created by code within ValidatorsValueHostBase.validate()
 * only when the injectedError is present.
 */
class InjectedErrorCondition implements ICondition
{
    constructor()
    {
    }
    public get conditionType(): string
    {
        return InjectedErrorValidatorErrorCode;
    }
    public get category(): ConditionCategory
    {
        return ConditionCategory.Undetermined;
    }
    public evaluate(valueHost: IValueHost, valueHostsManager: IValueHostsManager): ConditionEvaluateResult
    {
        return ConditionEvaluateResult.NoMatch;
    }

}
