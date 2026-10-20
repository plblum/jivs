/**
 * ErrorMessageDisplayClickTrigger installs a trigger that opens the error message display 
 * when the display element is clicked.
 * @module jivs-dom/Presentations_common/ConcreteClasses/ErrorMessageDisplayClickTrigger
 */
import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

/**
 * Attaches the click event listener to the ErrorMessageDisplay element.
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
        context.jivsElement.addEventListener('click', (event) =>
        {
            context.controller.toggle(context, 0, 0);
        });        
    }
}