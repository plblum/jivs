/**
 * Expands upon ValueHost to provide the basics of validation.
 * @module ValueHosts/AbstractClasses/ValidatableValueHostBase
 */
import { ValueHostName } from '../DataTypes/BasicTypes';
import { cleanString, deepEquals, groupsMatch, valueForLog } from '../Utilities/Utilities';
import { ValueHostConfig, type SetValueOptions } from '../Interfaces/ValueHost';
import { ValueHostBase } from './ValueHostBase';
import type { IValueHostGenerator } from '../Interfaces/ValueHostFactory';
import { IValueHostResolver } from '../Interfaces/ValueHostResolver';
import { IValidatableValueHostBase, ValidatableValueHostBaseConfig, ValidatableValueHostBaseInstanceState, ValueHostValidationState } from '../Interfaces/ValidatableValueHostBase';
import { BusinessLogicError, IssueFound, ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, SetIssuesFoundErrorCodeMissingBehavior } from '../Interfaces/Validation';
import { IValidationManager, toIValidationManager, toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';
import { IValueHostsManager, toIValueHostsManager } from '../Interfaces/ValueHostsManager';
import { LoggingCategory, LoggingLevel } from '../Interfaces/LoggerService';
import { IValidationServices } from '../Interfaces/ValidationServices';
import { CodingError, assertNotNull } from '../Utilities/ErrorHandling';


/**
* Expands upon ValueHost to provide the basics of validation.
 */
export abstract class ValidatableValueHostBase<TConfig extends ValidatableValueHostBaseConfig, TState extends ValidatableValueHostBaseInstanceState>
    extends ValueHostBase<TConfig, TState>
    implements IValidatableValueHostBase {
/**
 * @param validationManager - Contains all ValueHosts and supports validation.
 *   It is the owner of all state and provides group validation.
 * @param config - The business logic supplies these rules
 *   to implement a ValueHost's name, label, data type, validation rules,
 *   and other business logic metadata. Treat as immutable.
 * @param state - InstanceState used by this ValidatableValueHost including its validators.
 * If the caller changes any of these, discard the instance. Treat as immutable.
 */    
    constructor(validationManager: IValidationManager, config: TConfig, state: TState) {
        super(validationManager, config, state);
        if (!toIValidationManager(validationManager))
            throw new CodingError('ValueHost requires ValidationManager');        
    }

    public get valueHostsManager(): IValidationManager {
        return super.valueHostsManager as IValidationManager;
    }


    //#endregion IValueHostsManagerAccessor
    
    protected get services(): IValidationServices
    {
        return super.services as IValidationServices;
    }
    /**
     * Participates in releasing memory.
     * While not required, the idea is to be a more friendly participant in the ecosystem.
     * Note that once called, expect null reference errors to be thrown if any other functions
     * try to use them.
     */
    public dispose(): void
    {
        super.dispose();
        this._associatedValueHostNames = undefined!;
    }
    //#region IValidatableValueHostBase
    /**
      * System consumer assigns the native value to make it available
      * to most Conditions during validation.
      * @param value 
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Category=Require validator within the {ConversionError} token.
    */
    public setValue(value: any, options?: SetValueOptions): void {
        this.logger.message(LoggingLevel.Debug, () => `setValue(${valueForLog(value)})`);
        if (!options)
            options = {};
        if (!this.canChangeValueCheck(options))
            return;
        if (options.duringEdit)
        {
            options.duringEdit = false;

            this.logger.message(LoggingLevel.Warn, () => 'setValue does not support duringEdit option');
        }
        let oldValue: any = this.instanceState.value;
        let changed = !deepEquals(value, oldValue);
        let valStateChanged = false;
        this.updateInstanceState((stateToUpdate) => {
            if (changed) {
                valStateChanged = (stateToUpdate.status !== ValidationStatus.NeedsValidation) || (stateToUpdate.corrected === true);
                stateToUpdate.status = ValidationStatus.NeedsValidation;
                delete stateToUpdate.corrected;
                stateToUpdate.value = value;
            }
            this.additionalInstanceStateUpdatesOnSetValue(stateToUpdate, changed, options!);

            return stateToUpdate;
        }, this);
        this.processValidationOptions(options, valStateChanged); //NOTE: If validates or clears, results in a second updateInstanceState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(changed, oldValue, options);
    }

    protected processValidationOptions(options: SetValueOptions, valStateChanged: boolean): void {
        if (options.validate) {
            if (this.instanceState.status === ValidationStatus.NeedsValidation)
                this.validate({ duringEdit: options.duringEdit }); // Result isn't ignored. Its automatically updates state and notifies parent
        }
        else if (options.reset)
            this.clearValidation();
        else if (valStateChanged)
            this.invokeOnValueHostValidationStateChanged(options);
    }

    protected notifyOthersOfChange(options: SetValueOptions): void {
        toIValueHostsManager(this.valueHostsManager)?.notifyOtherValueHostsOfValueChange?.(
            this.getName(), options.validate === true);
    }
    /**
     * When any value changes,
     * all other ValidatableValueHosts get notified here so they can rerun validation
     * when any of their Conditions specify the valueHostName that changed.
     * @param valueHostIdThatChanged 
     * @param revalidate 
     */
    public otherValueHostChangedNotification(valueHostIdThatChanged: ValueHostName, revalidate: boolean): void {
        if (valueHostIdThatChanged === this.getName())
            return; // mostly to call out this case isn't desirable.
        if (this.validationStatus === ValidationStatus.NotAttempted)
            return; // validation didn't previously run, so no change now
        if (!revalidate && (this.validationStatus === ValidationStatus.NeedsValidation))
            return; // validation didn't previously run and the rest only sets the same ValidationStatus

        // Looks like validation previously ran...
        // check if we use a Condition that specifies valueHostIdThatChanged.
        if (!this._associatedValueHostNames) { // this is a cache that is only cleared by recreating the ValueHost
            // it assumes that the Config is immutable, so there cannot be any changes to ValueHosts
            // without creating a new instance of this ValueHost
            this._associatedValueHostNames = new Set<ValueHostName>();
            this.gatherValueHostNames(this._associatedValueHostNames, this.valueHostsManager);
        }

        if (this._associatedValueHostNames.has(valueHostIdThatChanged)) {
            // change the ValidationStatus to NeedsValidation when revalidate is false
            // call validate() when revalidate is true
            if (revalidate)
                this.validate();
            else {
                this.updateInstanceState((stateToUpdate) => {
                    this.clearValidationDataFromInstanceState(stateToUpdate);
                    stateToUpdate.status = ValidationStatus.NeedsValidation;
                    return stateToUpdate;
                }, this);
            }
        }
    }
    private _associatedValueHostNames: Set<ValueHostName> | null = null;
    /**
     * A service to provide all ValueHostNames that have been assigned to this Condition's
     * Config.
     */
    public abstract gatherValueHostNames(collection: Set<ValueHostName>, valueHostResolver: IValueHostResolver): void;


    /**
     * When the ValueHost is disabled, it clears any validation issues.
     * A call to validate() will return null until the ValueHost is enabled again.
     * If the Enabler condition changes the state to enabled, it remains up to the user
     * to call validate() again to get the new state.
     * While disabled, some validation activity can still happen:
     * - BusinessLogicErrors can be set, but will not be available with
     *   getIssuesFound() until the ValueHost is enabled again.
     * - The onValueHostValidationStateChanged event will be raised
     *   on actions that change the state, such as setting a BusinessLogicError.
     * Otherwise all calls to get ValidationStatus will act as if the ValueHost 
     * has no errors, except for ValidationState which is set to Disabled.
     * @param enabled 
     */
    public setEnabled(enabled: boolean): void {
        super.setEnabled(enabled);
        if (!enabled)
            this.clearValidation();
    }
        
    //#endregion IValidatableValueHostBase

    //#region validation

    /**
     * Determines if this ValueHost handles validation for a specific error code.
     * @param errorCode 
     */
    protected abstract handlesErrorCode(errorCode: string): boolean;
    /**
    * Runs validation against some of all validators.
    * If at least one validator was NoMatch, it returns IValidatorInstanceStateDictionary
    * with all of the NoMatches.
    * If all were Matched or Undetermined, it returns null indicating
    * validation isn't blocking saving the data.
    * Updates this ValueHost's InstanceState and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns Non-null when there is something to report. null if there was nothing to evaluate
     * which includes all existing validators reporting "Undetermined"
    */
    public abstract validate(options?: ValidateOptions): ValueHostValidateResult | null;

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false when instanceState.status is Invalid. Any other ValidationStatus
     * return true.
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using doNotSave for more clarity.
     */
    public get isValid(): boolean {
        return this.validationStatus !== ValidationStatus.Invalid;
    }
    /**
     * Result from the latest validation, or an indication
     * that validation has yet to occur.
     * 
     * It is changed internally and can influence how
     * validation behaves the next time.
     * 
     * Prior to calling validate() (or setValue()'s validate option),
     * it is NotAttempted.
     * After setValue it is NeedsValidation.
     * After validate, it may be Valid, Invalid or Undetermined.
     * If ValueHost is disabled, it returns Disabled.
     */
    public get validationStatus(): ValidationStatus {
        if (!this.isEnabled())
            return ValidationStatus.Disabled;

        // any business logic errors that aren't warnings override ValidationStatus with Invalid.
        if (this.businessLogicErrors)
            for (let error of this.businessLogicErrors)
                if (error.severity !== ValidationSeverity.Warning)
                    return ValidationStatus.Invalid;
        return this.instanceState.status;
    }

    /**
     * When true, an async Validator is running
     */
    public get asyncProcessing(): boolean
    {
        return this.instanceState.asyncProcessing ?? false;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     * It calls onValueHostValidationStateChanged if there was a changed to the state.
     * 
     * When valueHost is disabled, this still clears the validation state.
     * @param options - Only supports the skipCallback and Group options.
     * @returns true when there was something cleared
     */
    public clearValidation(options?: ValidateOptions): boolean {
        let changed = false;
        if (options)
            if (!this.groupsMatch(options.group, true))
                return false;
        changed = this.updateInstanceState((stateToUpdate) => {
            this.clearValidationDataFromInstanceState(stateToUpdate);
            return stateToUpdate;
        }, this);
        if (changed)
            if (!options || !options?.skipCallback)
                this.invokeOnValueHostValidationStateChanged(options);
        return changed;
    }

    /**
     * Determines if the group supplied is a match for the group setup on this ValueHost.
     * @param requestedGroup 
     * @param fromLastValidation Source of this instance's group is either the original configuration
     * or the value of the last validation. WHen true, from the last validation.
     * @returns 
     */
    protected groupsMatch(requestedGroup: string | null | undefined, fromLastValidation: boolean): boolean
    {
        let expectedGroup: string[] | string | null | undefined = undefined;
        if (fromLastValidation)
            expectedGroup = this.instanceState.group;
        if (expectedGroup === undefined)
            expectedGroup = this.config.group;    // may still be undefined

        return groupsMatch(requestedGroup, expectedGroup);
    }

    protected clearValidationDataFromInstanceState(stateToUpdate: TState): void {
        stateToUpdate.status = ValidationStatus.NotAttempted;
        stateToUpdate.issuesFound = null;
        delete stateToUpdate.asyncProcessing;   // any active promises here will finish except will not update state due to Pending = null or at least lacking the same promise instance in this array
        delete stateToUpdate.businessLogicErrors;
        delete stateToUpdate.corrected;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * True when ValidationStatus is Invalid or NeedsValidation.
     */
    public get doNotSave(): boolean {
        switch (this.validationStatus) {
            case ValidationStatus.Invalid:
            case ValidationStatus.NeedsValidation:
                return true;
            default:
                if (this.instanceState.asyncProcessing) // async running so long as not null
                    return true;
                return false;
        }
    }
    /**
     * Determines if an invalid entry has been corrected.
     * Is true when the user has fixed all invalid validators.
     * False otherwise, including if the status changes after this point.
     */
    public get corrected(): boolean{
        return this.instanceState.corrected ?? false;
    }
    //#endregion validation
    //#region business logic errors
    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostName,
     * by specifying that valueHostName in AssociatedValueHostName.
     * Each time called, it adds to the existing list. Use clearBusinessLogicErrors() first if starting a fresh list.
     * It calls onValueHostValidationStateChanged if there was a changed to the state.
     * @param error - A business logic error to show. If it has an errorCode assigned and the same
     * errorCode is already recorded here, the new entry replaces the old one.
     * @returns true when a change was made to the known validation state.
     */
    public setBusinessLogicError(error: BusinessLogicError, options?: ValidateOptions): boolean {
        if (error) {
            if (!this.isEnabled())
            {
                this.logger.message(LoggingLevel.Warn, () => `BusinessLogicError applied on disabled ValueHost "${this.getName()}"`);
            }
    
            // check for existing with the same errorcode and replace
            let replacementIndex = -1;
            if (error.errorCode && this.instanceState.businessLogicErrors) 
                for (let i = 0; i < this.instanceState.businessLogicErrors.length; i++)
                {
                    if (this.instanceState.businessLogicErrors[i].errorCode === error.errorCode)
                    {
                        replacementIndex = i;
                        break;
                    }
                }
            let changed = this.updateInstanceState((stateToUpdate) => {
                if (!stateToUpdate.businessLogicErrors)
                    stateToUpdate.businessLogicErrors = [];
                if (replacementIndex === -1)
                    stateToUpdate.businessLogicErrors.push(error);
                else
                    stateToUpdate.businessLogicErrors[replacementIndex] = error;
                delete stateToUpdate.corrected;
                return stateToUpdate;
            }, this);
            if (changed) {
                this.invokeOnValueHostValidationStateChanged(options);
                return true;
            }
        }
        return false;
    }
    /**
     * Removes any business logic errors. Generally called automatically by
     * ValidationManager as calls are made to SetBusinessLogicErrors and clearValidation().
     * It calls onValueHostValidationStateChanged if there was a changed to the state.
     * @param options - Only considers the skipCallback option.
     * @returns true when a change was made to the known validation state.
     */
    public clearBusinessLogicErrors(options?: ValidateOptions): boolean {
        if (this.businessLogicErrors) {
            let changed = this.updateInstanceState((stateToUpdate) => {
                delete stateToUpdate.businessLogicErrors;
                delete stateToUpdate.corrected;
                return stateToUpdate;
            }, this);
            if (changed) {
                this.invokeOnValueHostValidationStateChanged(options);
                return true;
            }
        }
        return false;
    }

    /**
     * Helper to call onValueHostValidationStateChanged due to a change in the state associated
     * with Validate itself or BusinessLogicErrors.
     * It also asks ValidationManager to call onValidationStateChanged so observers that only 
     * watch for validation from a high level will be notified.
     * 
     * This may still be called when the ValueHost is disabled, so long
     * as an underlying state has changed. The call to setEnabled(false)
     * itself calls clearValidation() which usually triggers this event
     * allow the UI to know to handle the discarded valuehost's validation data.
     */
    protected invokeOnValueHostValidationStateChanged(options: ValidateOptions | undefined): void
    {
        if (options && options.skipCallback)
            return;

        // the order is intentional, but not ideal.
        // To unit test the debounce feature of notifyValidationStateChanged, we need
        // the call to notify to be queued inside of debounce by the time onValueHostValidationStateChanged is invoked,
        // so we can leverage the onValueHostValidationStateChanged to advance the mock timer. (Ugh)
        toIValidationManager(this.valueHostsManager)?.notifyValidationStateChanged(null, options);
        toIValidationManagerCallbacks(this.valueHostsManager)?.onValueHostValidationStateChanged?.(this, this.currentValidationState);
    }

    /**
     * Exposes the current validation state for the ValueHost.
     * It combines other properties and issuesFound.
     * The same value is delivered to the onValueHostValidationStateChanged callback.
     */
    public get currentValidationState(): ValueHostValidationState {
        return {
            issuesFound: this.getIssuesFound(),
            isValid: this.isValid,
            doNotSave: this.doNotSave,
            asyncProcessing: this.asyncProcessing,
            status: this.validationStatus,
            corrected: this.corrected
        }
    }
    
    /**
     * exposes the Business Logic Errors list. If none, it is null.
     */
    protected get businessLogicErrors(): Array<BusinessLogicError> | null {
        return this.instanceState.businessLogicErrors ?? null;
    }

    //#endregion business logic errors

    //#region access to validation results    
    /**
     * The results of validation specific to one condiiton Type.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The issue or null if none.
     */    
    public getIssueFound(errorCode: string): IssueFound | null {
        if (!this.isEnabled())
        {
            this.logger.message(LoggingLevel.Warn, () => `Issues not available on disabled ValueHost "${this.getName()}"`);
            return null;
        }
    
        let ec = cleanString(errorCode);
        if (!ec)
            return null;

        return this.instanceState.issuesFound ?
            (this.instanceState.issuesFound.find((value) =>
                value.errorCode === ec) ?? null) :
            null;
    }

    /**
     * Lists all issues found (error messages and supporting info) for a single Validatable ValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @returns An array of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - name - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    public getIssuesFound(group?: string): Array<IssueFound> | null {
        if (!this.isEnabled())
        {
            this.logger.message(LoggingLevel.Warn, () => `Issues not available on disabled ValueHost "${this.getName()}"`);            
            return null;
        }        
        let list: Array<IssueFound> = [];

        if (this.instanceState.issuesFound && this.groupsMatch(group, true)) {
            for (let issue of this.instanceState.issuesFound) {
                list.push(issue);
            }
        }
        this.addBusinessLogicErrorsToSnapshotList(list);

        return list.length ? list : null;
    }

    private addBusinessLogicErrorsToSnapshotList(list: Array<IssueFound>): void {
        if (this.businessLogicErrors) {
            let issueCount = 0;
            for (let error of this.businessLogicErrors) {
                list.push({
                    valueHostName: this.getName(),
                    errorCode: cleanString(error.errorCode)  ?? `GENERATED_${issueCount}`,
                    severity: error.severity ?? ValidationSeverity.Error,
                    errorMessage: error.errorMessage,
                    summaryMessage: error.errorMessage
                });
                issueCount++;
            }
        }
    }

    /**
     * Adds or replaces all IssueFound items that are associated with this ValueHost.
     * It ignores those with another ValueHost name, allowing for the same list to be culled
     * by all ValueHosts. (As a result, it never changes the values sent in, or the array itself.) 
     * Replacement when the errorCode is the same.
     * This call invokes the onValueHostValidationStateChanged callback if there were IssueFound items applied.
     * 
     * Use case: client-side getting server-side Jivs-generated IssuesFound,
     * so the UI can incorporate it.
     * @param issuesFound 
     * @param behavior - keep or omit an issueFound that does not have a matching validator
     * based on the errorCode. Defaults to Keep.
     */
    public setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior = SetIssuesFoundErrorCodeMissingBehavior.Keep): boolean
    {
        assertNotNull(issuesFound, 'issuesFound');
        let changed = false;
        let thisName = this.getName();
        for (let issueFound of issuesFound)
        {
            if (issueFound.valueHostName === thisName)
                if (this.setIssueFound(issueFound, behavior))
                    changed = true;
        }
        if (changed)
            this.invokeOnValueHostValidationStateChanged(undefined);
        return changed;
    }

    /**
     * Adds or replaces an IssueFound. 
     * Replacement when the errorCode is the same.
     * This does NOT invoke the onValueHostValidated callback.
     * 
     * Use case: client-side getting server-side Jivs-generated IssuesFound,
     * so the UI can incorporate it.
     * @param issueFound 
     */
    protected setIssueFound(issueFound: IssueFound, behavior: SetIssuesFoundErrorCodeMissingBehavior): boolean
    {
        assertNotNull(issueFound, 'issueFound');
        let errorMsg: string | null = null;
        if (!issueFound.errorCode)
            errorMsg = 'IssueFound needs an errorCode';
        /* istanbul ignore next */ // defensive. Does not get called with the current implementation
        if (issueFound.valueHostName !== this.getName())
            errorMsg = 'IssueFound has wrong valueHostName';
        if (errorMsg)
        {
            let error = new CodingError(errorMsg);
            this.logger.error(error);
            throw error;            
        }

        if (!this.handlesErrorCode(issueFound.errorCode))
        {
            switch (behavior)
            {
                case SetIssuesFoundErrorCodeMissingBehavior.Omit:
                    return false;
            }
        }

        // we'll be replacing the entire this.instanceState.issuesFound array
        // during updateState. For now, initialize with the existing IssueFound objects.

        let updating: Array<IssueFound> = [];
        if (this.instanceState.issuesFound)
            updating = updating.concat(this.instanceState.issuesFound);
        let pos = updating.findIndex((item) => item.errorCode === issueFound.errorCode);
        if (pos >= 0)
            updating[pos] = issueFound;
        else
            updating.push(issueFound);
        let changed = this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.issuesFound = updating;
            if (issueFound.severity !== ValidationSeverity.Warning)
                stateToUpdate.status = ValidationStatus.Invalid;
            //!!!PENDING: Clean up async work done against the same error code?
            return stateToUpdate;
        }, this);

        return changed;
    }
        
    //#endregion validation results

}

/**
 * Determines if the object implements IValidatableValueHostBase.
 * @param source 
 * @returns source typecasted to IValidatableValueHostBase if appropriate or null if not.
 */
export function toIValidatableValueHostBase(source: any): IValidatableValueHostBase | null
{
    if (source instanceof ValidatableValueHostBase)
        return source as IValidatableValueHostBase;
    if (source && typeof source === 'object')
    {
        let test = source as IValidatableValueHostBase;    
        // some select members of IValidatableValueHostBase
        if (test.validate !== undefined &&
            test.getIssuesFound !== undefined)
            return test;
    }
    return null;
}

export abstract class ValidatableValueHostBaseGenerator implements IValueHostGenerator {
    public abstract canCreate(config: ValueHostConfig): boolean;

    public abstract create(valueHostsManager: IValueHostsManager, config: ValidatableValueHostBaseConfig, state: ValidatableValueHostBaseInstanceState): IValidatableValueHostBase;

    /**
     * Looking for changes to the ValidationConfigs to impact IssuesFound.
     * If IssuesFound did change, fix ValidationStatus for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationStatus Valid.
     * @param state 
     * @param config 
     */
    public abstract cleanupInstanceState(state: ValidatableValueHostBaseInstanceState, config: ValidatableValueHostBaseConfig): void;
    public createInstanceState(config: ValidatableValueHostBaseConfig): ValidatableValueHostBaseInstanceState {
        return {
            name: config.name,
            value: config.initialValue,
            status: ValidationStatus.NotAttempted,
            issuesFound: null
        };
    }

}