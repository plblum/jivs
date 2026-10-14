import { IErrorMessageDisplayTriggerContext, IErrorMessageDisplayController } from './ErrorMessageDisplayPresentation';
import { IJivsDomServices } from './JivsDomServices';

export type TriggerContextFactory = () => IErrorMessageDisplayTriggerContext;

/**
 * Service interface for managing popup error message displays.
 * It is associated with a single ValueHostsManager using its metadata
 * and managed by IJivsDomServices.getPopupService().
 * 
 * Its built around presentations that implement IErrorMessageDisplayController, 
 * which popup error message displays are managed. Those popups need to be closed
 * external from the presentation in these use cases:
 * - The developer wants to remove any popup present.
 * - A popup already exists when another Presentation attempts to open a new one. 
 *   It needs to close the existing popup first.
 */
export interface IPopupService
{
    /**
     * Registers a popup error message display controller with the service.
     * ```ts
     * popupService.register(controller, ()=> this.createTriggerContext(valueHost));
     * ```
     * @param controller The error message display controller to register.
     * @param contextFactory A factory function that provides the trigger context for the controller.
     */
    register(controller: IErrorMessageDisplayController, contextFactory: TriggerContextFactory): void;

    /**
     * Unregisters a popup error message display controller from the service.
     * @param controller The error message display controller to unregister.
     */
    unregister(controller: IErrorMessageDisplayController): void;
    /**
     * Prepares the specified popup error message display controller to be opened
     * by invoking the close method on all others.
     * @param controller The error message display controller to prepare for opening.
     */
    prepareToOpen(controller: IErrorMessageDisplayController): void;
    /**
     * Developer utility to close all currently open popup error message displays.
     */
    closePopups(): void;
    /**
     * Disposes the popup service, releasing any resources and references it holds.
     */
    dispose(): void;
}

/**
 * Interface representing a popup mechanism responsible for displaying popup error messages.
 * It handles the positioning, creation, opening, and closing of popup contexts.
 * Implementations of this interface manage the actual DOM elements and presentation logic for popups.
 * 
 * The idea is to ensure jivs-dom does not require a specific 3rd party popup library.
 * Instead, we can offer additional NPM packages or implementations for different popup libraries 
 * without tightly coupling jivs-dom to any specific one.
 * 
 * It operates without any more knowledge of the PopupErrorMessageDisplayPresentation 
 * than whats on the Controller itself. It does not care about properties of the Context
 * managed by the presentation, like anchorElement.
 * 
 * IJivsDomServices.popupMechanism provides access to the currently configured popup mechanism.
 * It is a singleton that must be fully setup during app initialization.
 */
export interface IPopupMechanism
{
    /**
     * Creates an implementation of IPopupContext, initialized with what it knows at the time of creation,
     * including establishing values taken from the provided options.
     * @param options Optional configuration options for creating the popup context.
     * It should include positioning requirements and any styling information needed for the popup.
     * While this object is untyped here, it will really be strongly typed, and left untyped here
     * to avoid tying this interface to a specific type definition.
     * Options are supplied to PopupErrorMessageDisplayPresentation in its options parameter.
     */
    createContext(options?: object): IPopupContext;

    /**
     * Opens the specified popup context, making it visible to the user.
     * It is called by PopupErrorMessageDisplayPresentation when it wants to show the popup.
     * It should capture exceptions and return false as a result.
     * @param context The popup context to open. It should have been created by the popup mechanism.
     * @returns A boolean indicating whether the popup was successfully opened.
     * If true, PopupErrorMessageDisplayPresentation finishes establishing its own opened state,
     * including setting jivs-open and jivs-popup-open classes on the relevant elements.
     */
    open(context: IPopupContext): boolean;

    /**
     * Closes the specified popup context, hiding it from the user.
     * The popup mechanism can also close the popup through other means. If it does,
     * it must call context.controller.closed() to notify the presentation that the popup has been closed.
     * It should capture exceptions and return false as a result.
     * @param context The popup context to close. It should have been created by the popup mechanism.
     * @returns A boolean indicating whether the popup was successfully closed.
     */
    close(context: IPopupContext): boolean;

    /**
     * Releases mechanism-wide resources and any resources left over from failed closures. 
     * It does not dispose presentation-owned contexts.
     */
    dispose(): void;
}

/**
 * Shared data exchanged with popup mechanisms.
 * Provides data to 3 systems:
 * - The presentation that triggers the popup.
 * - The popup mechanism responsible for displaying the popup.
 * - The service managing the popup lifecycle.
 * Presentation requests an instance from PopupMechanism
 * and retains it from open to close, disposing it upon close.
 */
export interface IPopupContext
{
    /**
     * Generated by the MessageFrame to be the entire content shown by the popup
     * within its own frame. (That frame may have borders and close buttons.)
     * PopupErrorMessageDisplayPresentation will update it on apply().
     * The instance will be owned by IPopupMechanism, usually added into its own HTML.
     * Presentation may assign its own CSS classes to it. Popups use jivs-popup-open 
     * to indicate their open state.
     */
    messageFrameContent: HTMLElement | null;
    /**
     * Element to which the popup should be anchored.
     * Used for positioning the popup relative to the Anchor element.
     * It is often the PopupErrorMessageDisplayPresentation element itself.
     * It requires an element.
     */
    anchorElement: HTMLElement | null;

    /**
     * The error message display controller associated with this popup context.
     * It allows the popup mechanism to interact with the controller.
     * It is typically an implementation of TriggeredErrorMessageDisplayPresentationBase.
     */
    controller: IErrorMessageDisplayController | null;
    /**
     * The DOM services interface providing utility methods for DOM manipulation.
     */
    domServices: IJivsDomServices | null;

    /**
     * Disposes the popup context, releasing any resources and references it holds.
     * Assists in faster garbage collection by detaching references to DOM elements
     * and nulling references.
     */
    dispose(): void;
}