import { IErrorMessageDisplayTriggerContext } from '../Interfaces/ErrorMessageDisplayPresentation';
import { ErrorMessageDisplayTriggerBase } from './ErrorMessageDisplayTriggerBase';

export class ErrorMessageDisplayKeyAsClickTrigger extends ErrorMessageDisplayTriggerBase
{
    constructor()
    {
        super(0);
    }
    /**
     * Attaches the keydown event listener to the ErrorMessageDisplay element.
     * @param context 
     */
    public install(context: IErrorMessageDisplayTriggerContext): void
    {
        // directly attach the keydown event to the element
        // with its handler checking keypress for key = ENTER or SPACE
        // to invoke context.open() when the key is ENTER or SPACE.
        context.jivsElement.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                context.jivsElement.click();
            }
        });
    }
}