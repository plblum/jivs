import { IErrorMessageDisplayTrigger, IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';

/**
 * Attaches the mouseover event listener to the Anchor element to trigger the error message display popup.
 * Always opens without a delay.
 */
export abstract class ErrorMessageDisplayTriggerBase implements IErrorMessageDisplayTrigger
{
    constructor(delay: number)
    {
        this._delay = delay;
    }

    /**
     * Gets the delay in milliseconds before the popup is triggered on mouseover.
     */
    protected get delay(): number
    {
        return this._delay;
    }
    private _delay: number = 0;

    /**
     * Typically calls attachEventToOpen or attachEventToClose to attach the appropriate event listeners.
     * @param context 
     */
    public abstract install(context: IErrorMessageDisplayTriggerContext): void;
    
    /**
     * Attaches the mouseover event listener to the Anchor element.
     * @param context 
     */
    public attachEventToOpen(eventName: string, context: IErrorMessageDisplayTriggerContext): void
    {
        context.anchorElement?.addEventListener(eventName, () => context.controller.open(context, this.delay));
    }
    public attachEventToClose(eventName: string, context: IErrorMessageDisplayTriggerContext): void
    {
        context.anchorElement?.addEventListener(eventName, () => context.controller.close(context, this.delay));
    }
}