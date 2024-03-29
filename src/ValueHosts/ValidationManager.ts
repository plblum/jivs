/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Its methods provide validation and the results of validation.
 * @module ValidationManager/ConcreteClasses
 */
import { BusinessLogicInputValueHostType, BusinessLogicValueHostId } from './BusinessLogicInputValueHost';
import { deepClone, deepEquals } from '../Utilities/Utilities';
import type { IValidationServices } from '../Interfaces/ValidationServices';
import type { IValueHost, ValueHostDescriptor, ValueHostState } from '../Interfaces/ValueHost';
import { ValueHostId } from '../DataTypes/BasicTypes';
import { ValueChangedHandler, ValueHostStateChangedHandler } from './ValueHostBase';
import type { IInputValueHost } from '../Interfaces/InputValueHost';
import type { ValidateOptions, ValidateResult, BusinessLogicError, IssueSnapshot } from '../Interfaces/Validation';
import { InputValueHostBase, ValueHostValidatedHandler, InputValueChangedHandler, IInputValueHostCallbacks, toIInputValueHostCallbacks } from './InputValueHostBase';
import { assertNotNull } from '../Utilities/ErrorHandling';
import type { ValidationManagerState, IValidationManager, ValidationManagerConfig } from '../Interfaces/ValidationManager';


/**
 * ValidationManager is the central object for using this system.
 * It is where you describe the shape of your inputs and their validation rules.
 * Once setup, it has a list of ValueHost objects. Those that are InputValueHosts
 * contain validators.
 * 
 * Descriptors are interfaces you use with plain objects to fashion them into 
 * ValidationManager's configuration. ValueHostDescriptor describes a ValueHost.
 * InputValueHostDescriptor describes an InputValueHost (which supports validation).
 * An InputValueHost takes InputValidatorDescriptors to fashion its list of Validators.
 * An InputValidator takes various ConditionDescriptors to fashion the specific 
 * validation rule.
 * 
 * ValidationManager's constructor takes a single parameter, but its a potent one:
 * it's Configuration object (type=ValidationManagerConfig). By the time you 
 * create the ValidationManager, you have provided all of those descriptors to
 * the Configuration object. It also supplies the ValidationServices object,
 * state data, and callbacks. See the constructor's documentation for a sample of 
 * the Configuration object.
 * 
 * We recommend using your business logic to host the validation rules.
 * For that, you will need code that translates those rules into InputValidatorDescriptors.
 * Try to keep validation rules separate from your UI's code.
 * 
 * All Descriptors are considered immutable. If you need to make a change, you can
 * create a new instance of ValidationManager, or call its addValueHost, updateValueHost,
 * or discardValueHost methods to keep the existing instance.
 * 
 * ValidationManager's job is:
 * - Create and retain all ValueHosts.
 * - Provide access to all ValueHosts with its getValueHost() function.
 * - Retain State objects that reflects the states of all ValueHost instances.
 *   This system can operate in a stateless way, so long as you keep
 *   these objects and pass them back via the Configuration object.
 *   Its OnStateChanged and OnValueHostStateChanged properties are callbacks
 *   provide the latest State objects to you.
 * - Execute validation on demand to the consuming system, going
 *   through all eligible InputValueHosts.
 * - Report a list of Issues Found for an individual UI element.
 * - Report a list of Issues Found for the entire system for a UI 
 *   element often known as "Validation Summary".
 * 
 * Notice that this class does not know anything about consuming system.
 * As a result depends on the consuming system to transfer values between
 * the UI and the ValueHosts. Auxillary Jivs libraries may handle this.
 */

export class ValidationManager<TState extends ValidationManagerState> implements IValidationManager, IValidationManagerCallbacks {
    /**
     * Constructor
     * @param config - Provides ValidationManager with numerous configuration settings.
     * It is just a simple object that you may initialize like this:
     * @example
     * ```ts
     * {
     *   Services: CreateValidationServices(); <-- see and customize your create_services.ts file
     *   ValueHostDescriptors: [
     *     // see elsewhere for details on ValueHostDescriptors as they are the heavy lifting in this system.
     *     // Just know that you need one object for each value that you want to connect
     *     // to the Validation Manager
     *      ],
     *   SavedState: null, // or the state object previously returned with OnStateChanged
     *   SavedValueHostStates: null, // or an array of the state objects previously returned with OnValueHostStateChanged
     *   OnStateChanged: (validationManager, state)=> { },
     *   OnValueHostStateChanged: (valueHost, state) => { },
     *   OnValidated: (validationManager, validationResults)=> { },
     *   OnValueHostValidated: (valueHost, validationResult) => { },
     *   OnValueChanged: (valueHost, oldValue) => { },
     *   OnInputValueChanged: (valueHost, oldValue) => { }
     * }
     * ```
     */
    constructor(config: ValidationManagerConfig) {
        assertNotNull(config, 'config');
        assertNotNull(config.services, 'services');
        // NOTE: We don't keep the original instance of Config to avoid letting the caller edit it while in use.
        let savedServices = config.services ?? null;
        config.services = null as any; // to ignore during DeepClone
        let internalConfig = deepClone(config) as ValidationManagerConfig;
        config.services = savedServices;
        internalConfig.services = savedServices;

        this._config = internalConfig;
        this._valueHostDescriptors = {};
        this._valueHosts = {};
        this._state = internalConfig.savedState ?? {};
        if (typeof this._state.stateChangeCounter !== 'number')
            this._state.stateChangeCounter = 0;
        this._lastValueHostStates = internalConfig.savedValueHostStates ?? [];
        let descriptors = internalConfig.valueHostDescriptors ?? [];
        for (let descriptor of descriptors) {
            this.addValueHost(descriptor, null);
        }
    }
    protected get config(): ValidationManagerConfig
    {
        return this._config;
    }
    private readonly _config: ValidationManagerConfig;

    /**
     * The ValidationManager and IValidationServices are crosslinked.
     * A instance of ValidationManager is passed to the IValidationServices's constructor
     * and that constructor sets this property.
     */
    public get services(): IValidationServices {
        return this._config.services!;
    }


    /**
     * ValueHosts for all ValueHostDescriptors.
     * Always replace a ValueHost when the associated Descriptor or State are changed.
     */
    protected get valueHosts(): IValueHostsMap {
        return this._valueHosts;
    }

    private _valueHosts: IValueHostsMap = {};
    /**
     * ValueHostDescriptors supplied by the caller (business logic).
     * Always replace a ValueHost when its Descriptor changes.
     */
    protected get valueHostDescriptors(): IValueHostDescriptorsMap {
        return this._valueHostDescriptors;
    }
    private _valueHostDescriptors: IValueHostDescriptorsMap = {};

    /**
     * ValueHostStates and more.
     * A copy of this is expected to be retained (redux/localstorage/etc)
     * by the caller to support recreating the ValidationManager in a stateless situation.
     */
    protected get state(): ValidationManagerState {
        return this._state;
    }
    private _state: ValidationManagerState;

    /**
     * Value retained from the constructor to share with calls to addValueHost,
     * giving new ValueHost instances their last state.
     */
    private readonly _lastValueHostStates: Array<ValueHostState>;

    /**
     * Use to change anything in ValidationManagerState without impacting the immutability 
     * of the current instance.
     * Your callback will be passed a cloned instance. Change any desired properties
     * and return that instance. It will become the new immutable value of
     * the State property.
     * @param updater - Your function to change and return a state instance.
     * @returns true when the state did change. false when it did not.
     */
    public updateState(updater: (stateToUpdate: TState) => TState): boolean {
        assertNotNull(updater, 'updater');
        let toUpdate = deepClone(this.state);
        let updated = updater(toUpdate);
        if (!deepEquals(this.state, updated)) {
            this._state = updated;
            this.onStateChanged?.(this, updated);
            return true;
        }
        return false;
    }

    /**
     * Adds a ValueHostDescriptor for a ValueHost not previously added. 
     * Does not trigger any notifications.
     * Exception when the same ValueHostDescriptor.Id already exists.
     * @param descriptor 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupState() first.
     * When null, the state supplied in the ValidationManager constructor will be used if available.
     * When neither state was supplied, a default state is created.
     */
    public addValueHost(descriptor: ValueHostDescriptor, initialState: ValueHostState | null): IValueHost {
        assertNotNull(descriptor, 'descriptor');
        if (!this._valueHostDescriptors[descriptor.id])
            return this.applyDescriptor(descriptor, initialState);

        throw new Error(`Property ${descriptor.id} already assigned.`);
    }
    /**
     * Replaces a ValueHostDescriptor for an already added ValueHost. 
     * Does not trigger any notifications.
     * If the id isn't found, it will be added.
     * @param descriptor 
     * @param initialState - When not null, this state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupState() first.
     */
    public updateValueHost(descriptor: ValueHostDescriptor, initialState: ValueHostState | null): IValueHost {
        assertNotNull(descriptor, 'descriptor');
        if (this._valueHostDescriptors[descriptor.id])
            return this.applyDescriptor(descriptor, initialState);

        return this.addValueHost(descriptor, initialState);
    }
    /**
     * Discards a ValueHost. 
     * Does not trigger any notifications.
     * @param descriptor 
     */
    public discardValueHost(descriptor: ValueHostDescriptor): void {
        assertNotNull(descriptor, 'descriptor');
        if (this._valueHostDescriptors[descriptor.id]) {
            delete this._valueHosts[descriptor.id];
            delete this._valueHostDescriptors[descriptor.id];
            if (this._lastValueHostStates)
            {
                let pos = this._lastValueHostStates.findIndex((state) => state.id === descriptor.id);
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
     * @param initialState - When not null, this ValueHost state object is used instead of an initial state.
     * It overrides any state supplied by the ValidationManager constructor.
     * It will be run through ValueHostFactory.cleanupState() first.
     * @returns 
     */
    protected applyDescriptor(descriptor: ValueHostDescriptor, initialState: ValueHostState | null): IValueHost {
        let factory = this.services.valueHostFactory; // functions in here throw exceptions if descriptor is unsupported
        let state: ValueHostState | undefined = undefined;
        let existingState = initialState;
        let defaultState = factory.createState(descriptor);

        if (!existingState && this._lastValueHostStates)
            existingState = this._lastValueHostStates.find((state) => state.id === descriptor.id) ?? null;
        if (existingState) {
            let cleanedState = deepClone(existingState) as ValueHostState;  // clone to allow changes during Cleanup
            factory.cleanupState(cleanedState, descriptor);
            // User may have supplied the state without
            // all of the properties we normally use.
            // Ensure all properties defined by createState() exist, even if their value is undefined
            // so that we have consistency. 
            state = { ...defaultState, ...cleanedState };
        }
        else
            state = defaultState;
        let vh = factory.create(this, descriptor, state);

        this._valueHosts[descriptor.id] = vh;
        this._valueHostDescriptors[descriptor.id] = descriptor;
        return vh;
    }

    /**
     * Retrieves the ValueHost associated with valueHostId
     * @param valueHostId - Matches to the IValueHost.Id property
     * Returns the instance or null if not found.
     */
    public getValueHost(valueHostId: ValueHostId): IValueHost | null {
        return this._valueHosts[valueHostId] ?? null;
    }

    /**
     * Upon changing the value of a ValueHost, other ValueHosts need to know. 
     * They may have Conditions that take the changed ValueHost into account and
     * will want to revalidate or set up a state to force revalidation.
     * This goes through those ValueHosts and notifies them.
     */
    public notifyOtherValueHostsOfValueChange(valueHostIdThatChanged: ValueHostId, revalidate: boolean): void {
        for (let ivh of this.inputValueHost())
            if (ivh.getId() !== valueHostIdThatChanged)
                ivh.otherValueHostChangedNotification(valueHostIdThatChanged, revalidate);
    }

    protected * inputValueHost(): Generator<IInputValueHost> {
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
     * @returns Array of ValidateResult with empty array if all are valid
     */
    public validate(options?: ValidateOptions): Array<ValidateResult> //!!!PENDING change this to ValidateResults with isValid and DoNotSave in addition to this array
    {
        if (!options)
            options = {};
        let list: Array<ValidateResult> = [];

        for (let vh of this.inputValueHost()) {
            list.push(vh.validate(options));
        }
        if (!options || !options.omitCallback)
            this.onValidated?.(this, list);
        return list;
    }

    /**
     * Changes the validation state to itself initial: Undetermined
     * with no error messages.
     */
    public clearValidation(): void {
        for (let vh of this.inputValueHost()) {
            vh.clearValidation();
        }
    }

    /**
     * Value is setup by calling validate(). It does not run validate() itself.
     * Returns false only when any InputValueHost has a ValidationResult of Invalid. 
     * This follows an old style validation rule of everything is valid when not explicitly
     * marked invalid. That means when it hasn't be run through validation or was undetermined
     * as a result of validation.
     * Recommend using doNotSaveNativeValue for more clarity.
     */
    public get isValid(): boolean {
        for (let vh of this.inputValueHost())
            if (!vh.isValid)
                return false;
        return true;
    }
    /**
     * Determines if a validator doesn't consider the ValueHost's value ready to save
     * based on the latest call to validate(). (It does not run validate().)
     * True when ValidationResult is Invalid, AsyncProcessing, or ValueChangedButUnvalidated
     * on individual validators.
     */
    public doNotSaveNativeValue(): boolean {
        for (let vh of this.inputValueHost()) {
            if (vh.doNotSaveNativeValue())
                return true;
        }
        return false;
    }

    /**
     * When Business Logic gathers data from the UI, it runs its own final validation.
     * If its own business rule has been violated, it should be passed here where it becomes exposed to 
     * the Validation Summary (getIssuesForSummary) and optionally for an individual ValueHostId,
     * by specifying that valueHostId in AssociatedValueHostId.
     * Each time its called, all previous business logic errors are abandoned.
     * Internally, a BusinessLogicInputValueHost is added to the list of ValueHosts to hold any
     * error that lacks an AssociatedValueHostId.
     * @param errors - A list of business logic errors to show or null to indicate no errors.
     */
    public setBusinessLogicErrors(errors: Array<BusinessLogicError> | null): void {

        for (let vh of this.inputValueHost()) {
            vh.clearBusinessLogicErrors();
        }
        if (errors)
            for (let error of errors) {
                let vh = this.getValueHost(error.associatedValueHostId ?? BusinessLogicValueHostId);
                if (!vh && !error.associatedValueHostId) {
                    vh = this.addValueHost({
                        type: BusinessLogicInputValueHostType,
                        label: '*',
                        id: BusinessLogicValueHostId
                    }, null);
                }
                if (vh instanceof InputValueHostBase)
                    vh.setBusinessLogicError(error);
            }
    }
    /**
     * Lists all issues found (error messages and supporting info) for a single InputValueHost
     * so the input field/element can show error messages and adjust its appearance.
     * @param valueHostId - identifies the ValueHost whose issues you want.
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    public getIssuesForInput(valueHostId: ValueHostId): Array<IssueSnapshot> {
        let vh = this.getValueHost(valueHostId);
        if (vh && vh instanceof InputValueHostBase)
            return vh.getIssuesForInput();
        return [];
    }
    /**
     * A list of all issues to show in a Validation Summary widget for a giving validation group.
     * @param group 
     * @returns An array of 0 or more details of issues found. Each contains:
     * - Id - The ID for the ValueHost that contains this error. Use to hook up a click in the summary
     *   that scrolls the associated input field/element into view and sets focus.
     * - Severity - Helps style the error. Expect Severe, Error, and Warning levels.
     * - errorMessage - Fully prepared, tokens replaced and formatting rules applied, to 
     *   show in the Validation Summary widget. Each InputValidator has 2 messages.
     *   One is for Summary only. If that one wasn't supplied, the other (for local displaying message)
     *   is returned.
     */
    public getIssuesForSummary(group?: string): Array<IssueSnapshot> {
        let list: Array<IssueSnapshot> = [];
        for (let vh of this.inputValueHost()) {
            list = list.concat(vh.getIssuesForSummary(group));
        }
        return list;
    }
    //#region IValidationManagerCallbacks
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call its setState function with the stateToRetain
     */
    public get onStateChanged(): ValidationManagerStateChangedHandler | null {
        return this.config.onStateChanged ?? null;
    }
    /**
     * Called when ValidationManager's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    public get onValidated(): ValidationManagerValidatedHandler | null {
        return this.config.onValidated ?? null;
    }
    /**
     * Called when any ValueHost had its ValueHostState changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setValueHostState() with the stateToRetain.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostStateChanged(): ValueHostStateChangedHandler | null {
        return this.config.onValueHostStateChanged ?? null;
    }
    /**
     * Called when ValueHost's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the validation related aspects of the component to refresh, 
     * such as showing error messages and changing style sheets.
     * Use to change the disabled state of the submit button based on validity.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueHostValidated(): ValueHostValidatedHandler | null {
        return this.config.onValueHostValidated ?? null;
    }
    /**
     * Called when the ValueHost's Value property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual ValueHosts.
     * Here, it aggregates all ValueHost notifications.
     */
    public get onValueChanged(): ValueChangedHandler | null {
        return this.config.onValueChanged ?? null;
    }
    /**
     * Called when the InputValueHost's InputValue property has changed.
     * If setup, you can prevent it from being fired with the options parameter of setValue()
     * to avoid round trips where you already know the details.
     * You can setup the same callback on individual InputValueHosts.
     * Here, it aggregates all InputValueHost notifications.
     */
    public get onInputValueChanged(): InputValueChangedHandler | null {
        return this.config.onInputValueChanged ?? null;
    }
    //#endregion IValidationManagerCallbacks
}

/**
 * All ValueHostDescriptors for this ValidationManager.
 * Caller may pass this in via the ValidationManager constructor
 * or build it out via ValidationManager.addValueHost.
 * Each entry must have a companion in ValueHost and ValueHostState in
 * this ValidationManager.
 */
interface IValueHostDescriptorsMap {
    [valueHostId: ValueHostId]: ValueHostDescriptor;
}

/**
 * All InputValueHosts for the Model.
 * Each entry must have a companion in InputValueDescriptors and ValueHostState
 * in this ValidationManager.
 */
interface IValueHostsMap {
    [valueHostId: ValueHostId]: IValueHost;
}

export type ValidationManagerStateChangedHandler = (validationManager: IValidationManager, stateToRetain: ValidationManagerState) => void;
export type ValidationManagerValidatedHandler = (validationManager: IValidationManager, validateResults: Array<ValidateResult>) => void;


/**
 * Provides callback hooks for the consuming system to supply to ValidationManager.
 * This instance is supplied in the constructor of ValidationManager.
 */
export interface IValidationManagerCallbacks extends IInputValueHostCallbacks {
    /**
     * Called when the ValidationManager's state has changed.
     * React example: React component useState feature retains this value
     * and needs to know when to call the setState function with the stateToRetain
     */
    onStateChanged?: ValidationManagerStateChangedHandler | null;
    /**
     * Called when ValidationManager's validate() function has returned.
     * Supplies the result to the callback.
     * Examples: Use to notify the Validation Summary widget(s) to refresh.
     * Use to change the disabled state of the submit button based on validity.
     */
    onValidated?: ValidationManagerValidatedHandler | null;
}

/**
 * Determines if the object implements IValidationManagerCallbacks.
 * @param source 
 * @returns source typecasted to IValidationManagerCallbacks if appropriate or null if not.
 */
export function toIValidationManagerCallbacks(source: any): IValidationManagerCallbacks | null
{
    if (toIInputValueHostCallbacks(source))
    {
        let test = source as IValidationManagerCallbacks;     
        if (test.onStateChanged !== undefined &&
            test.onValidated !== undefined)
            return test;
    }
    return null;
}
