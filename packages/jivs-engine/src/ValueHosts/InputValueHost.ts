/**
 * A ValueHost that supports input validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - validate() function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of InputValidators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module ValueHosts/ConcreteClasses/InputValueHost
 */
import { ValueHostId } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { objectKeysCount, groupsMatch } from '../Utilities/Utilities';
import { IValueHostResolver, IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { ConditionEvaluateResult, ConditionCategory } from '../Interfaces/Conditions';
import { InputValueHostDescriptor, InputValueHostState, IInputValueHost, IInputValueHostBase } from '../Interfaces/InputValueHost';
import { ValidateOptions, ValidateResult, ValidationResult, ValidationSeverity, ValidationResultString, IssueFound } from '../Interfaces/Validation';
import { InputValueHostBase, InputValueHostBaseGenerator } from './InputValueHostBase';
import { InputValidateResult, IInputValidator, InputValidatorDescriptor } from '../Interfaces/InputValidator';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';


/**
 * Standard implementation of IInputValueHost. It owns a list of InputValidators
 * which support its validate() function.
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
export class InputValueHost extends InputValueHostBase<InputValueHostDescriptor, InputValueHostState>
    implements IInputValueHost
{
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
            validationResult: ValidationResult.Undetermined,
            issuesFound: null
        };

        if (!groupsMatch(options.group,
            (this.getFromState('_group') ?? this.descriptor.group) as string | null))
            return bailout(`Group names do not match "${options.group}" vs "${this.descriptor.group?.toString()}"`);      
        
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
                    if (inputValResult.skipped)
                        continue;
                    validatorsInUse++;
                    if (inputValResult.issueFound) {
                        switch (inputValResult.issueFound.severity) {
                            case ValidationSeverity.Error:
                            case ValidationSeverity.Severe:
                                result.validationResult = ValidationResult.Invalid;
                                break;
                            case ValidationSeverity.Warning:
                                if (result.validationResult === ValidationResult.Undetermined)
                                    result.validationResult = ValidationResult.Valid;
                                break;
                        }

                        if (!result.issuesFound)
                            result.issuesFound = [];
                        let issueFound = inputValResult.issueFound;
                        result.issuesFound.push(issueFound);
                        if (issueFound.severity === ValidationSeverity.Severe)
                            stop = true;
                    }
                    else if (result.validationResult === ValidationResult.Undetermined)
                        if (inputValResult.conditionEvaluateResult === ConditionEvaluateResult.Match)
                            result.validationResult = ValidationResult.Valid;    // may be overwritten by a later validator

                }
                if (validatorsInUse === 0)
                    result.validationResult = ValidationResult.Valid; 

            }
            catch (e)
            {
                if (e instanceof Error)
                    logError(e.message);
                // resume normal processing with Undetermined state
                result.validationResult = ValidationResult.Undetermined;
            }                  
            if (updateStateWithResult(result))
                toIValidationManagerCallbacks(this.valueHostsManager)?.onValueHostValidated?.(this, result);
            return result;
        }
  
        finally {
            logInfo(() => {
                return {
                    message: `Input Validation result: ${ValidationResultString[result.validationResult]} Issues found:` +
                        (result.issuesFound ? JSON.stringify(result.issuesFound) : 'none')
                };
            });
        }
        function updateStateWithResult(result: ValidateResult): boolean
        {
            return self.updateState((stateToUpdate) => {
                stateToUpdate.validationResult = result.validationResult;
                stateToUpdate.issuesFound = result.issuesFound;
                if (options!.group)
                    stateToUpdate.group = options!.group;
                if (result.pending)
                    stateToUpdate.asyncProcessing = true;
                else
                    delete stateToUpdate.asyncProcessing;
                return stateToUpdate;
            }, self);
        }
        function processPromise(promise: Promise<InputValidateResult>): void
        {
            function completeThePromise(finish: () => void): void
            {
                // remove the promise from result.Pending.
                // We use result.Pending == null to mean no async processes remain.
                // If Pending is null already, an external action has abandoned the current validation run
                if (result.pending && result.pending.includes(promise))
                {
                    let index = result.pending.indexOf(promise);
                    /* eslint-disable-next-line @typescript-eslint/no-floating-promises */
                    result.pending.splice(index, 1);
                    if (result.pending.length === 0)
                        delete result.pending;

                    finish();
                }
            }
            function deleteAsyncProcessFlag() : void
            {
                if (!result.pending)
                    self.updateState((stateToUpdate) => {
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
                        // the only way we modify the issues, validation result, or State
                        if (ivr.conditionEvaluateResult === ConditionEvaluateResult.NoMatch) {
                            result.validationResult = ValidationResult.Invalid;
                            if (!result.issuesFound)
                                result.issuesFound = [];
                            result.issuesFound.push(ivr.issueFound!);
                            if (updateStateWithResult(result))
                                toIValidationManagerCallbacks(self.valueHostsManager)?.onValueHostValidated?.(self, result);
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
                validationResult: ValidationResult.Undetermined,
                issuesFound: null
            };
            logInfo(() => {
                return {
                    message: errorMessage
                };
            });
            return resultState;                    
        }        
        function logInfo(
            fn: () => { message: string; source?: string }): void
        {
            if (self.services.loggerService.minLevel >= LoggingLevel.Info)
            {
                let parms = fn();
                self.services.loggerService.log(parms.message, LoggingLevel.Info,
                    LoggingCategory.Validation,
                    parms.source ?? `ValueHost ID ${self.descriptor.id}`);
            }
        }        
        function logError(message: string): void
        {
            self.services.loggerService.log('Exception: ' + (message ?? 'Reason unspecified'),
                LoggingLevel.Error, LoggingCategory.Validation, self.descriptor.id);
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
        let factory = this.services.inputValidatorFactory;
        let validators: Array<IInputValidator> = [];
        let needsDataTypeCheck = true;
        this.descriptor.validatorDescriptors?.forEach((valDesc) => {
            let pv = factory.create(this, valDesc);
            validators.push(pv);
            if (needsDataTypeCheck && pv.condition.category === ConditionCategory.DataTypeCheck)
                needsDataTypeCheck = false;
        });
        if (needsDataTypeCheck)
            this.tryAutoGenerateDataTypeCheckCondition(validators);
        return this.orderValidators(validators);
    }
    protected orderValidators(unordered: Array<IInputValidator>): Array<IInputValidator>
    {
        let fn = (a: IInputValidator, b: IInputValidator) : number => a.condition.category - b.condition.category;
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else
            return unordered.sort(fn);
    }
    protected tryAutoGenerateDataTypeCheckCondition(validators: Array<IInputValidator>): boolean
    {
        let created = false;
        if (this.services.autoGenerateDataTypeCheckService.enabled) {
            let lookupKey = this.getDataType();
            if (lookupKey) {
                let dtcCondition = this.services.autoGenerateDataTypeCheckService.autoGenerateDataTypeCondition(this, lookupKey);
                if (dtcCondition != null) {
                    let descriptor: InputValidatorDescriptor = {
                        /* eslint-disable-next-line @typescript-eslint/naming-convention */
                        conditionCreator: (requester) => dtcCondition,
                        conditionDescriptor: null,
                        errorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        severity: ValidationSeverity.Severe
                    };
                    validators.push(this.services.inputValidatorFactory.create(this, descriptor));
                    this.services.loggerService.log(`Added ${dtcCondition.conditionType} Condition for Data Type Check`,
                        LoggingLevel.Info, LoggingCategory.Configuration, `InputValidator on ${this.getId()}`);
                    created = true;
                }
            }
        }
        return created;
    }
    /**
     * Resolves from the generated InputValidators by checking the first for
     * Condition.category = Required
     */
    public get requiresInput(): boolean
    {
        // by design, Validators are sorted with Required first. So only check the first
        let validators = this.validators();

        return validators != null && validators.length > 0 &&
            (validators[0].condition.category === ConditionCategory.Required);
    }
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void
    {
        let validators = this.validators();
        for (let validator of validators)
            validator.gatherValueHostIds(collection, valueHostResolver);
    }

    /**
     * Gets an InputValidator already assigned to this InputValueHost.
     * @param conditionType - The ConditionType value assigned to the InputValidator
     * that you want.
     * @returns The InputValidator or null if the condition type does not match.
     */
    public getValidator(conditionType: string): IInputValidator | null { 
        for (let iv of this.validators())
            if (iv.conditionType === conditionType)
                return iv;
        return null;
    }

    /**
     * Intended for the UI developer to add their own UI specific validators
     * to those already configured within ValidationManager.
     * 
     * It adds or replaces when the ConditionType matches an existing 
     * InputValidatorDescriptor.
     * 
     * Try to avoid using it for validators coming from business logic.
     * This fits well with Data Type Check cases that were
     * not setup by Auto Generate Data Type Checks (see AutoGenerateDataTypeCheckService).
     * 
     * The RequiredTextCondition and StringLengthCondition are good too,
     * but their rules typically are known by business logic and its just
     * a matter of converting "required" and "string length" business rules
     * to these conditions during setup in ValidationManager.
     * @param descriptor 
     */
    public addValidator(descriptor: InputValidatorDescriptor): void
    {
        this._validators = null;    // force recreation
        if (!this.descriptor.validatorDescriptors)
            this.descriptor.validatorDescriptors = [];
        let knownConditionType: string | null =
            descriptor.conditionDescriptor ? descriptor.conditionDescriptor.type : null;
        if (knownConditionType)
        {
            let index = this.descriptor.validatorDescriptors.findIndex((ivd) =>
                (ivd.conditionDescriptor ? ivd.conditionDescriptor.type : '') ===
                knownConditionType
            );    
            if (index > -1) {
                this.descriptor.validatorDescriptors[index] = descriptor;
                return;
            }
        }
        this.descriptor.validatorDescriptors.push(descriptor);
    }
    /**
     * While you normally set the validation group name with InputValueHostDescriptor.group,
     * InputValueHostDescriptor is often setup from the perspective of the business logic,
     * which does not make the ultimate decision on field grouping.
     * Call this from the UI layer when establishing the input to replace the supplied
     * group name.
     * @param group - When undefined, it restores group to InputValueHostDescriptor.group
     */
    public setGroup(group: string): void
    {
        this.saveIntoState('_group', group);
    }
}

/**
 * Determines if the object implements IInputValueHost.
 * @param source 
 * @returns source typecasted to IInputValueHost if appropriate or null if not.
 */
export function toIInputValueHost(source: any): IInputValueHost | null
{
    if (source instanceof InputValueHost)
        return source as IInputValueHost;
    if (source && typeof source === 'object')
    {
        let test = source as IInputValueHost;    
        // some select members of IInputValueHost
        if (test.addValidator !== undefined &&
            test.getInputValue !== undefined && 
            test.setInputValue !== undefined &&
            test.validate !== undefined &&
            test.getIssuesForInput !== undefined)
            return test;
    }
    return null;
}

export class InputValueHostGenerator extends InputValueHostBaseGenerator {
    public canCreate(descriptor: InputValueHostDescriptor): boolean {
        if (descriptor.type != null)    // null/undefined
            return descriptor.type === ValueHostType.Input;

        if (descriptor.validatorDescriptors === undefined)
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

        if (state.issuesFound) {
            let oldState = state.issuesFound;

            descriptor.validatorDescriptors?.forEach((valDescriptor) => {
                let condType = 'UNKNOWN';
                if (valDescriptor.conditionDescriptor)
                    condType = valDescriptor.conditionDescriptor.type;
                else if (valDescriptor.conditionCreator)
                {
                    let cond = valDescriptor.conditionCreator(valDescriptor);   // return null is actually a configuration bug reported to the user in InputValidator.Condition
                    if (cond)
                        condType = cond.conditionType;
                }
                let found = oldState.find((value) => value.conditionType === condType);
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
        if (!descriptorChanged && (oldStateCount === objectKeysCount(state.issuesFound)))
            return;

        state.issuesFound = issuesFound as (Array<IssueFound> | null);
        // fix validation result for when validation had occurred
        if (state.validationResult === ValidationResult.Invalid) {
            let vr = ValidationResult.ValueChangedButUnvalidated;
            let warningFound = false;
            if (issuesFound) {
                for (let issueFound of state.issuesFound!) {
                    if (issueFound.severity !== ValidationSeverity.Warning) {
                        vr = ValidationResult.Invalid;
                        break;
                    }
                    else
                        warningFound = true;
                }
                if (warningFound && vr === ValidationResult.ValueChangedButUnvalidated)
                    vr = ValidationResult.Valid;
            }
            state.validationResult = vr;
        }
    }

}