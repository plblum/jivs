import type { IPopupContext, IPopupMechanism } from '../../src/Interfaces/PopupErrorMessageDisplays';
import { PopupContext } from '../../src/FieldPresentations/PopupContext';

export class RecordingPopupContext extends PopupContext
{
    public disposeCalls: number = 0;

    public override dispose(): void
    {
        this.disposeCalls++;
        super.dispose();
    }
}

export class RecordingPopupMechanism implements IPopupMechanism
{
    public createCalls: Array<{ options?: object }> = [];
    public createdContexts: RecordingPopupContext[] = [];
    public contexts: RecordingPopupContext[] = this.createdContexts;
    public openCalls: IPopupContext[] = [];
    public closeCalls: IPopupContext[] = [];
    public openResult: boolean = true;
    public closeResult: boolean = true;
    public closeError: unknown = null;
    public closeControllerOnSuccess: boolean = true;

    public createContext(options?: object): IPopupContext
    {
        this.createCalls.push({ options: options });
        let context = new RecordingPopupContext();
        this.createdContexts.push(context);
        return context;
    }

    public open(context: IPopupContext): boolean
    {
        this.openCalls.push(context);
        return this.openResult;
    }

    public close(context: IPopupContext): boolean
    {
        this.closeCalls.push(context);
        if (this.closeError !== null)
            throw this.closeError;
        if (this.closeResult && this.closeControllerOnSuccess)
            context.controller?.closed();
        return this.closeResult;
    }

    public dispose(): void
    {
    }
}
