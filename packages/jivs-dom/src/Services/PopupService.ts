import { IErrorMessageDisplayController } from '../Interfaces/ErrorMessageDisplayPresentation';
import { IPopupService, TriggerContextFactory } from '../Interfaces/PopupService';

/**
 * A service responsible for managing popups associated with FieldPresentations 
 * that implement IErrorMessageDisplayController such as TriggeredErrorMessageDisplayPresentationBase.
 * Those FieldPresentations should register themselves with this service to ensure proper popup management.
 * An instance of this service gets attached to ValueHostsManager using the metadata feature.
 * JivsDomService.getPopupService(valueHostsManager) creates the instance and retrieves it.
 * 
 */
export class PopupService implements IPopupService
{
    /**
     * Registers a popup error message display controller with the service.
     * ```ts
     * popupService.register(controller, ()=> this.createTriggerContext(valueHost));
     * ```
     * @param controller The error message display controller to register.
     * @param contextFactory A factory function that provides the trigger context for the controller.
     */
    public register(controller: IErrorMessageDisplayController, contextFactory: TriggerContextFactory): void
    {
        this._registeredControllers.set(controller, contextFactory);
    }

    private _registeredControllers: Map<IErrorMessageDisplayController, TriggerContextFactory> = new Map();

    /**
     * Prepares the specified popup error message display controller to be opened
     * by invoking the close method on all others.
     * @param controller The error message display controller to prepare for opening.
     */
    public prepareToOpen(controller: IErrorMessageDisplayController): void
    {
        for (const [ctrl, contextFactory] of this._registeredControllers.entries()) {
            if (ctrl !== controller) {
                const context = contextFactory();
                try {
                    ctrl.close(context, 0);
                } finally {
                    context.dispose();
                }
            }
        }
    }
    /**
     * Developer utility to close all currently open popup error message displays.
     */
    public closePopups(): void
    {
        for (const [ctrl, contextFactory] of this._registeredControllers.entries()) {
            const context = contextFactory();
            try {
                ctrl.close(context, 0);
            } finally {
                context.dispose();
            }
        }
    }
    /**
     * Disposes the popup service, releasing any resources and references it holds.
     * By being tied to ValueHostsManager and having a dispose method,
     * this gets called during the disposal of the ValueHostsManager it is attached to.
     */
    public dispose(): void
    {
        try {
            this.closePopups();
        } finally {
            this._registeredControllers.clear();
        }
    }
    
}