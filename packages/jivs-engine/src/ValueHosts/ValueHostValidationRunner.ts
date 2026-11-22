/**
 * One validation run for a ValidatorsValueHostBase.
 * @module jivs-engine/ValueHosts/ValueHostValidationRunner
 */
import { ConditionCategory, ConditionEvaluateResult } from '../Interfaces/Conditions';
import { IPendingContext, isAsyncValidator } from '../Interfaces/AsyncValidator';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggingService';
import { ValidateOptions, ValidationSeverity, ValidationStatus, ValueHostValidateResult } from '../Interfaces/Validation';
import { IValidator, ValidatorValidateResult } from '../Interfaces/Validator';
import { ValidatorsValueHostBaseInstanceState } from '../Interfaces/ValidatorsValueHostBase';
import { CodingError, ensureError, SevereErrorBase } from '../Utilities/ErrorHandling';
import { LoggingFacade } from '../Utilities/LoggingFacade';

/**
 * Host operations needed by a validation run. State and generation accessors
 * must return their current values, including after callbacks reenter the host.
 * The host supplies ordered validators and applies state updates using its
 * normal cloning and notification mechanism.
 */
export interface ValidatorValueHostAccessor<TState extends ValidatorsValueHostBaseInstanceState> {
    getState: () => TState;
    getGeneration: () => number;
    invalidateGeneration: () => void;
    getValidators: () => IValidator[];
    getLogger: () => LoggingFacade;
    updateState: (updater: (state: TState) => TState) => boolean;
    setStatus: (state: TState, status: ValidationStatus) => void;
    notify: (options: ValidateOptions) => void;
}

/**
 * Processes one host validation run, including its asynchronous completions.
 * Construct a separate instance with the host's new generation for each call
 * to validate(), then call execute() once. The returned result remains shared
 * with the asynchronous completion handlers.
 */
export class ValueHostValidationRunner<TState extends ValidatorsValueHostBaseInstanceState> {
    // The returned result remains shared with all asynchronous completions.
    private readonly _result: ValueHostValidateResult = {
        status: ValidationStatus.Undetermined,
        issuesFound: null
    };
    private readonly _failedIdentities: Set<string>;
    private _requestedStatus: ValidationStatus;
    private _pendingCount = 0;
    private readonly logger: LoggingFacade;

    constructor(
        private readonly host: ValidatorValueHostAccessor<TState>,
        private readonly options: ValidateOptions,
        private readonly runGeneration: number
    ) {
        this.logger = host.getLogger();
        this._failedIdentities = new Set(host.getState().failedAsyncIdentities ?? []);
        // Keep failed validators' issues visible until a definitive retry.
        const retainedIssues = (host.getState().issuesFound ?? [])
            .filter(issue => issue.asyncIdentity != null && this._failedIdentities.has(issue.asyncIdentity));
        this._result.issuesFound = retainedIssues.length ? retainedIssues : null;
        this._requestedStatus = this._result.status;
    }

    /** Processes the synchronous portion and returns before pending work settles. */
    public execute(): ValueHostValidateResult | null {
        try {
            this.processValidators();
            this._requestedStatus = this._result.status;
            this.adjustCorrectedFlag();
            this.reviseStatusIfFailed();
            if (this.runGeneration === this.host.getGeneration())
                if (this.updateInstanceStateWithResult() &&
                    this.runGeneration === this.host.getGeneration())
                    this.host.notify(this.options);
            return this._result.status !== ValidationStatus.Undetermined || this._result.issuesFound !== null || this._result.completions?.length ?
                this._result : null;
        }
        finally {
            this.logResult();
        }
    }

    private processValidators(): void {
        try {
            const validators = this.host.getValidators();
            for (let i = 0; i < validators.length; i++) {
                if (this.runGeneration !== this.host.getGeneration())
                    break;
                if (this.processValidator(validators[i]))
                    break;
            }
        }
        catch (e) {
            this.handleValidatorError(e);
        }
    }

    private processValidator(validator: IValidator): boolean {
        let potentialIVR: ValidatorValidateResult | Promise<ValidatorValidateResult>;
        let context: IPendingContext | null = null;
        if (isAsyncValidator(validator)) {
            const reuse = validator.isPendingResponsible(this.options);
            if (this.runGeneration !== this.host.getGeneration())
                return true;

            if (reuse) {
                context = validator.pendingContext;
                if (!context)
                    throw new CodingError('Responsible validator has no pending context');
                potentialIVR = context.promise;
            }
            else {
                potentialIVR = validator.validate(this.options);
                const current = validator.pendingContext;
                if (potentialIVR instanceof Promise && current?.promise === potentialIVR)
                    context = current;
            }
        }
        else
            potentialIVR = validator.validate(this.options);
        if (potentialIVR instanceof Promise) {
            const missingContext = isAsyncValidator(validator) && !context;
            // Register even if validate() reentered and made this run obsolete.
            this.processPromise(potentialIVR, validator, context, !missingContext);
            if (this.runGeneration !== this.host.getGeneration())
                return true;
            if (missingContext) {
                this.logError(`Async validator "${validator.errorCode}" returned a Promise without its pending context`);
                this._failedIdentities.add(validator.errorCode);
            }
            return false;
        }
        if (this.runGeneration !== this.host.getGeneration())
            return true;
        return this.processValidatorResult(potentialIVR, validator);
    }

    private handleValidatorError(error: unknown): void {
        const err = ensureError(error);
        this.logError(err.message);
        if (err instanceof SevereErrorBase) {
            if (this.runGeneration === this.host.getGeneration()) {
                this.host.invalidateGeneration();
                try {
                    const changed = this.host.updateState((stateToUpdate) => {
                        this.host.setStatus(stateToUpdate, ValidationStatus.NeedsValidation);
                        delete stateToUpdate.asyncProcessing;
                        delete stateToUpdate.corrected;
                        return stateToUpdate;
                    });
                    if (changed)
                        this.host.notify(this.options);
                }
                catch (cleanupError) {
                    this.logError(`Validation cleanup failed: ${ensureError(cleanupError).message}`);
                }
            }
            throw err;
        }
        this._result.status = ValidationStatus.Undetermined;
    }

    protected processValidatorResult(fieldValResult: ValidatorValidateResult, validator: IValidator): boolean {
        if (fieldValResult.skipped)
            return false;
        if (fieldValResult.issueFound) {
            if (this.options.preliminary && validator.condition.category === ConditionCategory.Require)
                return true;
            const issue = fieldValResult.issueFound;
            issue.doNotSave = true;
            switch (issue.severity) {
                case ValidationSeverity.Error:
                case ValidationSeverity.Severe:
                    this._result.status = ValidationStatus.Invalid;
                    break;
                case ValidationSeverity.Warning:
                    if (this._result.status === ValidationStatus.Undetermined)
                        this._result.status = ValidationStatus.Valid;
                    issue.doNotSave = false;
                    break;
            }
            (this._result.issuesFound ??= []).push(issue);
            return issue.severity === ValidationSeverity.Severe;
        }
        if (this._result.status === ValidationStatus.Undetermined &&
            fieldValResult.conditionEvaluateResult === ConditionEvaluateResult.Match)
            this._result.status = ValidationStatus.Valid;
        return false;
    }

    private reviseStatusIfFailed(): void {
        this._result.status = this._failedIdentities.size ? ValidationStatus.Failed : this._requestedStatus;
        if (this._failedIdentities.size)
            delete this._result.corrected;
    }

    private clearRecoveredFailure(identity: string | null): void {
        if (identity === null || !this._failedIdentities.delete(identity))
            return;
        const remaining = (this._result.issuesFound ?? [])
            .filter(issue => issue.asyncIdentity !== identity);
        this._result.issuesFound = remaining.length ? remaining : null;
    }

    private updateInstanceStateWithResult(): boolean {
        return this.host.updateState((stateToUpdate) => {
            if (this._result.corrected)
                stateToUpdate.corrected = true;
            else
                delete stateToUpdate.corrected;
            // Failed identities overlay the requested status without replacing it.
            this.host.setStatus(stateToUpdate, this._requestedStatus);
            stateToUpdate.issuesFound = this._result.issuesFound;
            if (this._failedIdentities.size)
                stateToUpdate.failedAsyncIdentities = [...this._failedIdentities];
            else
                delete stateToUpdate.failedAsyncIdentities;
            if (this.options.group)
                stateToUpdate.group = this.options.group;
            else
                delete stateToUpdate.group;
            if (this._pendingCount)
                stateToUpdate.asyncProcessing = true;
            else
                delete stateToUpdate.asyncProcessing;
            return stateToUpdate;
        });
    }

    private processPromise(promise: Promise<ValidatorValidateResult>, validator: IValidator,
        context: IPendingContext | null, applyResult: boolean): void {
        // Legacy Promise-returning validators have no retainable async identity.
        const asyncIdentity = validator.condition.category === ConditionCategory.Async ? validator.errorCode : null;
        this._pendingCount++;
        if (context)
            (this._result.pending ??= []).push(context);
        let validatorRejectionHandled = false;
        const completion = promise.then(
            (ivr) => {
                this.completePromise(context, () => {
                    if (applyResult)
                        this.applyResolvedValidatorResult(ivr, validator, asyncIdentity);
                    else if (this.deleteAsyncProcessFlag())
                        this.notifyAsyncStateChanged();
                });
            },
            (failureInfo) => {
                this.completePromise(context, () => {
                    this.logError(failureInfo ? failureInfo.toString() : 'unspecified');
                    if (asyncIdentity !== null)
                        this._failedIdentities.add(asyncIdentity);
                    else
                        this._requestedStatus = ValidationStatus.Failed;
                    this.reviseStatusIfFailed();
                    if (this.updateInstanceStateWithResult())
                        this.notifyAsyncStateChanged();
                });
                if (this.runGeneration !== this.host.getGeneration())
                    this.logError(failureInfo ? failureInfo.toString() : 'unspecified');
                validatorRejectionHandled = true;
                throw ensureError(failureInfo);
            }
        ).catch(error => {
            if (!validatorRejectionHandled) {
                this.logError(ensureError(error).message);
                if (this.runGeneration === this.host.getGeneration()) {
                    if (asyncIdentity !== null)
                        this._failedIdentities.add(asyncIdentity);
                    else
                        this._requestedStatus = ValidationStatus.Failed;
                    this.reviseStatusIfFailed();
                    if (this.updateInstanceStateWithResult())
                        this.notifyAsyncStateChanged();
                }
            }
            throw error;
        });
        (this._result.completions ??= []).push(completion);
        // Field callers need not await; manager callers still observe rejection.
        void completion.catch(() => {});
    }

    private completePromise(context: IPendingContext | null, finish: () => void): void {
        this._pendingCount--;
        if (context && this._result.pending) {
            const index = this._result.pending.indexOf(context);
            if (index >= 0)
                this._result.pending.splice(index, 1);
            if (this._result.pending.length === 0)
                delete this._result.pending;
        }
        if (this.runGeneration === this.host.getGeneration())
            finish();
    }

    private deleteAsyncProcessFlag(): boolean {
        if (!this._pendingCount)
            return this.host.updateState((stateToUpdate) => {
                delete stateToUpdate.asyncProcessing;
                return stateToUpdate;
            });
        return false;
    }

    protected notifyAsyncStateChanged(): void {
        // Updating state may have synchronously started a newer validation run.
        if (this.runGeneration !== this.host.getGeneration())
            return;
        try {
            this.host.notify(this.options);
        }
        catch (error) {
            // Notification failures are not validator failures.
            this.logError(`Async validation notification failed: ${ensureError(error).message}`);
        }
    }

    private applyResolvedValidatorResult(ivr: ValidatorValidateResult, validator: IValidator,
        asyncIdentity: string | null): void {
        if (ivr.failedToResolve) {
            if (asyncIdentity !== null)
                this._failedIdentities.add(asyncIdentity);
            else
                this._requestedStatus = ValidationStatus.Failed;
            if (ivr.issueFound) {
                const issueFound = ivr.issueFound;
                issueFound.doNotSave = true;
                // Replace the array so host state change detection sees the update.
                const issues = [...(this._result.issuesFound ?? [])];
                const existingIndex = asyncIdentity === null ? -1 :
                    issues.findIndex(issue => issue.asyncIdentity === asyncIdentity);
                if (existingIndex < 0)
                    issues.push(issueFound);
                else
                    issues[existingIndex] = issueFound;
                this._result.issuesFound = issues;
            }
            this.reviseStatusIfFailed();
            if (this.updateInstanceStateWithResult())
                this.notifyAsyncStateChanged();
        }
        else if (ivr.skipped) {
            if (this.deleteAsyncProcessFlag())
                this.notifyAsyncStateChanged();
        }
        else if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
            if (!ivr.issueFound)
                throw new CodingError(`Validator "${validator.errorCode}" returned NoMatch without an issue`);
            this.clearRecoveredFailure(asyncIdentity);
            if (ivr.issueFound.severity === ValidationSeverity.Warning) {
                ivr.issueFound.doNotSave = false;
                if (this._requestedStatus === ValidationStatus.Undetermined)
                    this._requestedStatus = ValidationStatus.Valid;
            }
            else if (this._requestedStatus !== ValidationStatus.Failed)
                this._requestedStatus = ValidationStatus.Invalid;
            this._result.issuesFound = [...(this._result.issuesFound ?? []), ivr.issueFound];
            this.reviseStatusIfFailed();
            if (this.updateInstanceStateWithResult())
                this.notifyAsyncStateChanged();
        }
        else if (ivr.conditionEvaluateResult === ConditionEvaluateResult.Match) {
            this.clearRecoveredFailure(asyncIdentity);
            if (this._requestedStatus === ValidationStatus.Undetermined)
                this._requestedStatus = ValidationStatus.Valid;
            this.reviseStatusIfFailed();
            if (this.updateInstanceStateWithResult())
                this.notifyAsyncStateChanged();
        }
        else {
            if (this.deleteAsyncProcessFlag())
                this.notifyAsyncStateChanged();
        }
    }

    private adjustCorrectedFlag(): void {
        const isValid = this._result.status === ValidationStatus.Valid && !this._pendingCount;
        const state = this.host.getState();
        const wasInvalid = state.status === ValidationStatus.Invalid ||
            (state.status === ValidationStatus.NeedsValidation &&
                state.lastStatus === ValidationStatus.Invalid);
        if (wasInvalid && isValid)
            this._result.corrected = true;
        else
            delete this._result.corrected;
    }

    protected logResult(): void {
        this.host.getLogger().log(LoggingLevel.Info, () => ({
            message: `Validation result: ${ValidationStatus[this._result.status]} Issues found:` +
                (this._result.issuesFound ? JSON.stringify(this._result.issuesFound) : 'none'),
            category: LoggingCategory.Result
        }));
    }

    private logError(message: string): void
    {
    // note: not using host.getLogger intentionally, because this is often called after the host logger was detached
        this.logger.log(LoggingLevel.Error, () => ({
            message: message ?? 'Reason unspecified',
            category: LoggingCategory.Exception
        }));
    }
}
