import { IJivsDomElement } from './IJivsDomElement';
import { IJivsDomServices } from './JivsDomServices';
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';

/**
 * Provides targets for invoking trigger actions on error message displays.
 * This interface is normally just implemented on the Triggered Presentation class for error message display.
 * 
 * ```ts
 * // context is already available
 * editor.addEventListener('focus', (event) => {
 *  context.controller.open(context, 500);
 * });
 * ```
 */
export interface IErrorMessageDisplayController
{
    /**
     * Requests the presentation to go into its open state.
     * @param delay The delay in milliseconds before attempting to open the presentation.
     * The UI experience may be improved by offering a slight delay before opening the presentation, 
     * allowing for smoother transitions and avoiding abrupt changes.
     * Note that delays impact later calls to open and close, as the timing of these operations may be affected by previously specified delays.
     */
    open(context: IErrorMessageDisplayTriggerContext, delay: number): void;

    /**
     * Requests the presentation to go into its closed state.
     * @param delay The delay in milliseconds before attempting to close the presentation.
     * The UI experience may be improved by offering a slight delay before closing the presentation, 
     * allowing for smoother transitions and avoiding abrupt changes.
     * Note that delays impact later calls to open and close, as the timing of these operations may be affected by previously specified delays.
     */
    close(context: IErrorMessageDisplayTriggerContext, delay: number): void;

    /**
     * Toggles the presentation between its open and closed states.
     * @param openDelay The delay in milliseconds before attempting to open the presentation.
     * @param closeDelay The delay in milliseconds before attempting to close the presentation.
     */
    toggle(context: IErrorMessageDisplayTriggerContext, openDelay: number, closeDelay: number): void;
}   

/**
 * Provides the context for error message display triggers, including references to the container element, 
 * content element, DOM services, value host, and the associated controller.
 */
export interface IErrorMessageDisplayTriggerContext
{
    readonly anchorElement: IJivsDomElement;
    readonly domServices: IJivsDomServices;
    readonly valueHost: IFieldValueHost;
    readonly controller: IErrorMessageDisplayController;

    dispose(): void;
}

/**
 * The Trigger classes install event listeners or other mechanisms to respond to user interactions
 * and invoke actions on the error message display.
 * Their install method is expected to run once per instance, on the first call to FieldPresentation.apply().
 * 
 * A trigger may establish event listeners on:
 * - The editor widget itself. Uses context.anchorElement.jivsEditorAdapterDefinition.attachEventHandler() to attach event listeners.
 *   Likely listeners: focus and blur.
 * - The container element that holds the error message display. Uses DOM addEventListener to attach event listeners.
 *   Likely listeners: click, mouseover, focus. These may have to setup event delegation or additional logic to properly handle interactions.
 */
export interface IErrorMessageDisplayTrigger
{
    /**
     * Attach an event listener or other mechanism to respond to user interactions and invoke actions on the error message display.
     * For editors, use context.anchorElement to access the EditorAdapterDefinition and call its attachEventHandler().
     * For other roles, use context.anchorElement to attach event listeners directly using the DOM addEventListener mechanism.
     * @param context The context for the error message display trigger, 
     * providing access to the container element, content element, DOM services, value host, and controller.
     */
    install(context: IErrorMessageDisplayTriggerContext): void;
}

/**
 * Represents the possible states of a trigger controlling the error message display.
 * Consumed by IErrorMessageDisplayControllers.
 */
export enum TriggerState
{
    closed,
    opening,
    open,
    closing
}
