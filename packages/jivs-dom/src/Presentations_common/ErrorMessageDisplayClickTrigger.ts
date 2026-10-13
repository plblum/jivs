import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

/**
 * Attaches the click event listener to the anchor element.
 * Always opens without a delay.
 */
export class ErrorMessageDisplayClickTrigger extends ErrorMessageDisplayTriggerBase
{
    constructor()
    {
        super(0);
    }

    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToOpen('click', context);
    }
}