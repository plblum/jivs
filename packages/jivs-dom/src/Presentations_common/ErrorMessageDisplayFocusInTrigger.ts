import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

/**
 * Attaches the focusin event listener to the ErrorMessageDisplay element to trigger the error message display popup.
 * Always opens without a delay.
 */
export class ErrorMessageDisplayFocusInTrigger extends ErrorMessageDisplayTriggerBase
{
    constructor(delay: number)
    {
        super(delay);
    }
    /**
     * Attaches the focusin event listener to the ErrorMessageDisplay element.
     * @param context 
     */
    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToOpen('focusin', context);
    }
}