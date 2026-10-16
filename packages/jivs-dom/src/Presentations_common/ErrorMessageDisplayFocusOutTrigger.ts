/**
 * ErrorMessageDisplayFocusOutTrigger installs a trigger that closes the error message display 
 * when the display element loses focus.
 * @module jivs-dom/Presentations_common/ConcreteClasses/ErrorMessageDisplayFocusOutTrigger
 */
import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

/**
 * Attaches the focusout event listener to the ErrorMessageDisplay element to trigger the error message display popup.
 * Always opens without a delay.
 */
export class ErrorMessageDisplayFocusOutTrigger extends ErrorMessageDisplayTriggerBase
{
    constructor(delay: number)
    {
        super(delay);
    }
    /**
     * Attaches the focusout event listener to the ErrorMessageDisplay element.
     * @param context 
     */
    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        this.attachEventToClose('focusout', context);
    }
}