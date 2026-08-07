/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/AbstractClasses
 */

import { DataCleanupResolution, DataCleanupRule } from '../Interfaces/DataCleanupService';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IJivsServices } from '../Interfaces/JivsServices';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { LoggerFacade } from '../Utilities/LoggerFacade';

/**
 * Base class for ModelReader and ModelWriter.
 */
export abstract class ModelReaderWriterBase<T extends object> 
{
    /**
     * 
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param model - The model object to be read.
     */
    constructor(valueHostsManager: IValueHostsManager, model: T)
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(model, 'model');
        this._valueHostsManager = valueHostsManager;
        this._services = valueHostsManager.services;
        this._model = model;
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
     * The model object that is being read. It can be a class instance or a plain object.
     * The model's properties are read and written to the ValueHosts.
     * Treat this object as read-only.
     */
    protected get model(): T
    {
        return this._model;
    }
    private _model: T;

    protected get services(): IJivsServices
    {
        return this._services;
    }
    private _services: IJivsServices;

    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.services.loggerService,
                this.constructor.name, this, null, true);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;

    /**
     * Evaluate the value of the model property and any rule that applies to it.
     * Return either the original value, the adjusted value, or a skip flag indicating the value 
     * should not be assigned to the ValueHost.
     * @param modelPropertyValue 
     * @param rule 
     * @param valueHost - while not used by DataCleanupService, it is provided for subclasses that may need to use it.
     * @returns An object with either skip: true, or adjustedValue: any. 
     * If skip is true, the value will be ignored.
     */
    protected adjustValueByRule(modelPropertyValue: any,
        rule: DataCleanupRule, valueHost: IFieldValueHost): DataCleanupResolution
    {
        return this.services.dataCleanupService.resolve(modelPropertyValue, rule);
    }
}
