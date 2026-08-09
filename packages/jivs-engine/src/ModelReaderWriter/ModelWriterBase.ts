/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/AbstractClasses
 * 
 */
import { ValueAdapterRule } from '../Interfaces/ValueAdapterService';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { IModelWriter } from '../Interfaces/ModelReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ModelReaderWriterBase } from './ModelReaderWriterBase';

/**
 * Base class for model writers. It writes to the model's properties from the ValueHosts.
 *
 * See {@link jivs-engine/ModelReaderWriter/Types!IModelWriter} for details.
 *
 * - Supports objects and arrays as the model.
 * - Uses the ValueAdapterService to determine if a value should be adjusted or skipped when writing to the model.
 * - Uses the ObjectFinder to find the value of a model property using a path syntax.
 */

export abstract class ModelWriterBase<T extends object>
    extends ModelReaderWriterBase<T>
    implements IModelWriter
{
    /**
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param model
     */
    constructor(valueHostsManager: IValueHostsManager, model: T)
    {
        super(valueHostsManager, model);
    }

    /**
     * Writes the data from the ValueHostsManager to the external source.
     * It uses the FieldValueHostConfig to determine how to write the data and convert it to the correct type.
     * In particular, dataType to ensure the value is converted to the correct type.
     * It writes to the log for each field written, and logs errors if any occur.
     * Invalid values are handled by the ValueAdapterService and the error message is logged.
     * They do not throw errors, but log them and continue writing the rest of the fields.
     */
    public writeToModel(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator)
        {
            let valueHost = vh as IFieldValueHost;
            this.writeToProperty(valueHost);
        }
    }

    /**
     * Writes the value from the given ValueHost to the specified model property.
     * Apply the rules to adjust or skip the value before writing it to the model.
     *
     * @param source The ValueHost containing the value to write.
     * @param modelPropertyName The name of the model property to write to.
     * When not provided, it is resolved from the ValueHost's FieldValueHostConfig.propertyName or ValueHostConfig.name.
     */
    public writeToProperty(source: IFieldValueHost, modelPropertyName?: string): boolean 
    {
        if (!modelPropertyName) {
            modelPropertyName = source.getPropertyName();
            if (!modelPropertyName) 
                return false;   // rare case: no property name to write to
        }
        let valueHostName = source.getName();
        this.logger.message(LoggingLevel.Debug, () => `Preparing to move value from ValueHost '${ valueHostName }' to model property '${ modelPropertyName }'.`);

        return this.setValueWithRule(source, modelPropertyName);
    }

    /**
     * Gets the value from the source, applies the rules, and sets it into the model property if appropriate.
     * @param source The source ValueHost to get the value from.
     * @param modelPropertyName The name of the model property to set.
     * @returns True if the value was successfully written, false otherwise.
     */
    public setValueWithRule(source: IFieldValueHost, modelPropertyName: string): boolean
    {
        let modelPropertyValue = source.getValue();
        let rule = this.getRule(source);
        if (rule)
        {
            let result = this.adjustValueByRule(modelPropertyValue, rule, source);
            if (result.skip)
                return false;
            modelPropertyValue = result.value;
        }

        // special case: if the value is undefined and there is no rule, we take no action
        else if (rule === undefined && modelPropertyValue === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `ValueHost '${ source.getName() }' has no value and no rule applied to Model property '${ modelPropertyName }'.`);
            return false;
        }
        this.setValueIntoModel(modelPropertyName, modelPropertyValue, source);
        this.logger.message(LoggingLevel.Info, () => `Model property '${ modelPropertyName }' value was assigned from ValueHost '${ source.getName() }'.`);
        return true;
    }

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
    protected getRule(valueHost: IFieldValueHost): ValueAdapterRule | undefined
    {
        return valueHost.getModelWriterRule();
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
        let result = this.services.objectFinderService.find(this.model, modelPropertyName);
        if (result.object === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Model property '${ result.propertyName }' does not exist in the model.`);
            return;
        }
        // if the object is a class instance, we confirm that the property exists on the class
        // and log an error if it does not.
        // If the object is a plain object, we allow the property to be created if it does not exist.
        if (result.object.constructor !== Object && !(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Error, () => `Specified property '${ result.propertyName }' does not exist in the model. It will not be set.`);
            return;
        }
        else if (!(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Info, () => `Specified property '${ result.propertyName }' does not exist in the model. It will be created.`);
        }
        (result.object as any)[result.propertyName as string] = value;
    }
}
