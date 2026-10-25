/**
 * @inheritdoc jivs-engine/ReaderWriter/Types
 * @module jivs-engine/ReaderWriter/AbstractClasses
 */

import { ValueAdapterResolution, ValueAdapterRule } from '../Interfaces/ValueAdapterService';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IJivsServices } from '../Interfaces/JivsServices';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { LoggingFacade } from '../Utilities/LoggingFacade';

/**
 * Base class for Readers and Writers.
 * 
 * @typeParam T - The type of the external data container (e.g., model) being read or written.
 * It can be a model, or other structured data container, or even
 * a class containing the data.
 */
export abstract class ReaderWriterBase<T extends object> 
{
    /**
     * 
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param externalData - The external data container to read from or write to.
     * It can be a model, or other structured data container, or even
     * a class containing the data.
     */
    constructor(valueHostsManager: IValueHostsManager, externalData: T)
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(externalData, 'externalData');
        this._valueHostsManager = valueHostsManager;
        this._services = valueHostsManager.services;
        this._externalData = externalData;
    }

    /**
     * The destination for the values read from the model. The ValueHosts are used to store the values.
     */
    protected get valueHostsManager(): IValueHostsManager
    {
        return this._valueHostsManager;
    }
    private _valueHostsManager: IValueHostsManager;
    
    /**
     * The external data that is being read or written. It can be a class instance or a plain object.
     * Subclasses determine how to utilize it.
     * The external data's properties are read and written to the ValueHosts.
     * Treat this object as read-only.
     */
    protected get externalData(): T
    {
        return this._externalData;
    }
    private _externalData: T;

    protected get services(): IJivsServices
    {
        return this._services;
    }
    private _services: IJivsServices;

    /**
     * Provides an API for logging, sending entries to the loggingService.
     */
    protected get logger(): LoggingFacade
    {
        if (!this._logger)
            this._logger = new LoggingFacade(this.services.loggingService,
                this.constructor.name, this, null, true);
        return this._logger;
    }
    private _logger: LoggingFacade | null = null;

    /**
     * Evaluate the value of the field on the external data and any rule that applies to it.
     * Return either the original value, the adjusted value, or a skip flag indicating the value 
     * should not be assigned to the ValueHost.
     * @param fieldValue - The value of the field on the external data. Field can also be: property, attribute or similar.
     * @param rule 
     * @param valueHost - while not used by ValueAdapterService, it is provided for subclasses that may need to use it.
     * @returns An object with either skip: true, or adjustedValue: any. 
     * If skip is true, the value will be ignored.
     */
    protected adjustValueByRule(fieldValue: any,
        rule: ValueAdapterRule, valueHost: IFieldValueHost): ValueAdapterResolution
    {
        return this.services.valueAdapterService.resolve(fieldValue, rule);
    }
}
