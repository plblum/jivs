/**
 * A ValueHost that uses the Validator class to provide validation.
 * @module jivs-engine/ValueHosts/AbstractClasses/ValidatorsValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { objectKeysCount, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, IssueFound } from '../Interfaces/Validation';
import { ValidatorValidateResult, IValidator } from '../Interfaces/Validator';
import { SevereErrorBase, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import { ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { ConditionType } from '../Conditions/ConditionTypes';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';

/**
 * Standard implementation of IValidatorsValueHostBase. It owns a list of Validators
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
export abstract class ValidatorsValueHostBase<TConfig extends ValidatorsValueHostBaseConfig, TState extends ValidatorsValueHostBaseInstanceState>
    extends ValidatableValueHostBase<TConfig, TState>
    implements IValidatorsValueHostBase {
    constructor(valueHostsManager: IValueHostsManager, config: TConfig, state: TState) {
        super(valueHostsManager, config, state);
    }

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public override dispose(): void
    {
        this.config.validatorConfigs = undefined!;
        super.dispose();
        this._validators?.forEach((validator) => { validator.dispose(); });
        this._validators = undefined!;
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
                        processPromise(potentialIVR);
                        continue;
                    }
                    // synchronous (normal) processing
                    const fieldValResult = potentialIVR as ValidatorValidateResult;
                    if (fieldValResult.skipped)
                        continue;
                    validatorsInUse++;    // eslint-disable-line @typescript-eslint/no-unused-vars
                    if (fieldValResult.issueFound) {
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
                    throw err;

                // resume normal processing with Undetermined state
                result.status = ValidationStatus.Undetermined;
            }
            adjustCorrectedFlag();         
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
        function updateInstanceStateWithResult(result: ValueHostValidateResult): boolean {
            return self.updateInstanceState((stateToUpdate) => {
                if (result.corrected)
                    stateToUpdate.corrected = true;
                else
                    delete stateToUpdate.corrected;
                stateToUpdate.status = result.status;
                stateToUpdate.issuesFound = result.issuesFound;
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
        function processPromise(promise: Promise<ValidatorValidateResult>): void {
            function completeThePromise(finish: () => void): void {
                // remove the promise from result.Pending.
                // We use result.Pending == null to mean no async processes remain.
                // If Pending is null already, an external action has abandoned the current validation run
                if (result.pending && result.pending.includes(promise)) {
                    const index = result.pending.indexOf(promise);
                     
                    result.pending.splice(index, 1);
                    if (result.pending.length === 0)
                        delete result.pending;

                    finish();
                }
            }
            function deleteAsyncProcessFlag(): void {
                if (!result.pending)
                    self.updateInstanceState((stateToUpdate) => {
                        delete stateToUpdate.asyncProcessing;
                        return stateToUpdate;
                    }, self);
            }
            if (!result.pending)
                result.pending = [];
            result.pending.push(promise);
            promise.then(
                (ivr) => {
                    completeThePromise(() => {
                        // the only way we modify the issues, validation result, or ValueHostInstanceState
                        if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
                            result.status = ValidationStatus.Invalid;
                            if (!result.issuesFound)
                                result.issuesFound = [];
                            result.issuesFound.push(ivr.issueFound!);
                            if (updateInstanceStateWithResult(result))
                                self.invokeOnValueHostValidationStateChanged(options);

                        }
                        else
                            deleteAsyncProcessFlag();
                    });
                },
                (failureInfo) => {
                    completeThePromise(() => {
                        deleteAsyncProcessFlag();
                        logError(failureInfo ? failureInfo.toString() : 'unspecified');
                    });
                }
            );
            // no change to the ValidationStatus here            
        }
        function adjustCorrectedFlag(): void
        {
            // transition Invalid->Valid or already corrected and still valid, corrected=true
            if ((self.instanceState.status === ValidationStatus.Invalid &&
                result.status === ValidationStatus.Valid) ||
                (self.instanceState.corrected && result.status === ValidationStatus.Valid))
                result.corrected = true;
            else
                delete result.corrected;                        
        }

        function bailout(errorMessage: string): null {
            self.logger.message(LoggingLevel.Info, () => errorMessage);
            return null;
        }

        function logError(message: string): void {
            self.logger.log(LoggingLevel.Error, (options) => {
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
            this._validators = this.orderValidators(this.generateValidators());
        return this._validators;
    }
    // populated by Validators() when null. Set to null by UpdateValueHostConfig
    // to account for changes made there.
    private _validators: Array<IValidator> | null = null;

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
    * An IssueFound normally arrives in the externalIssuesFound array via addExternalIssueFound. 
    * However, it may be overridden by the presence of a Validator already setup with the same errorcode.
    * In that case, we add or replace an IssueFound in instanceState.issuesFound previously setup.
    * Our intent: preserve the validator's error messages, and severity (can be overridden).
    * The validator may not have found the issue on the client side, but the server did, 
    * so we act like the client-side validator found it, preserving the error message from the client side.
     */
    public override addExternalIssueFound(error: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        if (error) {
            if (!this.isEnabled())
            {
                this.logger.message(LoggingLevel.Warn, () => `IssueFound applied on disabled ValueHost "${this.getName()}"`);                
            }
        
            // If the errorCode aligns to a validator, create that validator's IssueFound shape instead.
            // From this point on, the issue is treated as a validator result, not as an external issue.
            // That means validator semantics apply, including the validator's doNotSave behavior.
            // The external IssueFound likely starts with doNotSave = false
            if (error.errorCode)
                for (let i = 0; i < this.validators().length; i++) {
                    const validator = this.validators()[i];
                    const valResult = validator.tryValidatorSwap(error);
                    if (valResult) {
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
                            for (let issueIndex = 0; issueIndex < stateToUpdate.issuesFound.length; issueIndex++) {
                                if (stateToUpdate.issuesFound[issueIndex].errorCode === error.errorCode) {
                                    replacementIndex = issueIndex;
                                    break;
                                }
                            }

                            if (replacementIndex === -1)
                                stateToUpdate.issuesFound.push(valResult.issueFound!);
                            else
                                stateToUpdate.issuesFound[replacementIndex] = valResult.issueFound!;
                            stateToUpdate.status = ValidationStatus.Invalid;
                            //NOTE: leave stateToUpdate.group and asyncProcessing alone
                            return stateToUpdate;
                        }, this);
                        if (changed) {
                            this.invokeOnValueHostValidationStateChanged(options);
                            return true;
                        }
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

        if (state.issuesFound) {
            const oldState = state.issuesFound;

            config.validatorConfigs?.forEach((valConfig) => {
                let errorCode: string | null = cleanString(valConfig.errorCode);
                if (!errorCode && valConfig.conditionConfig)
                    errorCode = valConfig.conditionConfig.conditionType;
                else if (valConfig.conditionCreator) {
                    const cond = valConfig.conditionCreator(valConfig);   // return null is actually a configuration bug reported to the user in Validator.Condition
                    if (cond)
                        errorCode = cond.conditionType;
                }
                if (!errorCode)
                    /* istanbul ignore next */  // defensive. Current code always establishes an error code
                    errorCode = ConditionType.Unknown;
                const found = oldState.find((value) => value.errorCode === errorCode);
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
        }
    }

}
