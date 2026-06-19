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
import { IssueFound, ValidateOptions, ValueHostValidateResult, ValidationStatus, ValidationSeverity, SetIssuesFoundErrorCodeMissingBehavior } from '../Interfaces/Validation';
import { IValidationManager, toIValidationManager, toIValidationManagerCallbacks } from '../Interfaces/ValidationManager';
import { IValueHostsManager, toIValueHostsManager } from '../Interfaces/ValueHostsManager';
import { LoggingLevel } from '../Interfaces/LoggerService';
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
     * - ExternalIssuesFound can be set, but will not be available with
     *   getIssuesFound() until the ValueHost is enabled again.
     * - The onValueHostValidationStateChanged event will be raised
     *   on actions that change the state, such as setting a external IssueFound.
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

        // any external issues that aren't warnings override ValidationStatus with Invalid.
        if (this.externalIssuesFound)
            for (let error of this.externalIssuesFound)
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
        delete stateToUpdate.externalIssuesFound;
        delete stateToUpdate.corrected;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * Rules are:
     *   asyncProcessing=true, doNotSave=true
     *   ValidationStatus=NeedsValidation, doNotSave=true
     *   ValidationStatus=Disabled, doNotSave=false
     *   Any IssuesFound or ExternalIssuesFound with doNotSave=true, doNotSave=true (overridden by ValidationStatus and asyncProcessing)
     *   otherwise false
     */
    public get doNotSave(): boolean {
        if (this.instanceState.asyncProcessing) // async running so long as not null
            return true;
        switch (this.validationStatus) {
            case ValidationStatus.NeedsValidation:
                return true;
            case ValidationStatus.Disabled:
                return false;
            default:
                // check IssuesFound in both instanceState and externalIssuesFound. If any have doNotSave = true, return true.
                if (this.instanceState.issuesFound)
                    for (let issue of this.instanceState.issuesFound)
                        if (issue.doNotSave)
                            return true;
                if (this.externalIssuesFound)
                    for (let issue of this.externalIssuesFound)
                        if (issue.doNotSave)
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
     * For a list of external issuesfound, meaning the developer's own code
     * determines there is an error and supplies a list of them here.
     * 
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
     * @param issuesFound 
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. 
     * Only used when issueFound.doNotSave is not already set, as it takes precedence. 
     * If IssueFound.severity is Warning and issueFound.doNotSave is not set, it defaults doNotSave to false regardless of this value.
     * Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @param options - Only considers the skipCallback option.
     */
    public addExternalIssuesFound(issuesFound: Array<IssueFound>, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        let changed = false;
        if (issuesFound && issuesFound.length)
        {
            for (let issue of issuesFound) {      
                if (this.addExternalIssueFound(issue, determinedLocally, options)) {
                    changed = true;
                }
            }
        }
        return changed;
    }

    /**
     * For a single external issuefound, meaning the developer's own code
     * determines there is an error and supplies it here.
     * 
     * Invokes the onValueHostValidationStateChanged callback unless skipCallback is true.
     * @param issueFound 
     * @param determinedLocally - when true, your app's code figured out this issue and the error will be
     * revised by the next local validation. When false, for everything else. 
     * Only used when issueFound.doNotSave is not already set, as it takes precedence. 
     * If IssueFound.severity is Warning and issueFound.doNotSave is not set, it defaults doNotSave to false regardless of this value.
     * Allows post validation errors
     * generated by a server to avoid blocking the next attempt to save. Internally sets IssueFound.doNotSave to 
     * this value.
     * @param options - Only considers the skipCallback option.
     */
    public addExternalIssueFound(issueFound: IssueFound, determinedLocally: boolean, options?: ValidateOptions): boolean
    {
        if (issueFound) {
            if (!this.isEnabled())
            {
                this.logger.message(LoggingLevel.Warn, () => `External IssueFound applied on disabled ValueHost "${this.getName()}"`);
            }
            if (issueFound.doNotSave === undefined)
                if (issueFound.severity === ValidationSeverity.Warning)
                    issueFound.doNotSave = false; // default to false for warnings
                else
                    issueFound.doNotSave = determinedLocally;
    
            // check for existing with the same errorcode and replace
            let replacementIndex = -1;
            if (issueFound.errorCode && this.instanceState.externalIssuesFound) 
                for (let i = 0; i < this.instanceState.externalIssuesFound.length; i++)
                {
                    if (this.instanceState.externalIssuesFound[i].errorCode === issueFound.errorCode)
                    {
                        replacementIndex = i;
                        break;
                    }
                }
            let changed = this.updateInstanceState((stateToUpdate) => {
                if (!stateToUpdate.externalIssuesFound)
                    stateToUpdate.externalIssuesFound = [];
                if (replacementIndex === -1)
                    stateToUpdate.externalIssuesFound.push(issueFound);
                else
                    stateToUpdate.externalIssuesFound[replacementIndex] = issueFound;
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
     * Removes existing external issues found.
     * Has no impact on issues found from validators, which are only cleared by clearValidation() or validate().
     * It calls onValueHostValidationStateChanged if there was a changed to the state.
     * @param options - Only considers the skipCallback option.
     * @returns true when a change was made to the known validation state.
     */
    public clearExternalIssuesFound(options?: ValidateOptions): boolean {
        if (this.externalIssuesFound) {
            let changed = this.updateInstanceState((stateToUpdate) => {
                delete stateToUpdate.externalIssuesFound;
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
     * with Validate itself or ExternalIssuesFound.
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
     * It combines other properties and all issuesFound from both validators and external sources.
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
     * Exposes the external issues found list. If none, it is null.
     */
    protected get externalIssuesFound(): Array<IssueFound> | null {
        return this.instanceState.externalIssuesFound ?? null;
    }

    //#endregion business logic errors

    //#region access to validation results    
    /**
     * The results of validation specific to one error code or condition type.
     * Searches both IssuesFound and externalIssuesFound.
     * @param errorCode  - same as ConditionType unless you set the ValidatorConfig.errorCode property
     * @returns The issue or null if none.
     */    
    public getIssueFound(errorCode: string): IssueFound | null {
        if (!this.isEnabled()) {
            this.logger.message(LoggingLevel.Warn, () => `Issues not available on disabled ValueHost "${this.getName()}"`);
            return null;
        }

        const ec = cleanString(errorCode);
        if (!ec)
            return null;

        const validatorIssue = this.instanceState.issuesFound?.find((value) => value.errorCode === ec);
        if (validatorIssue)
            return validatorIssue;

        if (this.externalIssuesFound) {
            let issueCount = 0;
            for (const error of this.externalIssuesFound) {
                const normalizedErrorCode = cleanString(error.errorCode) ?? `GENERATED_${issueCount}`;
                if (normalizedErrorCode === ec) {
                    return this.externalToInternalIssueFound(error, issueCount);
                }
                issueCount++;
            }
        }

        return null;
    }

    /**
     * Lists all issues found (error messages and supporting info) for a single Validatable ValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * Includes both the issues found from validation (IssuesFound) and any external issues found (externalIssuesFound).
     * @param group - a filter on the validator issuesFound matching to validation group.
     * Has no impact on externalIssuesFound since they are not generated by validators.
     * @returns An array of issues found. 
     * When null, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - valueHostName - The name for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - errorCode - Identifies the validator supplying the issue.
     * - severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     * - doNotSave - When true, this issue should block saving the data. This is useful for errors that are generated outside of validation, such as server-side validation after an attempted save. It is also useful for client-side errors that are not fixed by the user changing the value, such as a missing required attachment.
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
        this.addExternalIssuesFoundToSnapshotList(list);

        return list.length ? list : null;
    }

    private addExternalIssuesFoundToSnapshotList(list: Array<IssueFound>): void {
        if (this.externalIssuesFound) {
            let issueCount = 0;
            for (let error of this.externalIssuesFound) {
                list.push(this.externalToInternalIssueFound(error, issueCount));
                issueCount++;
            }
        }
    }
    /*
    * Provide an IssueFound from the externalIssuesFound and this creates
    * an immutable IssueFound with all properties set, such as doNotSave.
    */
    private externalToInternalIssueFound(issueFound: IssueFound, issueCount: number): IssueFound {
        let severity = issueFound.severity ?? ValidationSeverity.Error;
        return {
                valueHostName: this.getName(),
                errorCode: cleanString(issueFound.errorCode)  ?? `GENERATED_${issueCount}`,
                severity: severity,
                errorMessage: issueFound.errorMessage,
                summaryMessage: (issueFound.summaryMessage && issueFound.summaryMessage.length) ?
                    issueFound.summaryMessage : issueFound.errorMessage,
                doNotSave: issueFound.doNotSave ?? severity !== ValidationSeverity.Warning
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
    /// !!!OBSOLETE
    public setIssuesFound(issuesFound: Array<IssueFound>, behavior: SetIssuesFoundErrorCodeMissingBehavior = SetIssuesFoundErrorCodeMissingBehavior.Keep): boolean
    {
/*        
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
        */
        return false;
    }

    /**
     * Adds or replaces an IssueFound. 
     * Replacement when the errorCode is the same.
     * This does NOT invoke the onValueHostValidated callback.
     * 
     * Use case: targets testing primarily, so we can skip the validation step.
     * @param issueFound 
     */

    protected setIssueFound(issueFound: IssueFound): boolean
    {
        assertNotNull(issueFound, 'issueFound');

        if (issueFound.valueHostName !== this.getName())
        {
            this.logger.message(LoggingLevel.Warn, () => `Attempted to set IssueFound with valueHostName "${issueFound.valueHostName}" on ValueHost "${this.getName()}". Ignoring this issueFound.`);
            return false;
        }
        if (issueFound.severity === undefined)
            issueFound.severity = ValidationSeverity.Error;
        if (issueFound.doNotSave === undefined)
            issueFound.doNotSave = issueFound.severity !== ValidationSeverity.Warning;

        // we'll be replacing the entire this.instanceState.issuesFound array
        // during updateState. For now, initialize with the existing IssueFound objects.

        let updating: Array<IssueFound> = [];
        if (this.instanceState.issuesFound)
            updating = updating.concat(this.instanceState.issuesFound);
        let pos = -1;
        if (issueFound.errorCode)
            pos = updating.findIndex((item) => item.errorCode === issueFound.errorCode);
        if (pos >= 0)
            updating[pos] = issueFound;
        else
            updating.push(issueFound);
        let changed = this.updateInstanceState((stateToUpdate) => {
            stateToUpdate.issuesFound = updating;
            if (issueFound.severity !== ValidationSeverity.Warning)
                stateToUpdate.status = ValidationStatus.Invalid;

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