import { IErrorMessageDisplayTriggerContext, IErrorMessageDisplayController } from './ErrorMessageDisplayPresentation';

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