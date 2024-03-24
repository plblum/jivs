/**
 * A ValueHost that supports input validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - Validate function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of InputValidators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module ValueHosts/ConcreteClasses/InputValueHost
 */
import { ValueHostId } from "../DataTypes/BasicTypes";
import { ConfigurationCategory, LoggingLevel, ValidationCategory } from "../Interfaces/Logger";
import { objectKeysCount, groupsMatch } from "../Utilities/Utilities";
import { toIValidationManagerCallbacks } from "./ValidationManager";
import { IValueHostResolver, IValueHostsManager } from "../Interfaces/ValueHostResolver";
import { ConditionEvaluateResult, ConditionCategory } from "../Interfaces/Conditions";
import { InputValueHostDescriptor, InputValueHostState, IInputValueHost } from "../Interfaces/InputValueHost";
import { ValidateOptions, ValidateResult, ValidationResult, ValidationSeverity, ValidationResultString, IssueFound } from "../Interfaces/Validation";
import { InputValueHostBase, InputValueHostBaseGenerator } from "./InputValueHostBase";
import { InputValidateResult, IInputValidator, InputValidatorDescriptor } from "../Interfaces/InputValidator";
import { assertNotNull } from "../Utilities/ErrorHandling";


/**
 * Standard implementation of IInputValueHost. It owns a list of InputValidators
 * which support its Validate method.
 * Use ValueHostDescriptor.Type = "Input" for the ValidationManager to use this class.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager - Typically this is the ValidationManager.
* - InputValueHostDescriptor - The business logic supplies these rules
*   to implement a ValueHost's Id, label, data type, validation rules,
*   and other business logic metadata.
* - InputValueHostState - State used by this InputValueHost including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export class InputValueHost extends InputValueHostBase<InputValueHostDescriptor, InputValueHostState>{
    constructor(valueHostsManager: IValueHostsManager, descriptor: InputValueHostDescriptor, state: InputValueHostState) {
        super(valueHostsManager, descriptor, state);
    }

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns IValidatorStateDictionary
     * with all of the NoMatches.
     * If all were Matched or Undetermined, it returns null indicating
     * validation isn't blocking saving the data.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns IValidationResultDetails if at least one is invalid or null if all valid.
     */
    public validate(options?: ValidateOptions): ValidateResult {
        let self = this;
        if (!options)
            options = {};
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        let result: ValidateResult = {
            ValidationResult: ValidationResult.Undetermined,
            IssuesFound: null
        };

        if (!groupsMatch(options.Group, this.Descriptor.Group))
            return bailout(`Group names do not match "${options.Group}" vs "${this.Descriptor.Group?.toString()}"`);      
        
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
                    if (potentialIVR instanceof Promise)
                    {
                        processPromise(potentialIVR);
                        continue;
                    }
                // synchronous (normal) processing
                    let inputValResult = potentialIVR as InputValidateResult;
                    if (inputValResult.Skipped)
                        continue;
                    validatorsInUse++;
                    if (inputValResult.IssueFound) {
                        switch (inputValResult.IssueFound.Severity) {
                            case ValidationSeverity.Error:
                            case ValidationSeverity.Severe:
                                result.ValidationResult = ValidationResult.Invalid;
                                break;
                            case ValidationSeverity.Warning:
                                if (result.ValidationResult === ValidationResult.Undetermined)
                                    result.ValidationResult = ValidationResult.Valid;
                                break;
                        }

                        if (!result.IssuesFound)
                            result.IssuesFound = [];
                        let issueFound = inputValResult.IssueFound;
                        result.IssuesFound.push(issueFound);
                        if (issueFound.Severity === ValidationSeverity.Severe)
                            stop = true;
                    }
                    else if (result.ValidationResult === ValidationResult.Undetermined)
                        if (inputValResult.ConditionEvaluateResult === ConditionEvaluateResult.Match)
                            result.ValidationResult = ValidationResult.Valid;    // may be overwritten by a later validator

                }
                if (validatorsInUse === 0)
                    result.ValidationResult = ValidationResult.Valid; 

            }
            catch (e)
            {
                if (e instanceof Error)
                    logError(e.message);
                // resume normal processing with Undetermined state
                result.ValidationResult = ValidationResult.Undetermined;
            }                  
            if (updateStateWithResult(result))
                toIValidationManagerCallbacks(this.ValueHostsManager)?.OnValueHostValidated?.(this, result);
            return result;
        }
  
        finally {
            logInfo(() => {
                return {
                    message: `Input Validation result: ${ValidationResultString[result.ValidationResult]} Issues found:` +
                        (result.IssuesFound ? JSON.stringify(result.IssuesFound) : 'none')
                };
            });
        }
        function updateStateWithResult(result: ValidateResult): boolean
        {
            return self.updateState((stateToUpdate) => {
                stateToUpdate.ValidationResult = result.ValidationResult;
                stateToUpdate.IssuesFound = result.IssuesFound;
                if (options!.Group)
                    stateToUpdate.Group = options!.Group;
                if (result.Pending)
                    stateToUpdate.AsyncProcessing = true;
                else
                    delete stateToUpdate.AsyncProcessing;
                return stateToUpdate;
            }, self);
        }
        function processPromise(promise: Promise<InputValidateResult>): void
        {
            function completeThePromise(finish: () => void)
            {
                // remove the promise from result.Pending.
                // We use result.Pending == null to mean no async processes remain.
                // If Pending is null already, an external action has abandoned the current validation run
                if (result.Pending && result.Pending.includes(promise))
                {
                    let index = result.Pending.indexOf(promise);
                    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
                    result.Pending.splice(index, 1);
                    if (result.Pending.length === 0)
                        delete result.Pending;

                    finish();
                }
            }
            function deleteAsyncProcessFlag()
            {
                if (!result.Pending)
                    self.updateState((stateToUpdate) => {
                        delete stateToUpdate.AsyncProcessing;
                        return stateToUpdate;
                    }, self);
            }
            if (!result.Pending)
                result.Pending = [];
            result.Pending.push(promise);
            promise.then(
            (ivr) => {
                    completeThePromise(() => {
                        // the only way we modify the issues, validation result, or State
                        if (ivr.ConditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
                            result.ValidationResult = ValidationResult.Invalid;
                            if (!result.IssuesFound)
                                result.IssuesFound = [];
                            result.IssuesFound.push(ivr.IssueFound!);
                            if (updateStateWithResult(result))
                                toIValidationManagerCallbacks(self.ValueHostsManager)?.OnValueHostValidated?.(self, result);
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
        // no change to the ValidationResult here            
        }

        function bailout(errorMessage: string): ValidateResult
        {
            let resultState: ValidateResult = {
                ValidationResult: ValidationResult.Undetermined,
                IssuesFound: null
            };
            logInfo(() => {
                return {
                    message: errorMessage
                };
            });
            return resultState;                    
        }        
        function logInfo(
            fn: () => { message: string; source?: string })
        {
            if (self.Services.LoggerService.MinLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.Services.LoggerService.log(parms.message, LoggingLevel.Info,
                    ValidationCategory,
                    parms.source ?? `ValueHost ID ${self.Descriptor.Id}`);
            }
        }        
        function logError(message: string): void
        {
            self.Services.LoggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, ValidationCategory, self.Descriptor.Id);
        }
    }

    //#region validation
    /**
     * Provides the list of IInputValidator instances derived
     * from the ValidatorDescriptors. Lazy loads the instances.
     */
    protected validators(): Array<IInputValidator> {
        if (this._validators === null)
            this._validators = this.generateValidators();
        return this._validators;
    }
    // populated by Validators() when null. Set to null by UpdateValueHostDescriptor
    // to account for changes made there.
    private _validators: Array<IInputValidator> | null = null;

    /**
     * Generates an array of all InputValidators from ValueHostDescriptor.ValidatorDescriptors.
     * Sorts the by Category so Required is always first, DataTypeCheck is just after Required.
     * @returns 
     */
    protected generateValidators(): Array<IInputValidator> {
        let factory = this.Services.InputValidatorFactory;
        let validators: Array<IInputValidator> = [];
        let needsDataTypeCheck = true;
        this.Descriptor.ValidatorDescriptors?.forEach((valDesc) => {
            let pv = factory.create(this, valDesc);
            validators.push(pv);
            if (needsDataTypeCheck && pv.Condition.Category === ConditionCategory.DataTypeCheck)
                needsDataTypeCheck = false;
        });
        if (needsDataTypeCheck)
            this.tryAutoGenerateDataTypeCheckCondition(validators);
        return this.orderValidators(validators);
    }
    protected orderValidators(unordered: Array<IInputValidator>): Array<IInputValidator>
    {
        let fn = (a: IInputValidator, b: IInputValidator) => a.Condition.Category - b.Condition.Category;
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else
            return unordered.sort(fn);
    }
    protected tryAutoGenerateDataTypeCheckCondition(validators: Array<IInputValidator>): boolean
    {
        let created = false;
        if (this.Services.DataTypeServices.AutoGenerateDataTypeConditionEnabled) {
            let lookupKey = this.getDataType();
            if (lookupKey) {
                let dtcCondition = this.Services.DataTypeServices.autoGenerateDataTypeCondition(this, lookupKey);
                if (dtcCondition != null) {
                    let descriptor: InputValidatorDescriptor = {
                        /* eslint-disable-next-line @typescript-eslint/naming-convention */
                        ConditionCreator: (requester) => dtcCondition,
                        ConditionDescriptor: null,
                        ErrorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        Severity: ValidationSeverity.Severe
                    };
                    validators.push(this.Services.InputValidatorFactory.create(this, descriptor));
                    this.Services.LoggerService.log(`Added ${dtcCondition.ConditionType} Condition for Data Type Check`,
                        LoggingLevel.Info, ConfigurationCategory, `InputValidator on ${this.getId()}`);
                    created = true;
                }
            }
        }
        return created;
    }
    /**
     * Resolves from the generated InputValidators by checking the first for
     * Condition.Category = Required
     */
    public get RequiresInput(): boolean
    {
        // by design, Validators are sorted with Required first. So only check the first
        let validators = this.validators();

        return validators != null && validators.length > 0 &&
            (validators[0].Condition.Category === ConditionCategory.Required);
    }
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        let validators = this.validators();
        if (validators)
            for (let validator of validators)
                validator.gatherValueHostIds(collection, valueHostResolver);
    }
}
/**
 * Determines if the object implements IInputValueHost.
 * @param source 
 * @returns source typecasted to IInputValueHost if appropriate or null if not.
 */
export function toIInputValueHost(source: any): IInputValueHost | null
{
    if (source instanceof InputValueHostBase)
        return source as IInputValueHost;
    if (source && typeof source === 'object')
    {
        let test = source as IInputValueHost;    
        // some select members of IInputValueHost
        if (test.getInputValue !== undefined && 
            test.setInputValue !== undefined &&
            test.validate !== undefined &&
            test.getIssuesForInput !== undefined)
            return test;
    }
    return null;
}

export const InputValueHostType = 'Input';
export class InputValueHostGenerator extends InputValueHostBaseGenerator {
    public canCreate(descriptor: InputValueHostDescriptor): boolean {
        if (descriptor.Type != null)    // null/undefined
            return descriptor.Type === InputValueHostType;

        if (descriptor.ValidatorDescriptors === undefined)
            return false;
        return true;
    }
    public create(valueHostsManager: IValueHostsManager, descriptor: InputValueHostDescriptor, state: InputValueHostState): IInputValueHost {
        return new InputValueHost(valueHostsManager, descriptor, state);
    }
/**
 * Looking for changes to the ValidationDescriptors to impact IssuesFound.
 * If IssuesFound did change, fix ValidationResult for when Invalid to 
 * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
 * @param state 
 * @param descriptor 
 */    
    public cleanupState(state: InputValueHostState, descriptor: InputValueHostDescriptor): void {
        assertNotNull(state, 'state');
        assertNotNull(descriptor, 'descriptor');
        let descriptorChanged = false;
        let oldStateCount = 0;
        let issuesFound: Array<IssueFound> | null = null;

        if (state.IssuesFound) {
            let oldState = state.IssuesFound;

            descriptor.ValidatorDescriptors?.forEach((valDescriptor) => {
                let condType = 'UNKNOWN';
                if (valDescriptor.ConditionDescriptor)
                    condType = valDescriptor.ConditionDescriptor.Type;
                else if (valDescriptor.ConditionCreator)
                {
                    let cond = valDescriptor.ConditionCreator(valDescriptor);   // return null is actually a configuration bug reported to the user in InputValidator.Condition
                    if (cond)
                        condType = cond.ConditionType;
                }
                let found = oldState.find((value) => value.ConditionType === condType);
                if (found) {
                    if (!issuesFound)
                        issuesFound = [];
                    issuesFound.push(found);
                    oldStateCount++;
                }
                else
                    descriptorChanged = true;
            });
        }
        if (!descriptorChanged && (oldStateCount === objectKeysCount(state.IssuesFound)))
            return;

        state.IssuesFound = issuesFound as (Array<IssueFound> | null);
        // fix validation result for when validation had occurred
        if (state.ValidationResult === ValidationResult.Invalid) {
            let vr = ValidationResult.ValueChangedButUnvalidated;
            let warningFound = false;
            if (issuesFound) {
                for (let issueFound of state.IssuesFound!) {
                    if (issueFound.Severity !== ValidationSeverity.Warning) {
                        vr = ValidationResult.Invalid;
                        break;
                    }
                    else
                        warningFound = true;
                }
                if (warningFound && vr === ValidationResult.ValueChangedButUnvalidated)
                    vr = ValidationResult.Valid;
            }
            state.ValidationResult = vr;
        }
    }

}