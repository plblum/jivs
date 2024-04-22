/**
 * A ValueHost that supports input validation.
 * It is associated with the input field/element itself.
 * It provides:
 * - validate() function which returns Validation Results in the form of a list of IssuesFound.
 * - A list of Validators, each for a single validation rule and containing their own error messages
 * - An additional value that can be validated, the value directly from the Input, which is often
 *   quite different from the value intended to be stored in the Model/Entity.
 * @module ValueHosts/ConcreteClasses/InputValueHost
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { objectKeysCount, groupsMatch, cleanString } from '../Utilities/Utilities';
import { IValueHostResolver, IValueHostsManager } from '../Interfaces/ValueHostResolver';
import { ConditionEvaluateResult, ConditionCategory } from '../Interfaces/Conditions';
import { ValidateOptions, ValueHostValidateResult, ValidationResult, ValidationSeverity, ValidationResultString, IssueFound } from '../Interfaces/Validation';
import { ValidatorValidateResult, IValidator, ValidatorConfig } from '../Interfaces/Validator';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { ValueHostType } from '../Interfaces/ValueHostFactory';
import { toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';
import { InputValueHostConfig, InputValueHostState, IInputValueHost } from '../Interfaces/InputValueHost';
import { ValidatableValueHostBase, ValidatableValueHostBaseGenerator } from './ValidatableValueHostBase';
import { FluentValidatorCollector } from './Fluent';
import { enableFluent } from '../Conditions/FluentValidatorCollectorExtensions';
import { ConditionType } from '../Conditions/ConditionTypes';


/**
 * Standard implementation of IInputValueHost. It owns a list of Validators
 * which support its validate() function.
 * Use ValueHostConfig.type = "Input" for the ValidationManager to use this class.
 * 
* Each instance depends on a few things, all passed into the constructor:
* - valueHostsManager - Typically this is the ValidationManager.
* - InputValueHostConfig - The business logic supplies these rules
*   to implement a ValueHost's name, label, data type, validation rules,
*   and other business logic metadata.
* - InputValueHostState - State used by this InputValueHost including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export class InputValueHost extends ValidatableValueHostBase<InputValueHostConfig, InputValueHostState>
    implements IInputValueHost
{
    constructor(valueHostsManager: IValueHostsManager, config: InputValueHostConfig, state: InputValueHostState) {
        super(valueHostsManager, config, state);
    }

    /**
     * Runs validation against some of all validators.
     * If at least one validator was NoMatch, it returns ValueHostValidateResult
     * with all of the NoMatches in issuesFound.
     * If all were Matched, it returns ValueHostValidateResult.Value and issuesFound=null.
     * If there are no validators, or all validators were skipped (disabled),
     * it returns ValidationResult.Undetermined.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     */
    public validate(options?: ValidateOptions): ValueHostValidateResult {
        let self = this;
        if (!options)
            options = {};
        // NOTE: This object instance is important for async validation.
        // Its properties collect all validator results, including those delayed by async.
        // By being an object, any closure referring to result will still get those
        // property changes for all validators completed.
        let result: ValueHostValidateResult = {
            validationResult: ValidationResult.Undetermined,
            issuesFound: null
        };

        if (!groupsMatch(options.group,
            (this.getFromState('_group') ?? this.config.group) as string | null))
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
                    if (potentialIVR instanceof Promise)
                    {
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
                // unnecessary as this should always be the case at this point
                // if (validatorsInUse === 0)
                //     result.validationResult = ValidationResult.Undetermined; 

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
        function updateStateWithResult(result: ValueHostValidateResult): boolean
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
        function processPromise(promise: Promise<ValidatorValidateResult>): void
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

        function bailout(errorMessage: string): ValueHostValidateResult
        {
            let resultState: ValueHostValidateResult = {
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
                    parms.source ?? `ValueHost name ${self.config.name}`);
            }
        }        
        function logError(message: string): void
        {
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
            this._validators = this.generateValidators();
        return this._validators;
    }
    // populated by Validators() when null. Set to null by UpdateValueHostConfig
    // to account for changes made there.
    private _validators: Array<IValidator> | null = null;

    /**
     * Generates an array of all Validators from ValueHostConfig.validatorConfigs.
     * Sorts the by Category so Required is always first, DataTypeCheck is just after Required.
     * @returns 
     */
    protected generateValidators(): Array<IValidator> {
        let factory = this.services.validatorFactory;
        let validators: Array<IValidator> = [];
        let needsDataTypeCheck = true;
        this.config.validatorConfigs?.forEach((valDesc) => {
            let pv = factory.create(this, valDesc);
            validators.push(pv);
            if (needsDataTypeCheck && pv.condition.category === ConditionCategory.DataTypeCheck)
                needsDataTypeCheck = false;
        });
        if (needsDataTypeCheck)
            this.tryAutoGenerateDataTypeCheckCondition(validators);
        return this.orderValidators(validators);
    }
    protected orderValidators(unordered: Array<IValidator>): Array<IValidator>
    {
        let fn = (a: IValidator, b: IValidator) : number => a.condition.category - b.condition.category;
        if (unordered.toSorted)    // recently introduced API, so provide fallback
            return unordered.toSorted(fn);
        else
            return unordered.sort(fn);
    }
    protected tryAutoGenerateDataTypeCheckCondition(validators: Array<IValidator>): boolean
    {
        let created = false;
        if (this.services.autoGenerateDataTypeCheckService.enabled) {
            let lookupKey = this.getDataType();
            if (lookupKey) {
                let dtcCondition = this.services.autoGenerateDataTypeCheckService.autoGenerateDataTypeCondition(this, lookupKey);
                if (dtcCondition != null) {
                    let config: ValidatorConfig = {
                        /* eslint-disable-next-line @typescript-eslint/naming-convention */
                        conditionCreator: (requester) => dtcCondition,
                        conditionConfig: null,
                        errorMessage: null, // expecting TextLocalizationService to contribute based on ConditionType + DataTypeLookupKey
                        severity: ValidationSeverity.Severe
                    };
                    validators.push(this.services.validatorFactory.create(this, config));
                    this.services.loggerService.log(`Added ${dtcCondition.conditionType} Condition for Data Type Check`,
                        LoggingLevel.Info, LoggingCategory.Configuration, `Validator on ${this.getName()}`);
                    created = true;
                }
            }
        }
        return created;
    }
    /**
     * Resolves from the generated Validators by checking the first for
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
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void
    {
        let validators = this.validators();
        for (let validator of validators)
            validator.gatherValueHostNames(collection, valueHostResolver);
    }

    /**
     * Gets an Validator already assigned to this InputValueHost.
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
    public addValidator(config: ValidatorConfig): void
    {
        this._validators = null;    // force recreation
        if (!this.config.validatorConfigs)
            this.config.validatorConfigs = [];
        let knownConditionType: string | null =
            config.conditionConfig ? config.conditionConfig.type : null;
        if (knownConditionType)
        {
            let index = this.config.validatorConfigs.findIndex((ivd) =>
                (ivd.conditionConfig ? ivd.conditionConfig.type : '') ===
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
    public configValidators(): FluentValidatorCollector
    {
        enableFluent();
        this._validators = null;    // force recreation   
        if (!this.config.validatorConfigs)
            this.config.validatorConfigs = [];        
        return new FluentValidatorCollector(this.config);
    }
    
    /**
     * While you normally set the validation group name with InputValueHostConfig.group,
     * InputValueHostConfig is often setup from the perspective of the business logic,
     * which does not make the ultimate decision on field grouping.
     * Call this from the UI layer when establishing the input to replace the supplied
     * group name.
     * @param group - When undefined, it restores group to InputValueHostConfig.group
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
            test.getIssuesFound !== undefined)
            return test;
    }
    return null;
}

export class InputValueHostGenerator extends ValidatableValueHostBaseGenerator {
    public canCreate(config: InputValueHostConfig): boolean {
        if (config.type != null)    // null/undefined
            return config.type === ValueHostType.Input;

        if (config.validatorConfigs === undefined)
            return false;
        return true;
    }
    public create(valueHostsManager: IValueHostsManager, config: InputValueHostConfig, state: InputValueHostState): IInputValueHost {
        return new InputValueHost(valueHostsManager, config, state);
    }
/**
 * Looking for changes to the ValidationConfigs to impact IssuesFound.
 * If IssuesFound did change, fix ValidationResult for when Invalid to 
 * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
 * @param state 
 * @param config 
 */    
    public cleanupState(state: InputValueHostState, config: InputValueHostConfig): void {
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
                    errorCode = valConfig.conditionConfig.type;
                else if (valConfig.conditionCreator)
                {
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
