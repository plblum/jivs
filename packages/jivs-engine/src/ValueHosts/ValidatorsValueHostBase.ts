/**
 * A ValueHost that uses the Validator class to provide validation.
 * @module ValueHosts/ConcreteClasses/ValidatorsValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { objectKeysCount, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ConditionEvaluateResult } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, ValidationStatusString, IssueFound, BusinessLogicError } from '../Interfaces/Validation';
import { ValidatorValidateResult, IValidator, ValidatorConfig } from '../Interfaces/Validator';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { ValidatorsValueHostBaseConfig, ValidatorsValueHostBaseInstanceState, IValidatorsValueHostBase } from '../Interfaces/ValidatorsValueHostBase';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { FluentValidatorCollector } from './Fluent';
import { enableFluent } from '../Conditions/FluentValidatorCollectorExtensions';
import { ConditionType } from '../Conditions/ConditionTypes';

/**
 * Standard implementation of IValidatorsValueHostBase. It owns a list of Validators
 * which support its validate() function.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager - Typically this is the ValidationManager.
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

    //#region IValidatorsValueHostBase


    //#endregion IValidatorsValueHostBase

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns ValueHostValidateResult
     * with all of the NoMatches in issuesFound.
     * If all were Matched, it returns ValueHostValidateResult.Value and issuesFound=null.
     * If there are no validators, or all validators were skipped (disabled),
     * it returns ValidationStatus.Undetermined.
     * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult | null {
        let self = this;
        if (!options)
            options = {};
        lazyLog(() => {
            return { message: `Validating ValueHostName ${this.getName()}` }
        }, LoggingLevel.Debug);
        
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        let result: ValueHostValidateResult = {
            status: ValidationStatus.Undetermined,
            issuesFound: null
        };

        if (!this.groupsMatch(options.group, false))
            return bailout(`Group names do not match "${options.group}" vs "${this.config.group?.toString()}"`);

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
                if (e instanceof Error)
                    logError(e.message);
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
            lazyLog(() => {
                return {
                    message: `Input Validation result: ${ValidationStatusString[result.status]} Issues found:` +
                        (result.issuesFound ? JSON.stringify(result.issuesFound) : 'none')
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
            lazyLog(() => {
                return {
                    message: errorMessage
                };
            });
            return null;
        }
        function lazyLog(
            fn: () => { message: string; source?: string }, logLevel : LoggingLevel = LoggingLevel.Info): void {
            if (self.services.loggerService.minLevel <= logLevel) {
                let parms = fn();
                self.services.loggerService.log(parms.message, logLevel,
                    LoggingCategory.Validation,
                    parms.source ?? `ValueHost name ${self.config.name}`);
            }
        }
        function logError(message: string): void {
            self.services.loggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, LoggingCategory.Validation, self.config.name);
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
        else
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

    /**
     * Intended for the UI developer to add their own UI specific validators
     * to those already configured within ValidationManager.
     * 
     * It adds or replaces when the ConditionType matches an existing 
     * ValidatorConfig.
     * 
     * Try to avoid using it for validators coming from business logic.
     * This fits well with Data Type Check cases that were
     * not setup by Auto Generate Data Type Checks (see AutoGenerateDataTypeCheckService).
     * 
     * The RequireTextCondition and StringLengthCondition are good too,
     * but their rules typically are known by business logic and its just
     * a matter of converting "required" and "string length" business rules
     * to these conditions during setup in ValidationManager.
     * @param config 
     */
    public addValidator(config: ValidatorConfig): void {
        this._validators = null;    // force recreation
        if (!this.config.validatorConfigs)
            this.config.validatorConfigs = [];
        let knownConditionType: string | null =
            config.conditionConfig ? config.conditionConfig.conditionType : null;
        if (knownConditionType) {
            let index = this.config.validatorConfigs.findIndex((ivd) =>
                (ivd.conditionConfig ? ivd.conditionConfig.conditionType : '') ===
                knownConditionType
            );
            if (index > -1) {
                this.config.validatorConfigs[index] = config;
                return;
            }
        }
        this.config.validatorConfigs.push(config);
    }
    /**
     * Alternative way to add validators (see @link addValidator)
     * where you chain validation rules to this function like this:
     * `vh.configValidators().required().regExp(/\d/)`
     */
    public configValidators(): FluentValidatorCollector {
        enableFluent();
        this._validators = null;    // force recreation   
        if (!this.config.validatorConfigs)
            this.config.validatorConfigs = [];
        return new FluentValidatorCollector(this.config);
    }

    /**
     * While you normally set the validation group name with ValidatorsValueHostBaseConfig.group,
     * ValidatorsValueHostBaseConfig is often setup from the perspective of the business logic,
     * which does not make the ultimate decision on field grouping.
     * Call this from the UI layer when establishing the input to replace the supplied
     * group name.
     * @param group - When undefined, it restores group to ValidatorsValueHostBaseConfig.group
     */
    public setGroup(group: string): void {
        this.saveIntoInstanceState('_group', group);
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
