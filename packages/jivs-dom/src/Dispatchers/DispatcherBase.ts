/**
 * Base class for all dispatchers, providing common functionality such as logging.
 * 
 * @module jivs-dom/Dispatchers/AbstractClasses/DispatcherBase
 */
import { IFieldValueHost } from '@plblum/jivs-engine/build/Interfaces/FieldValueHost';
import { LoggingLevel } from '@plblum/jivs-engine/build/Interfaces/LoggingService';
import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';

/**
 * Base class for all dispatchers in the system.
 * It includes access to domServices and a log() function for consistent logging across all dispatchers.
 */
export abstract class DispatcherBase
{
    constructor(domServices: IJivsDomServices)
    {
        assertNotNull(domServices, 'domServices');
        this._domServices = domServices;
    }
    private _domServices: IJivsDomServices;
    protected get domServices(): IJivsDomServices
    {
        return this._domServices;
    }

    /**
     * Log wrapper around the Jivs logging service to prepare log details in addition
     * to the message itself. The message supports tokens of `{element}` and `{valuehost}` 
     * which will be replaced with the source element's identifier 
     * and the target FieldValueHost's name, respectively.
     * @param loggingLevel 
     * @param message 
     * @param anchor 
     * @param valueHost 
     */
    protected log(
        loggingLevel: LoggingLevel,
        message: string,
        anchor: HTMLElement | null, valueHost: IFieldValueHost | null): void
    {
        this.domServices.loggingFacade.log(
            loggingLevel,
            (facade) =>
            {
                return facade.prepareLogDetails(message, anchor, valueHost, this);
            });
    }
   
}