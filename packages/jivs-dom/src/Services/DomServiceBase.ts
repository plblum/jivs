/**
 * 
 * @module jivs-dom/Services/AbstractClasses/DomServiceBase
 */

import { assertNotNull } from '@plblum/jivs-engine/build/Utilities/ErrorHandling';
import { LoggingFacade } from '@plblum/jivs-engine/build/Utilities/LoggingFacade';
import { IJivsDomServices } from '../Interfaces/JivsDomServices';


/**
 * Base class to develop services found in IJivsDomServices.
 * Ensures that it exposes IJivsDomServices and provides a consistent logging mechanism for derived services.
 */
export abstract class DomServiceBase
{
    constructor(domServices: IJivsDomServices)
    {
        assertNotNull(domServices, 'domServices');
        this._domServices = domServices;
    }

    protected get domServices(): IJivsDomServices
    {
        return this._domServices;
    }
    private _domServices: IJivsDomServices;

    /**
     * Provides an API for logging, sending entries to the loggingService.
     * @param services 
     * @returns 
     */
    protected logger(): LoggingFacade
    {
        if (!this._logger)
            this._logger = new LoggingFacade(
                this.domServices.services.loggingService,
                'Dom', this, this.serviceIdentity);
        return this._logger;
    }
    private _logger: LoggingFacade | null = null;
    protected get serviceIdentity(): string
    {
        return this.constructor.name;
    }
}