import { ValueHostId } from "../DataTypes/BasicTypes";
import { DeepEquals, ValidationGroupsMatch } from "../Utilities/Utilities";
import { type ISetValueOptions} from "../Interfaces/ValueHost";
import { IValueHostCallbacks, ToIValueHostCallbacks, ValueHostBase } from "./ValueHostBase";
import { type IValueHostGenerator } from "./ValueHostFactory";
import { IValueHostResolver, IValueHostsManager, ToIValueHostsManager } from "../Interfaces/ValueHostResolver";
import { IInputValueHost, IInputValueHostBaseDescriptor, IInputValueHostBaseState } from "../Interfaces/InputValueHost";
import { IBusinessLogicError, IIssueFound, IIssueSnapshot, IValidateOptions, IValidateResult, ValidationResult, ValidationSeverity } from "../Interfaces/Validation";


/**
* Core implementation of IInputValueHost without specifics on validators, just on the idea of validating.
* Each instance depends on a few things, all passed into the constructor
* and treated as immutable.
* - IValueHostsManager - Contains all ValueHosts. This is usually ValidationManager.
*   It is the owner of all state and provides group validation.
* - IInputValueHostBaseDescriptor - The business logic supplies these rules
*   to implement a ValueHost's Id, label, data type, validation rules,
*   and other business logic metadata.
* - IInputValueHostState - State used by this InputValueHost including
    its validators.
* If the caller changes any of these, discard the instance
* and create a new one.
 */
export abstract class InputValueHostBase<TDescriptor extends IInputValueHostBaseDescriptor, TState extends IInputValueHostBaseState>
    extends ValueHostBase<TDescriptor, TState>
    implements IInputValueHost {
    constructor(valueHostsManager: IValueHostsManager, descriptor: TDescriptor, state: TState) {
        super(valueHostsManager, descriptor, state);
    }


    //#region IInputValueHost
    /**
      * System consumer assigns the native value to make it available
      * to most Conditions during validation.
      * @param value 
    * @param options - 
    * Validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when Validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
    */
    public SetValue(value: any, options?: ISetValueOptions): void {
        if (!options)
            options = {};        
        let oldValue: any = this.State.Value;
        let changed = !DeepEquals(value, oldValue);
        this.UpdateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.ValidationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.Value = value;
            }
            this.UpdateChangeCounterInState(stateToUpdate, changed, options!);
            this.UpdateConversionErrorMessage(stateToUpdate, value, options!);

            return stateToUpdate;
        }, this);
        this.ProcessValidationOptions(options); //NOTE: If validates or clears, results in a second UpdateState
        this.NotifyOthersOfChange(options);
        this.UseOnValueChanged(changed, oldValue, options);
    }

    /**
     * Exposes the latest value retrieved from the widget
     * exactly as supplied by the widget. For example,
     * an <input type="date"> returns a string, not a date.
     * Strings are not cleaned up, no trimming applied.
     */
    public GetWidgetValue(): any {
        return this.State.WidgetValue;
    }

    /**
    * System consumer assigns the value it also assigns to the widget.
    * Its used with RequiredCondition and DataTypeCondition.
    * @param value
    * @param options - 
    * Validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when Validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
    */
    public SetWidgetValue(value: any, options?: ISetValueOptions): void {
        if (!options)
            options = {};        
        let oldValue: any = this.State.WidgetValue;
        let changed = !DeepEquals(value, oldValue);
        this.UpdateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.ValidationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.WidgetValue = value;
            }
            this.UpdateChangeCounterInState(stateToUpdate, changed, options!);
            this.UpdateConversionErrorMessage(stateToUpdate, undefined, {});
            return stateToUpdate;
        }, this);
        this.ProcessValidationOptions(options); //NOTE: If validates or clears, results in a second UpdateState
        this.NotifyOthersOfChange(options);
        this.UseOnValueChanged(changed, oldValue, options);
    }

    /**
     * Sets both (native data type) Value and Widget Value at the same time
     * and optionally invokes validation.
     * Use when the consuming system resolves both widget and native values
     * at the same time so there is one state change and attempt to validate.
     * @param nativeValue - Can be undefined to indicate the value could not be resolved
     * from the widget's value, such as inability to convert a string to a date.
     * All other values, including null and the empty string, are considered real data.
     * @param widgetValue - Can be undefined to indicate there is no value.
     * All other values, including null and the empty string, are considered real data.
    * @param options - 
    * Validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when Validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
     */
    public SetValues(nativeValue: any, widgetValue: any, options?: ISetValueOptions): void {
        if (!options)
            options = options ?? {};
        let oldNative: any = this.State.Value;
        let nativeChanged = !DeepEquals(nativeValue, oldNative);
        let oldWidget: any = this.State.WidgetValue;
        let widgetChanged = !DeepEquals(widgetValue, oldWidget);
        let changed = nativeChanged || widgetChanged;
        this.UpdateState((stateToUpdate) => {
            if (changed) {
                // effectively clear past validation
                stateToUpdate.ValidationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.IssuesFound = null;

                stateToUpdate.Value = nativeValue;
                stateToUpdate.WidgetValue = widgetValue;
            }
            this.UpdateChangeCounterInState(stateToUpdate, changed, options!);
            this.UpdateConversionErrorMessage(stateToUpdate, nativeValue, options!);
            return stateToUpdate;
        }, this);

        this.ProcessValidationOptions(options); //NOTE: If validates or clears, results in a second UpdateState
        this.NotifyOthersOfChange(options);
        this.UseOnValueChanged(nativeChanged, oldNative, options);
        this.UseOnValueChanged(widgetChanged, oldWidget, options);
    }

    protected UpdateConversionErrorMessage(stateToUpdate: IInputValueHostBaseState,
        nativeValue: any, options: ISetValueOptions): void {
        if ((nativeValue === undefined) && options.ConversionErrorTokenValue)
            stateToUpdate.ConversionErrorTokenValue = options.ConversionErrorTokenValue;
        else
            delete stateToUpdate.ConversionErrorTokenValue;
    }

    protected ProcessValidationOptions(options: ISetValueOptions): void {
        if (options.Validate) {
            if (this.State.ValidationResult === ValidationResult.ValueChangedButUnvalidated)
                this.Validate(); // Result isn't ignored. Its automatically updates state and notifies parent
        }
        else if (options.Reset)
            this.ClearValidation();
    }

    protected NotifyOthersOfChange(options: ISetValueOptions): void {
        ToIValueHostsManager(this.ValueHostsManager)?.NotifyOtherValueHostsOfValueChange?.(
            this.GetId(), options.Validate === true);
    }
    /**
     * When SetValue, SetValues, SetWidgetValue, or SetToUndefined occurs,
     * all other InputValueHosts get notified here so they can rerun validation
     * when any of their Conditions specify the ValueHostID that changed.
     * @param valueHostIdThatChanged 
     * @param revalidate 
     */
    public OtherValueHostChangedNotification(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void {
        if (valueHostIdThatChanged === this.GetId())
            return; // mostly to call out this case isn't desirable.
        if (this.ValidationResult === ValidationResult.NotAttempted)
            return; // validation didn't previously run, so no change now
        if (!revalidate && (this.ValidationResult === ValidationResult.ValueChangedButUnvalidated))
            return; // validation didn't previously run and the rest only sets the same ValidationResult

        // Looks like validation previously ran...
        // check if we use a Condition that specifies valueHostIdThatChanged.
        if (!this._associatedValueHosts) { // this is a cache that is only cleared by recreating the ValueHost
            // it assumes that the Descriptor is immutable, so there cannot be any changes to ValueHosts
            // without creating a new instance of this ValueHost
            this._associatedValueHosts = new Set<ValueHostId>();
            this.GatherValueHostIds(this._associatedValueHosts, this.ValueHostsManager);

        }

        if (this._associatedValueHosts.has(valueHostIdThatChanged)) {
            // change the ValidationResult to ValueChangedButUnvalidated when revalidate is false
            // call Validate() when revalidate is true
            if (revalidate)
                this.Validate();
            else {
                this.UpdateState((stateToUpdate) => {
                    this.ClearValidationStateChanges(stateToUpdate);
                    stateToUpdate.ValidationResult = ValidationResult.ValueChangedButUnvalidated;
                    return stateToUpdate;
                }, this);
            }
        }
    }
    private _associatedValueHosts: Set<ValueHostId> | null = null;
    /**
     * A service to provide all ValueHostIds that have been assigned to this Condition's
     * Descriptor.
     */
    public abstract GatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void;

    //#endregion IInputValueHost

    //#region validation
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
    public abstract Validate(options?: IValidateOptions): IValidateResult;

    /**
     * Value is setup by calling Validate(). It does not run Validate itself.
     * Returns false when State.ValidationResult is Invalid. Any other ValidationResult
     * return true.
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using ValidationResult property for more clarity.
     */
    public get IsValid(): boolean {
        return this.ValidationResult !== ValidationResult.Invalid;
    }
    /**
     * Validation result. Prior to calling Validate() (or SetValue's validate option),
     * it is Undetermined.
     */
    public get ValidationResult(): ValidationResult {
        // any business logic errors that aren't warnings override ValidationResult with Invalid.
        if (this.BusinessLogicErrors)
            for (let error of this.BusinessLogicErrors)
                if (error.Severity !== ValidationSeverity.Warning)
                    return ValidationResult.Invalid;
        return this.State.ValidationResult;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public ClearValidation(): void {
        this.UpdateState((stateToUpdate) => {
            this.ClearValidationStateChanges(stateToUpdate);
            return stateToUpdate;
        }, this);
    }

    protected ClearValidationStateChanges(stateToUpdate: TState): void {
        stateToUpdate.ValidationResult = ValidationResult.NotAttempted;
        stateToUpdate.IssuesFound = null;
        delete stateToUpdate.ConversionErrorTokenValue;
        delete stateToUpdate.BusinessLogicErrors;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated.
     */
    public DoNotSaveNativeValue(): boolean {
        switch (this.ValidationResult) {
            case ValidationResult.Invalid:
            case ValidationResult.AsyncProcessing:
            case ValidationResult.ValueChangedButUnvalidated:
                return true;
            default:
                return false;
        }
    }
    //#endregion validation
    //#region business logic errors
    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (GetIssuesForSummary) and optionally for an individual ValueHostId,
     * by specifying that ValueHostID in AssociatedValueHostId.
     * Each time called, it adds to the existing list. Use ClearBusinessLogicErrors first if starting a fresh list.
     * @param error - A business logic error to show.
     */
    public SetBusinessLogicError(error: IBusinessLogicError): void {
        if (error) {
            this.UpdateState((stateToUpdate) => {
                if (!stateToUpdate.BusinessLogicErrors)
                    stateToUpdate.BusinessLogicErrors = [];
                stateToUpdate.BusinessLogicErrors.push(error);
                return stateToUpdate;
            }, this);
        }


    }
    /**
     * Removes any business logic errors. Generally called automatically by
     * ValidationManager as calls are made to SetBusinessLogicErrors and ClearValidation.
     */
    public ClearBusinessLogicErrors(): void {
        if (this.BusinessLogicErrors)
            this.UpdateState((stateToUpdate) => {
                delete stateToUpdate.BusinessLogicErrors;
                return stateToUpdate;
            }, this);
    }
    /**
     * exposes the Business Logic Errors list. If none, it is null.
     */
    protected get BusinessLogicErrors(): Array<IBusinessLogicError> | null {
        return this.State.BusinessLogicErrors ?? null;
    }

    //#endregion business logic errors

    //#region access to validation results    
    public GetIssueFound(conditionType: string): IIssueFound | null {
        //!! Not sure this is the correct approach.
        // We may only want the caller to have access to the picture of all
        // with error messages.
        // However, this should remain protected as it is used internally
        if (!conditionType)
            return null;

        return this.State.IssuesFound ?
            (this.State.IssuesFound.find((value) =>
                value.ConditionType === conditionType) ?? null) :
            null;
    }
    /**
     * The results of the latest Validate()
     * @returns Issues found or null if none.
     */
    public GetIssuesFound(): Array<IIssueFound> | null {
        return this.State.IssuesFound;
    }

    /**
     * Lists all error messages and supporting info about each validator
     * for use by a widget that shows its own error messages (IInputValueHostState.ErrorMessage)
     * @returns 
     */
    public GetIssuesForWidget(): Array<IIssueSnapshot> {
        let id = this.GetId();
        let list: Array<IIssueSnapshot> = [];

        if (this.State?.IssuesFound) {
            for (let valKey in this.State.IssuesFound) {
                let issue = this.State.IssuesFound[valKey];
                list.push({
                    Id: id,
                    Severity: issue.Severity,
                    ErrorMessage: issue.ErrorMessage
                });
            }
        }
        this.AddBusinessLogicErrorsToSnapshotList(list);

        return list;
    }

    /**
     * A list of all issues to show in a Validation Summary widget for a giving validation group.
     * @param group 
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated widget into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - ErrorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    public GetIssuesForSummary(group?: string): Array<IIssueSnapshot> {
        let id = this.GetId();
        let list: Array<IIssueSnapshot> = [];

        if (this.State?.IssuesFound && ValidationGroupsMatch(group, this.State.Group)) {
            for (let valKey in this.State.IssuesFound) {
                let issue = this.State.IssuesFound[valKey];
                list.push({
                    Id: id,
                    Severity: issue.Severity,
                    ErrorMessage: issue.SummaryErrorMessage ?? issue.ErrorMessage
                });
            }
        }
        this.AddBusinessLogicErrorsToSnapshotList(list);

        return list;
    }
    private AddBusinessLogicErrorsToSnapshotList(list: Array<IIssueSnapshot>): void {
        if (this.BusinessLogicErrors) {
            for (let error of this.BusinessLogicErrors) {
                list.push({
                    Id: this.GetId(),
                    Severity: error.Severity ?? ValidationSeverity.Error,
                    ErrorMessage: error.ErrorMessage
                });
            }
        }
    }
    //#endregion validation results
    /**
     * Returns the ConversionErrorTokenValue supplied by the latest call
     * to SetValue or SetValues. Its null when not supplied or has been cleared.
     * Associated with the {ConversionError} token of the DataTypeCheckCondition.
     */
    public GetConversionErrorMessage(): string | null {
        return this.State.ConversionErrorTokenValue ?? null;
    }
    /**
     *Returns true if a Required condition is setup. UI can use it to 
     * display a "requires a value" indicator.
     */
    public abstract get RequiresInput(): boolean;

}


export type ValueHostValidatedHandler = (valueHost: IInputValueHost, validateResult: IValidateResult) => void;
export type WidgetValueChangedHandler = (valueHost: IInputValueHost, oldValue: any) => void;

/**
 * Provides callback hooks for the consuming system to supply to IInputValueHosts.
 */
export interface IInputValueHostCallbacks extends IValueHostCallbacks {
    /**
     * Called when ValueHost's Validate method has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    OnValueHostValidated?: ValueHostValidatedHandler | null;
    /**
     * Called when the InputValueHost's WidgetValue property has changed.
     * If setup, you can prevent it from being fired with the options parameter of SetValue
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual InputValueHosts.
     * Here, it aggregates all InputValueHost notifications.
     */
    OnWidgetValueChanged?: WidgetValueChangedHandler | null;
}
/**
 * Determines if the object implements IInputValueHostCallbacks.
 * @param source 
 * @returns source typecasted to IInputValueHostCallbacks if appropriate or null if not.
 */
export function ToIInputValueHostCallbacks(source: any): IInputValueHostCallbacks | null
{
    if (ToIValueHostCallbacks(source))
    {
        let test = source as IInputValueHostCallbacks;
        if (typeof test.OnWidgetValueChanged !== undefined &&
            test.OnValueHostValidated !== undefined)
            return test;
    }
    return null;
}


export abstract class InputValueHostBaseGenerator implements IValueHostGenerator {
    public abstract CanCreate(descriptor: IInputValueHostBaseDescriptor): boolean;

    public abstract Create(valueHostsManager: IValueHostsManager, descriptor: IInputValueHostBaseDescriptor, state: IInputValueHostBaseState): IInputValueHost;

    /**
     * Looking for changes to the ValidationDescriptors to impact IssuesFound.
     * If IssuesFound did change, fix ValidationResult for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
     * @param state 
     * @param descriptor 
     */
    public abstract CleanupState(state: IInputValueHostBaseState, descriptor: IInputValueHostBaseDescriptor): void;
    public CreateState(descriptor: IInputValueHostBaseDescriptor): IInputValueHostBaseState {
        return {
            Id: descriptor.Id,
            Value: descriptor.InitialValue,
            ValidationResult: ValidationResult.NotAttempted,
            WidgetValue: undefined,
            IssuesFound: null,
        };
    }

}