/**
 * A ValueHost that uses the Validator class to provide validation.
 * @module ValueHosts/AbstractClasses/ValidatorsValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { objectKeysCount, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, IssueFound, BusinessLogicError } from '../Interfaces/Validation';
import { ValidatorValidateResult, IValidator } from '../Interfaces/Validator';
import { SevereErrorBase, assertNotNull, ensureError } from '../Utilities/ErrorHandling';
import { ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { ConditionType } from '../Conditions/ConditionTypes';
import { IValidationManager } from '../Interfaces/ValidationManager';

/**
 * Standard implementation of IValidatorsValueHostBase. It owns a list of Validators
 * which support its validate() function.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - validationManager 
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
    constructor(validationManager: IValidationManager, config: TConfig, state: TState) {
        super(validationManager, config, state);
    }

    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        this.config.validatorConfigs = undefined!;
        super.dispose();
        this._validators?.forEach((validator) => validator.dispose());
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
            this.logQuick(LoggingLevel.Debug, () => `Validation skipped because ValueHost "${this.getName()}" is disabled`);            
            return null;
        }
        let self = this;
        if (!options)
            options = {};
        this.logQuick(LoggingLevel.Debug, ()=> `Validating ValueHost "${this.getName()}"`);
        
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        let result: ValueHostValidateResult = {
            status: ValidationStatus.Undetermined,
            issuesFound: null
        };

        if (!this.groupsMatch(options.group, false))
            return bailout(`Group names do not match "${options.group}" vs "${this.config.group}"`);

        try {
            try {
                let validators = this.validators();
                let stop = false;
                let validatorsInUse = 0;

                for (let i = 0; !stop && i < validators.length; i++) {
                    let iv = validators[i];
                    let potentialIVR = iv.validate(options);
                    // promises will update the results later
                    // All other validators in this loop will still finish
                    // by updating the state. The state is just missing the results
                    // from this validator. When this completes, it updates the state again.
                    if (potentialIVR instanceof Promise) {
                        processPromise(potentialIVR);
                        continue;
                    }
                    // synchronous (normal) processing
                    let inputValResult = potentialIVR as ValidatorValidateResult;
                    if (inputValResult.skipped)
                        continue;
                    validatorsInUse++;
                    if (inputValResult.issueFound) {
                        switch (inputValResult.issueFound.severity) {
                            case ValidationSeverity.Error:
                            case ValidationSeverity.Severe:
                                result.status = ValidationStatus.Invalid;
                                break;
                            case ValidationSeverity.Warning:
                                if (result.status === ValidationStatus.Undetermined)
                                    result.status = ValidationStatus.Valid;
                                break;
                        }

                        if (!result.issuesFound)
                            result.issuesFound = [];
                        let issueFound = inputValResult.issueFound;
                        result.issuesFound.push(issueFound);
                        if (issueFound.severity === ValidationSeverity.Severe)
                            stop = true;
                    }
                    else if (result.status === ValidationStatus.Undetermined)
                        if (inputValResult.conditionEvaluateResult === ConditionEvaluateResult.Match)
                            result.status = ValidationStatus.Valid;    // may be overwritten by a later validator

                }
                // unnecessary as this should always be the case at this point
                // if (validatorsInUse === 0)
                //     result.status = ValidationStatus.Undetermined; 

            }
            catch (e) {
                let err = ensureError(e);                

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
            this.log(LoggingLevel.Info, (options) => {
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
                    let index = result.pending.indexOf(promise);
                    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
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
            self.logQuick(LoggingLevel.Info, () => errorMessage);
            return null;
        }

        function logError(message: string): void {
            self.log(LoggingLevel.Error, (options) => {
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
        let factory = this.services.validatorFactory;
        let validators: Array<IValidator> = [];
        this.config.validatorConfigs?.forEach((valDesc) => {
            let pv = factory.create(this, valDesc);
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
        let fn = (a: IValidator, b: IValidator): number => a.condition.category - b.condition.category;
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else        /* istanbul ignore next */ // we don't run our unit tests in pre-ES2016 mode required to test this.
            return unordered.sort(fn);
    }

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in AssociatedValueHostName.
     * Each time called, it adds to the existing list. Use clearBusinessLogicErrors() first if starting a fresh list.
     * It calls onValueHostValidationStateChanged if there was a changed to the state.
     * 
     * In this class, we first see if the errorcode in the error matches an existing validator.
     * If so, we use that validator, and add an IssueFound from that validator.
     * 
     * @param error - A business logic error to show. If it has an errorCode assigned and the same
     * errorCode is already recorded here, the new entry replaces the old one.
     * @returns true when a change was made to the known validation state.
     */
    public setBusinessLogicError(error: BusinessLogicError, options?: ValidateOptions): boolean {
        if (error) {
            if (!this.isEnabled())
            {
                this.logQuick(LoggingLevel.Warn, () => `BusinessLogicError applied on disabled ValueHost "${this.getName()}"`);                
            }
        
            // see if the error code matches an existing validator.
            // If so, use that validator's ValidatorValidateResult instead.
            if (error.errorCode)
                for (let i = 0; i < this.validators().length; i++) {
                    let validator = this.validators()[i];
                    let valResult = validator.tryValidatorSwap(error);
                    if (valResult) {
                        if (error.severity)
                            valResult.issueFound!.severity = error.severity;
                        let changed = this.updateInstanceState((stateToUpdate) => {
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
        return super.setBusinessLogicError(error, options);
    }

    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void {
        let validators = this.validators();
        for (let validator of validators)
            validator.gatherValueHostNames(collection, valueHostResolver);
    }

    /**
     * Gets an Validator already assigned to this ValidatorsValueHostBase.
     * @param errorCode - Same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The Validator or null if the condition type does not match.
     */
    public getValidator(errorCode: string): IValidator | null {
        let ec = cleanString(errorCode);
        if (ec)
            for (let iv of this.validators())
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
            let oldState = state.issuesFound;

            config.validatorConfigs?.forEach((valConfig) => {
                let errorCode: string | null = cleanString(valConfig.errorCode);
                if (!errorCode && valConfig.conditionConfig)
                    errorCode = valConfig.conditionConfig.conditionType;
                else if (valConfig.conditionCreator) {
                    let cond = valConfig.conditionCreator(valConfig);   // return null is actually a configuration bug reported to the user in Validator.Condition
                    if (cond)
                        errorCode = cond.conditionType;
                }
                if (!errorCode)
                    /* istanbul ignore next */  // defensive. Current code always establishes an error code
                    errorCode = ConditionType.Unknown;
                let found = oldState.find((value) => value.errorCode === errorCode);
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
                for (let issueFound of state.issuesFound!) {
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
