import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

/**
 * Attaches the mouseout event listener to the Anchor element to trigger the error message display popup.
 * Always opens without a delay.
 */
export class ErrorMessageDisplayMouseOutTrigger extends ErrorMessageDisplayTriggerBase
{
    constructor(delay: number)
    {
        super(delay);
    }

    /**
     * Attaches the mouseout event listener to the Anchor element.
     * @param context 
     */
    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToClose('mouseout', context);
    }
}