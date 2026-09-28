/**
 * Provides interfaces for dispatching changes from ValueHostManager callbacks to associated DOM elements.
 * Each is an intermediary between the ValueHostManager and either an Adapter or Presentation object,
 * already attached to the element in their IJivsDomElement interface properties.
 * 
 * - onTextValueChanged -> ITextValueDispatcher -> ITextValueAdapters
 * - onValueChanged -> IValueDispatcher -> IValueAdapters
 * - onValueHostValidationStateChanged -> IFieldValidationDispatcher -> IFieldPresentation
 * - onValidationStateChanged -> IFormValidationDispatcher -> IFormPresentation
 * 
 * ## Dispatcher strategies
 * - Always use DispatcherService to create instances of the various dispatchers.
 *   It is a Creator for each category of dispatcher.
 * - Each Dispatcher depends on the IElementRegistry to locate the elements it needs to update.
 *   There should not be dispatchers trying to discover DOM elements on their own.
 * @module jivs-dom/Types/Dispatchers
 */
import { IFieldValueHost } from "@plblum/jivs-engine/build/Interfaces/FieldValueHost";
import { ValueHostValidationState } from "@plblum/jivs-engine/build/Interfaces/ValidatableValueHostBase";
import { ValidationState } from "@plblum/jivs-engine/build/Interfaces/Validation";
import { IValueHostsManager } from "@plblum/jivs-engine/build/Interfaces/ValueHostsManager";


/**
 * Connected to ValueHostsManager.onTextValueChanged handler to route
 * the change to elements associated with the valueHost.
 * Its destination are ITextValueAdapters. 
 * Each element it finds must have its IJivsDomElement.jivsTextValueAdapter assigned
 * if it gets dispatched to.
 * 
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
export interface ITextValueDispatcher
{
    /**
     * Handles the onTextValueChanged callback directly, routing the change to
     * ITextValueAdapters. An element found must also have its 
     * IJivsDomElement.jivsTextValueAdapter assigned, and that adapter will be run.
     * @param valueHost 
     * @param oldTextValue 
     */
    dispatch(valueHost: IFieldValueHost, oldTextValue: string | undefined): void;
}

/**
 * Connected to ValueHostsManager.onValueChanged handler to route
 * the change to elements associated with the valueHost.
 * Its destination are IValueAdapters. 
 * Each element it finds must have its IJivsDomElement.jivsValueAdapter assigned
 * if it gets dispatched to.
 *
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
export interface IValueDispatcher
{
    /**
     * Handles the onValueChanged callback directly, routing the change to
     * IValueAdapters. An element found must also have its 
     * IJivsDomElement.jivsValueAdapter assigned, and that adapter will be run.
     * @param valueHost The host object containing the field's value.
     * @param oldValue The previous value of the field.
     */
    dispatch(valueHost: IFieldValueHost, oldValue: unknown): void;
}

/**
 * Connected to ValueHostsManager.onValueHostValidationStateChanged handler to route
 * the validation state change to elements associated with the valueHost.
 * Its destination are IFieldPresentation objects. 
 * Each element it finds must have its IJivsDomElement.jivsFieldPresentation assigned
 * if it gets dispatched to.
 * 
 * The dispatcher has the job of knowing how to query DOM to find those elements,
 * usually by using data attributes or other identifying markers on the DOM elements
 * against the IFieldValueHost.getElementIdentifier().
 */
export interface IFieldValidationDispatcher
{
    /**
     * Handles the onValueHostValidationStateChanged callback directly, routing the change to
     * IFieldPresentation objects. An element found must also have its 
     * IJivsDomElement.jivsFieldPresentation assigned, and that adapter will be run.
     * 
     * The dispatcher does not interpret validation groups. Group routing belongs 
     * to the installed form presentation.
     * 
     * Form dispatch does not invoke `IAriaService`. 
     * Form-role ARIA is static and is applied during installation.
     * 
     * @param valueHost The host object containing the field's value.
     * @param state The new validation state of the field.
     */
    dispatch(valueHost: IFieldValueHost, state: ValueHostValidationState): void;
}

/**
 * Connected to ValueHostsManager.onValidationStateChanged handler to route
 * the validation state change to the form as a whole.
 * Its destination are IFormPresentation objects.
 * Each element it finds must have its IJivsDomElement.jivsFormPresentation assigned
 * if it gets dispatched to.
 *
 * The dispatcher has the job of knowing how to query DOM to find the form element,
 * usually by using data attributes or other identifying markers on the DOM element
 * against the IValueHostsManager.getContainerIdentifier().
 */
export interface IFormValidationDispatcher
{
    /**
     * Handles the onValidationStateChanged callback directly, routing the change to
     * IFormPresentation objects. An element found must also have its 
     * IJivsDomElement.jivsFormPresentation assigned, and that adapter will be run.
     * @param valueHostsManager The manager containing the form's validation state.
     * @param state The new validation state of the form.
     */
    dispatch(valueHostsManager: IValueHostsManager, state: ValidationState): void;
}
/**
 * A Creator function type for creating dispatcher instances.
 * Used by IDispatcherService.
 * @template TDispatcher The type of dispatcher the factory will create.
 */
export type DispatcherCreator<TDispatcher> = () => TDispatcher;

/**
 * This service ensures that the correct dispatcher is attached to the appropriate DOM elements 
 * based on the ValueHostsManager provided.
 * Handles registration, creation, and ValueHostsManager callback assignment of Dispatchers.
 * IJivsDomServices.dispatcherService holds the one instance of this service.
 */
export interface IDispatcherService
{
    /**
     * Registers a factory function for creating text value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerTextValueChangedDispatcher(
        creator: DispatcherCreator<ITextValueDispatcher>): void;

    /**
     * Registers a factory function for creating value changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValueChangedDispatcher(
        creator: DispatcherCreator<IValueDispatcher>): void;

    /**
     * Registers a factory function for creating value host validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValueHostValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFieldValidationDispatcher>): void;

    /**
     * Registers a factory function for creating form validation state changed dispatchers.
     * Replaces any previously registered factory function for this type of dispatcher.
     * @param creator The factory function used to create the dispatcher instance.
     */
    registerValidationStateChangedDispatcher(
        creator: DispatcherCreator<IFormValidationDispatcher>): void;

    /**
     * Composite of using individual attach functions so you can have a one-call
     * solution to attachment. It always attaches onValidationState and onValueHostValidationState
     * because those are fundamental to the operation of the value hosts manager.
     * The decision of using onTextValueChanged and onValueChanged attachments is left to the caller.
     * @param useTextValue Whether to attach the text value changed dispatcher.
     * @param useNativeValue Whether to attach the native value changed dispatcher.
     */
    attach(valueHostsManager: IValueHostsManager, useTextValue?: boolean, useNativeValue?: boolean): void;

    /**
     * Attaches a ITextValueDispatcher to IValueHostsManager.onTextValueChanged callback.
     * This allows the dispatcher to respond to text value changes in the value hosts managed by the value hosts manager.
     * If onTextValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached ITextValueDispatcher instance, or null if none could be attached.
     */
    attachTextValueChanged(valueHostsManager: IValueHostsManager): ITextValueDispatcher | null;

    /**
     * Attaches a IValueDispatcher to IValueHostsManager.onValueChanged callback.
     * This allows the dispatcher to respond to value changes in the value hosts managed by the value hosts manager.
     * If onValueChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IValueDispatcher instance, or null if none could be attached.
     */
    attachValueChanged(valueHostsManager: IValueHostsManager): IValueDispatcher | null;

    /**
     * Attaches a IFieldValidationDispatcher to IValueHostsManager.onValueHostValidationStateChanged callback.
     * This allows the dispatcher to respond to value host validation state changes in the value hosts managed by the value hosts manager.
     * If onValueHostValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IFieldValidationDispatcher instance, or null if none could be attached.
     */
    attachValueHostValidationStateChanged(valueHostsManager: IValueHostsManager): IFieldValidationDispatcher | null;

    /**
     * Attaches a IFormValidationDispatcher to IValueHostsManager.onValidationStateChanged callback.
     * This allows the dispatcher to respond to form validation state changes in the value hosts managed by the value hosts manager.
     * If onValidationStateChanged already has a value, it will be retained and called before the newly attached dispatcher.
     * @param valueHostsManager The value hosts manager instance.
     * @returns The attached IFormValidationDispatcher instance, or null if none could be attached.
     */
    attachValidationStateChanged(valueHostsManager: IValueHostsManager): IFormValidationDispatcher | null;
}
