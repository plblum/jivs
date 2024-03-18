/**
 * A ValueHost that supports input validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - Validate function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of InputValidators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module ValueHosts/InputValueHost
 */
import { ValueHostId } from "../DataTypes/BasicTypes";
import { LoggingLevel, ValidationCategory } from "../Interfaces/Logger";
import { ObjectKeysCount, GroupsMatch } from "../Utilities/Utilities";
import { ToIValidationManagerCallbacks } from "./ValidationManager";
import { IValueHostResolver, IValueHostsManager } from "../Interfaces/ValueHostResolver";
import { ConditionEvaluateResult, ConditionCategory } from "../Interfaces/Conditions";
import { IInputValueHostDescriptor, IInputValueHostState, IInputValueHost } from "../Interfaces/InputValueHost";
import { IValidateOptions, IValidateResult, ValidationResult, ValidationSeverity, ValidationResultString, IIssueFound } from "../Interfaces/Validation";
import { InputValueHostBase, InputValueHostBaseGenerator } from "./InputValueHostBase";
import { IInputValidateResult, IInputValidator } from "../Interfaces/InputValidator";
import { AssertNotNull } from "../Utilities/ErrorHandling";


/**
 * Standard implementation of IInputValueHost. It owns a list of InputValidators
 * which support its Validate method.
 * Use ValueHostDescriptor.Type = "Input" for the ValidationManager to use this class.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager - Typically this is the ValidationManager.
* - IInputValueHostDescriptor - The business logic supplies these rules
*   to implement a ValueHost's Id, label, data type, validation rules,
*   and other business logic metadata.
* - IInputValueHostState - State used by this InputValueHost including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export class InputValueHost extends InputValueHostBase<IInputValueHostDescriptor, IInputValueHostState>{
    constructor(valueHostsManager: IValueHostsManager, descriptor: IInputValueHostDescriptor, state: IInputValueHostState) {
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
    public Validate(options?: IValidateOptions): IValidateResult {
        let self = this;
        if (!options)
            options = {};
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        let result: IValidateResult = {
            ValidationResult: ValidationResult.Undetermined,
            IssuesFound: null
        };

        if (!GroupsMatch(options.Group, this.Descriptor.Group))
            return Bailout(`Group names do not match "${options.Group}" vs "${this.Descriptor.Group?.toString()}"`);      
        
        try {
            try {
                let validators = this.Validators();
                let stop = false;
                let validatorsInUse = 0;

                for (let i = 0; !stop && i < validators.length; i++) {
                    let iv = validators[i];
                    let potentialIVR = iv.Validate(options);
                    // promises will update the results later
                    // All other validators in this loop will still finish
                    // by updating the state. The state is just missing the results
                    // from this validator. When this completes, it updates the state again.
                    if (potentialIVR instanceof Promise)
                    {
                        ProcessPromise(potentialIVR);
                        continue;
                    }
                // synchronous (normal) processing
                    let inputValResult = potentialIVR as IInputValidateResult;
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

                };
                if (validatorsInUse === 0)
                    result.ValidationResult = ValidationResult.Valid; 

            }
            catch (e)
            {
                if (e instanceof Error)
                    LogError(e.message);
                // resume normal processing with Undetermined state
                result.ValidationResult = ValidationResult.Undetermined;
            }                  
            if (UpdateStateWithResult(result))
                ToIValidationManagerCallbacks(this.ValueHostsManager)?.OnValueHostValidated?.(this, result);
            return result;
        }
  
        finally {
            LogInfo(() => {
                return {
                    message: `Input Validation result: ${ValidationResultString[result.ValidationResult]} Issues found:` +
                        (result.IssuesFound ? JSON.stringify(result.IssuesFound) : 'none')
                }
            });
        }
        function UpdateStateWithResult(result: IValidateResult): boolean
        {
            return self.UpdateState((stateToUpdate) => {
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
        function ProcessPromise(promise: Promise<IInputValidateResult>): void
        {
            function CompleteThePromise(finish: () => void)
            {
                // remove the promise from result.Pending.
                // We use result.Pending == null to mean no async processes remain.
                // If Pending is null already, an external action has abandoned the current validation run
                if (result.Pending && result.Pending.includes(promise))
                {
                    let index = result.Pending.indexOf(promise);
                    result.Pending.splice(index, 1);
                    if (result.Pending.length === 0)
                        delete result.Pending;

                    finish();
                }
            }
            function DeleteAsyncProcessFlag()
            {
                if (!result.Pending)
                    self.UpdateState((stateToUpdate) => {
                        delete stateToUpdate.AsyncProcessing;
                        return stateToUpdate;
                    }, self);
            }
            if (!result.Pending)
                result.Pending = [];
            result.Pending.push(promise);
            promise.then(
            (ivr) => {
                    CompleteThePromise(() => {
                        // the only way we modify the issues, validation result, or State
                        if (ivr.ConditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
                            result.ValidationResult = ValidationResult.Invalid;
                            if (!result.IssuesFound)
                                result.IssuesFound = [];
                            result.IssuesFound.push(ivr.IssueFound!);
                            if (UpdateStateWithResult(result))
                                ToIValidationManagerCallbacks(self.ValueHostsManager)?.OnValueHostValidated?.(self, result);
                        }
                        else
                            DeleteAsyncProcessFlag();
                    });
            },
            (failureInfo) => {
                CompleteThePromise(() => { 
                    DeleteAsyncProcessFlag();
                    LogError(failureInfo ? failureInfo.toString() : 'unspecified');
                });
            }
        );
        // no change to the ValidationResult here            
        }

        function Bailout(errorMessage: string): IValidateResult
        {
            let resultState: IValidateResult = {
                ValidationResult: ValidationResult.Undetermined,
                IssuesFound: null
            };
            LogInfo(() => {
                return {
                    message: errorMessage,
                }
            });
            return resultState;                    
        }        
        function LogInfo(
            fn: () => { message: string, source?: string })
        {
            if (self.Services.LoggerService.MinLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.Services.LoggerService.Log(parms.message, LoggingLevel.Info,
                    ValidationCategory,
                    parms.source ?? `ValueHost ID ${self.Descriptor.Id}`);
            }
        }        
        function LogError(message: string): void
        {
            self.Services.LoggerService.Log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, ValidationCategory, self.Descriptor.Id);
        }
    }

    //#region validation
    /**
     * Provides the list of IInputValidator instances derived
     * from the ValidatorDescriptors. Lazy loads the instances.
     */
    protected Validators(): Array<IInputValidator> {
        if (this._validators === null)
            this._validators = this.GenerateValidators();
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
    protected GenerateValidators(): Array<IInputValidator> {
        let factory = this.Services.InputValidatorFactory;
        let validators: Array<IInputValidator> = [];
        this.Descriptor.ValidatorDescriptors?.forEach((valDesc) => {
            let pv = factory.Create(this, valDesc);
            validators.push(pv);
        });
        return this.OrderValidators(validators);
    }
    protected OrderValidators(unordered: Array<IInputValidator>): Array<IInputValidator>
    {
        let fn = (a: IInputValidator, b: IInputValidator) => a.Condition.Category - b.Condition.Category;
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else
            return unordered.sort(fn);
    }

    /**
     * Resolves from the generated InputValidators by checking the first for
     * Condition.Category = Required
     */
    public get RequiresInput(): boolean
    {
        // by design, Validators are sorted with Required first. So only check the first
        let validators = this.Validators();

        return validators != null && validators.length > 0 &&
            (validators[0].Condition.Category === ConditionCategory.Required);
    }
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        let validators = this.Validators();
        if (validators)
            for (let validator of validators)
                validator.GatherValueHostIds(collection, valueHostResolver);
    }
}
/**
 * Determines if the object implements IInputValueHost.
 * @param source 
 * @returns source typecasted to IInputValueHost if appropriate or null if not.
 */
export function ToIInputValueHost(source: any): IInputValueHost | null
{
    if (source instanceof InputValueHostBase)
        return source as IInputValueHost;
    if (source && typeof source === 'object')
    {
        let test = source as IInputValueHost;    
        // some select members of IInputValueHost
        if (test.GetInputValue !== undefined && 
            test.SetInputValue !== undefined &&
            test.Validate !== undefined &&
            test.GetIssuesForInput !== undefined)
            return test;
    }
    return null;
}

export const InputValueHostType = 'Input';
export class InputValueHostGenerator extends InputValueHostBaseGenerator {
    public CanCreate(descriptor: IInputValueHostDescriptor): boolean {
        if (descriptor.Type != null)    // null/undefined
            return descriptor.Type === InputValueHostType;

        if (descriptor.ValidatorDescriptors === undefined)
            return false;
        return true;
    }
    public Create(valueHostsManager: IValueHostsManager, descriptor: IInputValueHostDescriptor, state: IInputValueHostState): IInputValueHost {
        return new InputValueHost(valueHostsManager, descriptor, state);
    }
/**
 * Looking for changes to the ValidationDescriptors to impact IssuesFound.
 * If IssuesFound did change, fix ValidationResult for when Invalid to 
 * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
 * @param state 
 * @param descriptor 
 */    
    public CleanupState(state: IInputValueHostState, descriptor: IInputValueHostDescriptor): void {
        AssertNotNull(state, 'state');
        AssertNotNull(descriptor, 'descriptor');
        let descriptorChanged = false;
        let oldStateCount = 0;
        let issuesFound: Array<IIssueFound> | null = null;

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
        if (!descriptorChanged && (oldStateCount === ObjectKeysCount(state.IssuesFound)))
            return;

        state.IssuesFound = issuesFound as (Array<IIssueFound> | null);
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