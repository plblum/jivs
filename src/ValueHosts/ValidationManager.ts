import { BusinessLogicInputValueHostType, BusinessLogicValueHostId } from "./BusinessLogicInputValueHost";
import { DeepClone, DeepEquals } from "../Utilities/Utilities";
import type { IValidationServices } from "../Interfaces/ValidationServices";
import { valGlobals } from "../Services/ValidationGlobals";
import type { IValueHost, IValueHostDescriptor, IValueHostState } from "../Interfaces/ValueHost";
import {  IValueHostsManager } from "../Interfaces/ValueHostResolver";
import { ValueHostId } from "../DataTypes/BasicTypes";
import { ValueChangedHandler, ValueHostStateChangedHandler } from "./ValueHostBase";
import { IInputValueHost } from "../Interfaces/InputValueHost";
import { IValidateOptions, IValidateResult, IBusinessLogicError, IIssueSnapshot } from "../Interfaces/Validation";
import { InputValueHostBase, ValueHostValidatedHandler, WidgetValueChangedHandler, IInputValueHostCallbacks, ToIInputValueHostCallbacks } from "./InputValueHostBase";
import { AssertNotNull } from "../Utilities/ErrorHandling";
import { IModelState, IValidationManager } from "../Interfaces/ValidationManager";


/**
 * The central object for using this system.
 * It is where you describe the shape of your inputs and their validation
 * through the Descriptor classes.
 * Once setup, it has a list of ValueHost objects, one for each
 * descriptor that was supplied. Those that are InputValueHosts
 * contain validators.
 * 
 * Business logic is intended to manipulate the Descriptors found here.
 * Each time a InputValueHostDescriptor is created or replaced,
 * a corresponding entry is added or replaced in a dictionary of InputValueHost instances.
 * The InputValueHostDescriptors are considered immutable, only 
 * to be updated by business logic.
 * ValidationManager's job is:
 * - Maintain the ValueHostDescriptors
 * - Create and replace their associated ValueHost instances
 * - Provide access to all ValueHost instances so validators (specifically Conditions)
 *   can look up the data needed for evaluation.
 * - Retain a State object that reflects the states of all ValueHost instances.
 * - Provide a way to transfer values between the consuming system
 *   and the state.
 *   Notice that this class does not know anything about consuming system.
 *   It depends on the consuming system to transfer values.
 * - Execute validation on demand to the consuming system, going
 *   through all InputValueHosts, although individual ValueHosts may be configured
 *   to opt out, or will be ignored when a validation group requested
 *   isn't a match to that InputValueHost.
 */

export class ValidationManager<TState extends IModelState> implements IValidationManager, IModelCallbacks {
    /**
     * Constructor
     * @param descriptors - initialize with these descriptors.
     * It will internally generate implementations of IValueHost from them.
     * @param lastModelState - If supplied, restores the state that was retained by the caller.
     * If null or an empty object, it will be correctly setup.
     * @param stateChangedCallback - If supplied, notifies the caller of
     * a state change.
     */
    constructor(services: IValidationServices,
        descriptors?: Array<IValueHostDescriptor>,
        lastModelState?: IModelState,
        lastValueHostStates?: Array<IValueHostState>,
        callbacks?: IModelCallbacks) {
        AssertNotNull(services, 'services');
        this._services = services;
        this._valueHostDescriptors = {};
        this._valueHosts = {};
        this._modelState = lastModelState ?? {};
        this._lastValueHostStates = lastValueHostStates ?? [];
        if (typeof this._modelState.StateChangeCounter !== 'number')
            this._modelState.StateChangeCounter = 0;

        this._modelCallbacks = callbacks || {};
        if (descriptors)
            for (let key in descriptors) {
                this.AddValueHost(descriptors[key]);
            }
    }

    /**
     * The ValidationManager and IValidationServices are crosslinked.
     * A instance of ValidationManager is passed to the IValidationServices's constructor
     * and that constructor sets this property.
     */
    public get Services(): IValidationServices {
        return this._services;
    }

    private _services: IValidationServices;

    /**
     * ValueHosts for all ValueHostDescriptors.
     * Always replace a ValueHost when the associated Descriptor or State are changed.
     */
    protected get ValueHosts(): IValueHostsMap {
        return this._valueHosts;
    }

    private _valueHosts: IValueHostsMap = {};
    /**
     * ValueHostDescriptors supplied by the caller (business logic).
     * Always replace a ValueHost when its Descriptor changes.
     */
    protected get ValueHostDescriptors(): IValueHostDescriptorsMap {
        return this._valueHostDescriptors;
    }
    private _valueHostDescriptors: IValueHostDescriptorsMap = {};

    /**
     * ValueHostStates and more.
     * A copy of this is expected to be retained (redux/localstorage/etc)
     * by the caller to support recreating the ValidationManager in a stateless situation.
     */
    protected get ModelState(): IModelState {
        return this._modelState;
    }
    private _modelState: IModelState;

    /**
     * Value retained from the constructor to share with calls to AddValueHost,
     * giving new ValueHost instances their last state.
     */
    private _lastValueHostStates: Array<IValueHostState>;

    /**
     * Use to change anything in IModelState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the ModelState property.
     * @param updater - Your function to change and return a state instance.
     * @returns the state option that resulted from the work.
     * If there were changes, it is a new instance.
     */
    public UpdateState(updater: (stateToUpdate: TState) => TState): TState {
        AssertNotNull(updater, 'updater');
        let toUpdate = DeepClone(this.ModelState);
        let updated = updater(toUpdate);
        if (!DeepEquals(this.ModelState, updated)) {
            this._modelState = updated;
            this.OnModelStateChanged?.(this, updated);
        }
        return updated;
    }

    /**
     * Adds a ValueHostDescriptor for a ValueHost not previously added. 
     * Does not trigger any notifications.
     * Exception when the same ValueHostDescriptor.Id already exists.
     * @param descriptor 
     */
    public AddValueHost(descriptor: IValueHostDescriptor): IValueHost {
        AssertNotNull(descriptor, 'descriptor');
        if (!this._valueHostDescriptors[descriptor.Id])
            return this.ApplyDescriptor(descriptor);

        throw new Error(`Property ${descriptor.Id} already assigned.`);
    }
    /**
     * Replaces a ValueHostDescriptor for an already added ValueHost. 
     * Does not trigger any notifications.
     * If the id isn't found, it will be added.
     * @param descriptor 
     */
    public UpdateValueHost(descriptor: IValueHostDescriptor): IValueHost {
        AssertNotNull(descriptor, 'descriptor');
        if (this._valueHostDescriptors[descriptor.Id])
            return this.ApplyDescriptor(descriptor);

        return this.AddValueHost(descriptor);
    }
    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param descriptor 
     */
    public DiscardValueHost(descriptor: IValueHostDescriptor): void {
        AssertNotNull(descriptor, 'descriptor');
        if (this._valueHostDescriptors[descriptor.Id]) {
            delete this._valueHosts[descriptor.Id];
            delete this._valueHostDescriptors[descriptor.Id];
            if (this._lastValueHostStates)
            {
                let pos = this._lastValueHostStates.findIndex((state) => state.Id === descriptor.Id);
                if (pos > -1)
                    this._lastValueHostStates.splice(pos, 1);
            }
        }
    }
    /**
     * Creates the IValueHost based on the descriptor and ensures
     * ValidationManager has correct and corresponding instances of ValueHost,
     * ValueHostDescriptor and ValueHostState.
     * @param descriptor 
     * @returns 
     */
    protected ApplyDescriptor(descriptor: IValueHostDescriptor): IValueHost {
        let factory = valGlobals.GetValueHostFactory(); // functions in here throw exceptions if descriptor is unsupported
        let state: IValueHostState;
        let existingState: IValueHostState | null = null;
        if (this._lastValueHostStates)
            existingState = this._lastValueHostStates.find((state) => state.Id === descriptor.Id) ?? null;
        if (existingState) {
            state = DeepClone(existingState);  // clone to allow changes during Cleanup
            factory.CleanupState(state, descriptor);
        }
        else
            state = factory.CreateState(descriptor);
        let vh = factory.Create(this, descriptor, state);

        this._valueHosts[descriptor.Id] = vh;
        this._valueHostDescriptors[descriptor.Id] = descriptor;
        return vh;
    }

    /**
     * Retrieves the ValueHost associated with ValueHostID
     * @param valueHostId - Matches to the IValueHost.Id property
     * Returns the instance or null if not found.
     */
    public GetValueHost(valueHostId: ValueHostId): IValueHost | null {
        return this._valueHosts[valueHostId] ?? null;
    }

    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    public NotifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void {
        for (let ivh of this.InputValueHost())
            if (ivh.GetId() !== valueHostIdThatChanged)
                ivh.OtherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
    }

    protected * InputValueHost(): Generator<IInputValueHost> {
        for (let key in this._valueHosts) {
            let vh = this._valueHosts[key];
            if (vh instanceof InputValueHostBase)
                yield vh;
        }
    }

    /**
     * Runs validation against some of all validators.
     * All InputValueHosts will return their current state,
     * even if they are considered Valid.
     * Updates this ValueHost's State and notifies parent if changes were made.
     * @param options - Provides guidance on which validators to include.
     * @returns Array of IValidateResult with empty array if all are valid
     */
    public Validate(options?: IValidateOptions): Array<IValidateResult> //!!!PENDING change this to IModelValidateResults with IsValid and DoNotSave in addition to this array
    {
        if (!options)
            options = {};
        let list: Array<IValidateResult> = [];

        for (let vh of this.InputValueHost()) {
            list.push(vh.Validate(options));
        }
        if (!options || !options.OmitCallback)
            this.OnModelValidated?.(this, list);
        return list;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public ClearValidation(): void {
        for (let vh of this.InputValueHost()) {
            vh.ClearValidation();
        }
    }

    /**
     * Value is setup by calling Validate(). It does not run Validate itself.
     * Returns false only when any InputValueHost has a ValidationResult of Invalid. 
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using DoNotSaveNativeValue for more clarity.
     */
    public get IsValid(): boolean {
        for (let vh of this.InputValueHost())
            if (!vh.IsValid)
                return false;
        return true;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to Validate(). (It does not run Validate().)
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated
     * on individual validators.
     */
    public DoNotSaveNativeValue(): boolean {
        for (let vh of this.InputValueHost()) {
            if (vh.DoNotSaveNativeValue())
                return true;
        }
        return false;
    }

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (GetIssuesForSummary) and optionally for an individual ValueHostId,
     * by specifying that ValueHostID in AssociatedValueHostId.
     * Each time its called, all previous business logic errors are abandoned.
     * Internally, a BusinessLogicInputValueHost is added to the list of ValueHosts to hold any
     * error that lacks an AssociatedValueHostId.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     */
    public SetBusinessLogicErrors(errors: Array<IBusinessLogicError> | null): void {

        for (let vh of this.InputValueHost()) {
            vh.ClearBusinessLogicErrors();
        }
        if (errors)
            for (let error of errors) {
                let vh = this.GetValueHost(error.AssociatedValueHostId ?? BusinessLogicValueHostId);
                if (!vh && !error.AssociatedValueHostId) {
                    vh = this.AddValueHost({
                        Type: BusinessLogicInputValueHostType,
                        Label: '*',
                        Id: BusinessLogicValueHostId
                    });
                }
                if (vh instanceof InputValueHostBase)
                    vh.SetBusinessLogicError(error);
            }
    }
    /**
     * Lists all error messages and supporting info about each validator
     * for use by a widget that shows the local error messages (IInputValueHostState.ErrorMessage)
     * @param valueHostId - identifies the ValueHost whose issues you want.
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated widget into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - ErrorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    public GetIssuesForWidget(valueHostId: ValueHostId): Array<IIssueSnapshot> {
        let vh = this.GetValueHost(valueHostId);
        if (vh && vh instanceof InputValueHostBase)
            return vh.GetIssuesForWidget();
        return [];
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
        let list: Array<IIssueSnapshot> = [];
        for (let vh of this.InputValueHost()) {
            list = list.concat(vh.GetIssuesForSummary(group));
        }
        return list;
    }
    //#region IModelCallbacks
    private _modelCallbacks: IModelCallbacks;
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setModelState() with the stateToRetain
     */
    public get OnModelStateChanged(): ModelStateChangedHandler | null {
        return this._modelCallbacks.OnModelStateChanged ?? null;
    }
    /**
     * Called when ValidationManager's Validate method has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    public get OnModelValidated(): ModelValidatedHandler | null {
        return this._modelCallbacks.OnModelValidated ?? null;
    }
    /**
     * Called when any ValueHost had its IValueHostState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get OnValueHostStateChanged(): ValueHostStateChangedHandler | null {
        return this._modelCallbacks.OnValueHostStateChanged ?? null;
    }
    /**
     * Called when ValueHost's Validate method has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get OnValueHostValidated(): ValueHostValidatedHandler | null {
        return this._modelCallbacks.OnValueHostValidated ?? null;
    }
    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of SetValue
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get OnValueChanged(): ValueChangedHandler | null {
        return this._modelCallbacks.OnValueChanged ?? null;
    }
    /**
     * Called when the InputValueHost's WidgetValue property has changed.
     * If setup, you can prevent it from being fired with the options parameter of SetValue
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual InputValueHosts.
     * Here, it aggregates all InputValueHost notifications.
     */
    public get OnWidgetValueChanged(): WidgetValueChangedHandler | null {
        return this._modelCallbacks.OnWidgetValueChanged ?? null;
    }
    //#endregion IModelCallbacks
}


/**
 * All ValueHostDescriptors for this ValidationManager.
 * Caller may pass this in via the ValidationManager constructor
 * or build it out via ValidationManager.AddValueHost.
 * Each entry must have a companion in ValueHost and ValueHostState in
 * this ValidationManager.
 */
interface IValueHostDescriptorsMap {
    [valueHostId: ValueHostId]: IValueHostDescriptor
}

/**
 * All InputValueHosts for the model.
 * Each entry must have a companion in InputValueDescriptors and ValueHostState
 * in this ValidationManager.
 */
interface IValueHostsMap {
    [valueHostId: ValueHostId]: IValueHost
}

export type ModelStateChangedHandler = (validationManager: IValidationManager, stateToRetain: IModelState) => void;
export type ModelValidatedHandler = (validationManager: IValidationManager, validateResults: Array<IValidateResult>) => void;


/**
 * Provides callback hooks for the consuming system to supply to ValidationManager.
 * This instance is supplied in the constructor of ValidationManager.
 */
export interface IModelCallbacks extends IInputValueHostCallbacks {
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setModelState() with the stateToRetain
     */
    OnModelStateChanged?: ModelStateChangedHandler | null;
    /**
     * Called when ValidationManager's Validate method has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    OnModelValidated?: ModelValidatedHandler | null;
}

/**
 * Determines if the object implements IModelCallbacks.
 * @param source 
 * @returns source typecasted to IModelCallbacks if appropriate or null if not.
 */
export function ToIModelCallbacks(source: any): IModelCallbacks | null
{
    if (ToIInputValueHostCallbacks(source))
    {
        let test = source as IModelCallbacks;     
        if (test.OnModelStateChanged !== undefined &&
            test.OnModelValidated !== undefined)
            return test;
    }
    return null;
}
