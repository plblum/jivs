/**
 * @inheritdoc jivs-engine/Interfaces/ModelReaderAndWriter
 * @model jivs-engine/AbstractClasses/ModelWriterBase
 */

import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IJivsServices } from '../Interfaces/JivsServices';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { IModelWriter, IObjectFinder, ModelReaderWriterRule } from '../Interfaces/ModelReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { LoggerFacade } from '../Utilities/LoggerFacade';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ObjectFinder } from './ObjectFinder';

/**
 * Base class for model writers. It writes to the model's properties from the ValueHosts.
 * 
 * See {@link jivs-engine/Types/ModelReaderAndWriter!IModelWriter} for details.
 * 
 * Supports objects and arrays as the model.
 * 
 * Works together with the ModelWriterRuleService on JivsServices to handle
 * rules for writing values to the model or skipping them. 
 * See {@link jivs-engine/Types/ModelReaderAndWriter!IModelReaderWriterRuleService} for details.
 * 
 * Uses a syntax for the FieldValueHostConfig.propertyName that can find child elements:
 * - "name" - resolves to a property on the model object
 * - "[0].name" requires the model to be an array, and resolves to the first element of that array.
 * - "name1.name2" - property name1 in the model contains a child with property name2.
 * - "name1[0].name2" - property name1 in the model contains a child that is an array, 
 *    and the first element of that array contains a property name2.
 * - "name1.name2.name3" - property name1 in the model contains a child with property name2, which contains a child with property name3.
 */
export abstract class ModelWriterBase<T extends object> implements IModelWriter
{
    /**
     * @param valueHostsManager - The manager for the ValueHosts. 
     * @param model 
     * @param skipValueChangedCallback - See {@link ModelReaderBase.skipValueChangedCallback} for details.
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
                'modelwriter', this, null, true);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;

    /**
     * Writes the data from the ValueHostsManager to the external source.
     * It uses the FieldValueHostConfig to determine how to write the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field written, and logs errors if any occur.
     * Invalid values are handled by the ModelWriterRuleService and the error message is logged.
     * They do not throw errors, but log them and continue writing the rest of the fields.
     */
    public write(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator) {
            let valueHost = vh as IFieldValueHost;
            let modelPropertyName = valueHost.getPropertyName();
            if (!modelPropertyName)
                continue;   // very unlikely since its value defaults to ValueHostConfig.name. So we don't waste code logging

            let valueHostName = valueHost.getName();
            this.logger.message(LoggingLevel.Debug, () => `Preparing to move value from ValueHost '${ valueHostName }' to model property '${ modelPropertyName }'.`);
            let valueFromHost = valueHost.getValue();
            let modelPropertyValue = valueFromHost;
            let rule = this.getRule(valueHost);
            if (rule)
            {
                let result = this.adjustValueByRule(modelPropertyName, modelPropertyValue, rule, valueHost);
                if (result.skip)
                    continue;
                modelPropertyValue = result.adjustedValue;
            }
            // special case: if the value is undefined and there is no rule, we take no action
            else if (rule === undefined && modelPropertyValue === undefined)
            {
                this.logger.message(LoggingLevel.Warn, () => `ValueHost '${ valueHostName }' has no value and no rule applied to Model property '${ modelPropertyName }'.`);
                continue;
            }
        }
    }
    /**
     * Note that we don't have services support for IObjectFinder, but the user can subclass this
     * for alternative syntaxes.
     */
    protected get objectFinder(): IObjectFinder
    {
        if (!this._objectFinder)
            this._objectFinder = new ObjectFinder();
        return this._objectFinder;
    }
    private _objectFinder: IObjectFinder | null = null;
    
    /**
     * Resolve the rule for adjusting or omitting the value of the model property.
     * This class uses valueHost.getModelWriterRule() to get the rule.
     * 
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * Often subclasses are used to avoid the need to setup rules directly in
     * FieldValueHostConfig.modelWriterRule.
     * 
     * @param valueHost 
     * @returns The rule for the model property, or undefined if no rule applies.
     */
    protected getRule(valueHost: IFieldValueHost): ModelReaderWriterRule | undefined
    {
        return valueHost.getModelWriterRule();
    }

    /**
     * With a known model property name, value and rule, evaluate and return
     * either the original value, the adjusted value, or a skip flag indicating the value 
     * should not be assigned to the model.
     * @param modelPropertyName 
     * @param modelPropertyValue 
     * @param rule 
     * @param valueHost 
     * @returns An object with either skip: true, or adjustedValue: any. 
     * If skip is true, the value will be ignored.
     */
    protected adjustValueByRule(modelPropertyName: string, modelPropertyValue: any,
        rule: ModelReaderWriterRule, valueHost: IFieldValueHost): { skip?: boolean, adjustedValue?: any; }
    {
        return this.services.modelWriterRuleService.resolve(
            modelPropertyName, modelPropertyValue, rule, valueHost, 'Writer');
    }    

    /**
     * Write the value to the model property. This is called after the value has been adjusted by the rule.
     * It assumes the value is valid and can be assigned to the model property.
     * It assumes that any child objects or arrays have already been created and are ready to receive the value.
     * 
     * @param modelPropertyName The name of the model property to set. This is in a syntax
     * supported by ObjectFinder, which can find child elements in objects and arrays.
     * @param value The value to assign to the model property, including undefined if supplied.
     * @param valueHost The value host providing the value.
     */
    protected setValueIntoModel(modelPropertyName: string, value: any, valueHost: IFieldValueHost): void
    {
        let result = this.objectFinder.find(this.model, modelPropertyName);
        if (result.object === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Model property '${ result.propertyName }' does not exist in the model.`);
            return;
        }
        (result.object as any)[result.propertyName as string] = value;
        
    }
}