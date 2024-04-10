/**
 * Expands upon ValueHost to provide the basics of validation.
 * @module ValueHosts/AbstractClasses/ValidatableValueHostBase
 */
import { ValueHostId } from '../DataTypes/BasicTypes';
import { deepEquals, groupsMatch } from '../Utilities/Utilities';
import { type SetValueOptions} from '../Interfaces/ValueHost';
import { ValueHostBase } from './ValueHostBase';
import type { IValueHostGenerator } from '../Interfaces/ValueHostFactory';
import { IValueHostResolver, IValueHostsManager, toIValueHostsManager } from '../Interfaces/ValueHostResolver';
import { IValidatableValueHostBase, ValidatableValueHostBaseDescriptor, ValidatableValueHostBaseState } from '../Interfaces/ValidatableValueHostBase';
import { BusinessLogicError, IssueFound, ValidateOptions, ValidateResult, ValidationResult, ValidationSeverity } from '../Interfaces/Validation';


/**
* Expands upon ValueHost to provide the basics of validation.
 */
export abstract class ValidatableValueHostBase<TDescriptor extends ValidatableValueHostBaseDescriptor, TState extends ValidatableValueHostBaseState>
    extends ValueHostBase<TDescriptor, TState>
    implements IValidatableValueHostBase {
/**
 * @param valueHostsManager - Contains all ValueHosts. This is usually ValidationManager.
 *   It is the owner of all state and provides group validation.
 * @param descriptor - The business logic supplies these rules
 *   to implement a ValueHost's Id, label, data type, validation rules,
 *   and other business logic metadata. Treat as immutable.
 * @param state - State used by this InputValueHost including its validators.
 * If the caller changes any of these, discard the instance. Treat as immutable.
 */    
    constructor(valueHostsManager: IValueHostsManager, descriptor: TDescriptor, state: TState) {
        super(valueHostsManager, descriptor, state);
    }


    //#region IInputValueHost
    /**
      * System consumer assigns the native value to make it available
      * to most Conditions during validation.
      * @param value 
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
    */
    public setValue(value: any, options?: SetValueOptions): void {
        if (!options)
            options = {};        
        let oldValue: any = this.state.value;
        let changed = !deepEquals(value, oldValue);
        this.updateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.validationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.value = value;
            }
            this.updateChangeCounterInState(stateToUpdate, changed, options!);
            this.updateConversionErrorMessage(stateToUpdate, value, options!);

            return stateToUpdate;
        }, this);
        this.processValidationOptions(options); //NOTE: If validates or clears, results in a second updateState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(changed, oldValue, options);
    }

    /**
     * Exposes the latest value retrieved from the input field/element
     * exactly as supplied by that input. For example,
     * an <input type="date"> returns a string, not a date.
     * Strings are not cleaned up, no trimming applied.
     */
    public getInputValue(): any {
        return this.state.inputValue;
    }

    /**
    * Consuming system assigns the same value it assigns to the input field/element.
    * Its used with RequiredCondition and DataTypeCondition.
    * @param value
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
    */
    public setInputValue(value: any, options?: SetValueOptions): void {
        if (!options)
            options = {};        
        let oldValue: any = this.state.inputValue;
        let changed = !deepEquals(value, oldValue);
        this.updateState((stateToUpdate) => {
            if (changed) {
                stateToUpdate.validationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.inputValue = value;
            }
            this.updateChangeCounterInState(stateToUpdate, changed, options!);
            this.updateConversionErrorMessage(stateToUpdate, undefined, {});
            return stateToUpdate;
        }, this);
        this.processValidationOptions(options); //NOTE: If validates or clears, results in a second updateState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(changed, oldValue, options);
    }

    /**
     * Sets both (native data type) Value and input field/element Value at the same time
     * and optionally invokes validation.
     * Use when the consuming system resolves both input and native values
     * at the same time so there is one state change and attempt to validate.
     * @param nativeValue - Can be undefined to indicate the value could not be resolved
     * from the input field/element's value, such as inability to convert a string to a date.
     * All other values, including null and the empty string, are considered real data.
     * @param inputValue - Can be undefined to indicate there is no value.
     * All other values, including null and the empty string, are considered real data.
    * @param options - 
    * validate - Invoke validation after setting the value.
    * Reset - Clears validation (except when validate=true) and sets IsChanged to false.
    * ConversionErrorTokenValue - When setting the value to undefined, it means there was an error
    * converting. Provide a string here that is a UI friendly error message. It will
    * appear in the Required validator within the {ConversionError} token.
     */
    public setValues(nativeValue: any, inputValue: any, options?: SetValueOptions): void {
        if (!options)
            options = options ?? {};
        let oldNative: any = this.state.value;
        let nativeChanged = !deepEquals(nativeValue, oldNative);
        let oldInput: any = this.state.inputValue;
        let inputChanged = !deepEquals(inputValue, oldInput);
        let changed = nativeChanged || inputChanged;
        this.updateState((stateToUpdate) => {
            if (changed) {
                // effectively clear past validation
                stateToUpdate.validationResult = ValidationResult.ValueChangedButUnvalidated;
                stateToUpdate.issuesFound = null;

                stateToUpdate.value = nativeValue;
                stateToUpdate.inputValue = inputValue;
            }
            this.updateChangeCounterInState(stateToUpdate, changed, options!);
            this.updateConversionErrorMessage(stateToUpdate, nativeValue, options!);
            return stateToUpdate;
        }, this);

        this.processValidationOptions(options); //NOTE: If validates or clears, results in a second updateState()
        this.notifyOthersOfChange(options);
        this.useOnValueChanged(nativeChanged, oldNative, options);
        this.useOnValueChanged(inputChanged, oldInput, options);
    }

    protected updateConversionErrorMessage(stateToUpdate: ValidatableValueHostBaseState,
        nativeValue: any, options: SetValueOptions): void {
        if ((nativeValue === undefined) && options.conversionErrorTokenValue)
            stateToUpdate.conversionErrorTokenValue = options.conversionErrorTokenValue;
        else
            delete stateToUpdate.conversionErrorTokenValue;
    }

    protected processValidationOptions(options: SetValueOptions): void {
        if (options.validate) {
            if (this.state.validationResult === ValidationResult.ValueChangedButUnvalidated)
                this.validate(); // Result isn't ignored. Its automatically updates state and notifies parent
        }
        else if (options.reset)
            this.clearValidation();
    }

    protected notifyOthersOfChange(options: SetValueOptions): void {
        toIValueHostsManager(this.valueHostsManager)?.notifyOtherValueHostsOfValueChange?.(
            this.getId(), options.validate === true);
    }
    /**
     * When setValue(), setValues(), setInputValue(), or SetToUndefined occurs,
     * all other InputValueHosts get notified here so they can rerun validation
     * when any of their Conditions specify the valueHostId that changed.
     * @param valueHostIdThatChanged 
     * @param revalidate 
     */
    public otherValueHostChangedNotification(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void {
        if (valueHostIdThatChanged === this.getId())
            return; // mostly to call out this case isn't desirable.
        if (this.validationResult === ValidationResult.NotAttempted)
            return; // validation didn't previously run, so no change now
        if (!revalidate && (this.validationResult === ValidationResult.ValueChangedButUnvalidated))
            return; // validation didn't previously run and the rest only sets the same ValidationResult

        // Looks like validation previously ran...
        // check if we use a Condition that specifies valueHostIdThatChanged.
        if (!this._associatedValueHosts) { // this is a cache that is only cleared by recreating the ValueHost
            // it assumes that the Descriptor is immutable, so there cannot be any changes to ValueHosts
            // without creating a new instance of this ValueHost
            this._associatedValueHosts = new Set<ValueHostId>();
            this.gatherValueHostIds(this._associatedValueHosts, this.valueHostsManager);

        }

        if (this._associatedValueHosts.has(valueHostIdThatChanged)) {
            // change the ValidationResult to ValueChangedButUnvalidated when revalidate is false
            // call validate() when revalidate is true
            if (revalidate)
                this.validate();
            else {
                this.updateState((stateToUpdate) => {
                    this.clearValidationStateChanges(stateToUpdate);
                    stateToUpdate.validationResult = ValidationResult.ValueChangedButUnvalidated;
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
    public abstract gatherValueHostIds(collection: Set<ValueHostId>, valueHostResolver: IValueHostResolver): void;

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
    public abstract validate(options?: ValidateOptions): ValidateResult;

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false when State.ValidationResult is Invalid. Any other ValidationResult
     * return true.
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using ValidationResult property for more clarity.
     */
    public get isValid(): boolean {
        return this.validationResult !== ValidationResult.Invalid;
    }
    /**
     * Validation result. Prior to calling validate() (or setValue()'s validate option),
     * it is Undetermined.
     */
    public get validationResult(): ValidationResult {
        // any business logic errors that aren't warnings override ValidationResult with Invalid.
        if (this.businessLogicErrors)
            for (let error of this.businessLogicErrors)
                if (error.severity !== ValidationSeverity.Warning)
                    return ValidationResult.Invalid;
        return this.state.validationResult;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public clearValidation(): void {
        this.updateState((stateToUpdate) => {
            this.clearValidationStateChanges(stateToUpdate);
            return stateToUpdate;
        }, this);
    }

    protected clearValidationStateChanges(stateToUpdate: TState): void {
        stateToUpdate.validationResult = ValidationResult.NotAttempted;
        stateToUpdate.issuesFound = null;
        delete stateToUpdate.asyncProcessing;   // any active promises here will finish except will not update state due to Pending = null or at least lacking the same promise instance in this array
        delete stateToUpdate.conversionErrorTokenValue;
        delete stateToUpdate.businessLogicErrors;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save.
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated.
     */
    public doNotSaveNativeValue(): boolean {
        switch (this.validationResult) {
            case ValidationResult.Invalid:
            case ValidationResult.ValueChangedButUnvalidated:
                return true;
            default:
                if (this.state.asyncProcessing) // async running so long as not null
                    return true;
                return false;
        }
    }
    //#endregion validation
    //#region business logic errors
    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesFound) and optionally for an individual ValueHostId,
     * by specifying that valueHostId in AssociatedValueHostId.
     * Each time called, it adds to the existing list. Use clearBusinessLogicErrors() first if starting a fresh list.
     * @param error - A business logic error to show.
     */
    public setBusinessLogicError(error: BusinessLogicError): void {
        if (error) {
            this.updateState((stateToUpdate) => {
                if (!stateToUpdate.businessLogicErrors)
                    stateToUpdate.businessLogicErrors = [];
                stateToUpdate.businessLogicErrors.push(error);
                return stateToUpdate;
            }, this);
        }


    }
    /**
     * Removes any business logic errors. Generally called automatically by
     * ValidationManager as calls are made to SetBusinessLogicErrors and clearValidation().
     */
    public clearBusinessLogicErrors(): void {
        if (this.businessLogicErrors)
            this.updateState((stateToUpdate) => {
                delete stateToUpdate.businessLogicErrors;
                return stateToUpdate;
            }, this);
    }
    /**
     * exposes the Business Logic Errors list. If none, it is null.
     */
    protected get businessLogicErrors(): Array<BusinessLogicError> | null {
        return this.state.businessLogicErrors ?? null;
    }

    //#endregion business logic errors

    //#region access to validation results    
    /**
     * The results of validation specific to one condiiton Type.
     * @param conditionType 
     * @returns The issue or null if none.
     */    
    public getIssueFound(conditionType: string): IssueFound | null {
        if (!conditionType)
            return null;

        return this.state.issuesFound ?
            (this.state.issuesFound.find((value) =>
                value.conditionType === conditionType) ?? null) :
            null;
    }

    /**
     * Lists all issues found (error messages and supporting info) for a single InputValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @returns An array of 0 or more details of issues found. 
     * When 0, there are no issues and the data is valid. If there are issues, when all
     * have severity = warning, the data is also valid. Anything else means invalid data.
     * Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - ConditionType - Identifies the condition supplying the issue.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied
     * - summaryMessage - The message suited for a Validation Summary widget.
     */
    public getIssuesFound(group?: string): Array<IssueFound> {
        let id = this.getId();
        let list: Array<IssueFound> = [];

        if (this.state.issuesFound && groupsMatch(group, this.state.group)) {
            for (let issue of this.state.issuesFound) {
                list.push(issue);
            }
        }
        this.addBusinessLogicErrorsToSnapshotList(list);

        return list;
    }
    private addBusinessLogicErrorsToSnapshotList(list: Array<IssueFound>): void {
        if (this.businessLogicErrors) {
            for (let error of this.businessLogicErrors) {
                list.push({
                    valueHostId: this.getId(),
                    conditionType: error.errorCode ?? '',
                    severity: error.severity ?? ValidationSeverity.Error,
                    errorMessage: error.errorMessage,
                    summaryMessage: error.errorMessage
                });
            }
        }
    }
    //#endregion validation results
    /**
     * Returns the ConversionErrorTokenValue supplied by the latest call
     * to setValue() or setValues(). Its null when not supplied or has been cleared.
     * Associated with the {ConversionError} token of the DataTypeCheckCondition.
     */
    public getConversionErrorMessage(): string | null {
        return this.state.conversionErrorTokenValue ?? null;
    }
    /**
     *Returns true if a Required condition is setup. UI can use it to 
     * display a "requires a value" indicator.
     */
    public abstract get requiresInput(): boolean;

}

/**
 * Determines if the object implements IInputValueHost.
 * @param source 
 * @returns source typecasted to IInputValueHost if appropriate or null if not.
 */
export function toIValidatableValueHostBase(source: any): IValidatableValueHostBase | null
{
    if (source instanceof ValidatableValueHostBase)
        return source as IValidatableValueHostBase;
    if (source && typeof source === 'object')
    {
        let test = source as IValidatableValueHostBase;    
        // some select members of IValidatableValueHostBase
        if (test.getInputValue !== undefined && 
            test.setInputValue !== undefined &&
            test.validate !== undefined &&
            test.getIssuesFound !== undefined)
            return test;
    }
    return null;
}

export abstract class ValidatableValueHostBaseGenerator implements IValueHostGenerator {
    public abstract canCreate(descriptor: ValidatableValueHostBaseDescriptor): boolean;

    public abstract create(valueHostsManager: IValueHostsManager, descriptor: ValidatableValueHostBaseDescriptor, state: ValidatableValueHostBaseState): IValidatableValueHostBase;

    /**
     * Looking for changes to the ValidationDescriptors to impact IssuesFound.
     * If IssuesFound did change, fix ValidationResult for when Invalid to 
     * review IssuesFound in case it is only a Warning, which makes ValidationResult Valid.
     * @param state 
     * @param descriptor 
     */
    public abstract cleanupState(state: ValidatableValueHostBaseState, descriptor: ValidatableValueHostBaseDescriptor): void;
    public createState(descriptor: ValidatableValueHostBaseDescriptor): ValidatableValueHostBaseState {
        return {
            id: descriptor.id,
            value: descriptor.initialValue,
            validationResult: ValidationResult.NotAttempted,
            inputValue: undefined,
            issuesFound: null
        };
    }

}