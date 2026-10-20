import type { IErrorMessageDisplayController } from '../../src/Interfaces/ErrorMessageDisplayPresentation';
import type { IPopupService, TriggerContextFactory } from '../../src/Interfaces/PopupErrorMessageDisplays';

export interface IRecordedPopupRegistration
{
    controller: IErrorMessageDisplayController;
    contextFactory: TriggerContextFactory;
}

export class RecordingPopupService implements IPopupService
{
    public registerCalls: IRecordedPopupRegistration[] = [];
    public unregisterCalls: IErrorMessageDisplayController[] = [];
    public prepareToOpenCalls: IErrorMessageDisplayController[] = [];
    public prepareToOpenAction?: (controller: IErrorMessageDisplayController) => void;

    public register(controller: IErrorMessageDisplayController, contextFactory: TriggerContextFactory): void
    {
        this.registerCalls.push({ controller: controller, contextFactory: contextFactory });
    }

    public unregister(controller: IErrorMessageDisplayController): void
    {
        this.unregisterCalls.push(controller);
    }

    public prepareToOpen(controller: IErrorMessageDisplayController): void
    {
        this.prepareToOpenCalls.push(controller);
        this.prepareToOpenAction?.(controller);
    }

    public closePopups(): void
    {
    }

    public dispose(): void
    {
    }
}
