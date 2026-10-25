/**
 * @inheritdoc jivs-engine/ReaderWriter/Types
 * @module jivs-engine/ReaderWriter/AbstractClasses
 * 
 */
import { ValueAdapterRule } from '../Interfaces/ValueAdapterService';
import { IFieldValueHost } from '../Interfaces/FieldValueHost';
import { LoggingLevel } from '../Interfaces/LoggingService';
import { IWriter } from '../Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ReaderWriterBase } from './ReaderWriterBase';

/**
 * Base class for writers. Reads from the ValueHosts and writes to the external data's fields.
 *
 * See {@link jivs-engine/ReaderWriter/Types!IWriter} for details.
 *
 * - Supports objects and arrays as the model.
 * - Uses the ValueAdapterService to determine if a value should be adjusted or skipped when writing to the external data.
 * - Uses the ObjectFinder to find the value of a model property using a path syntax.
 * 
 * @typeParam TExternalData - The type of the external data object that this writer will write to.
 */

export abstract class WriterBase<TExternalData extends object>
    extends ReaderWriterBase<TExternalData>
    implements IWriter
{
    /**
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param model
     */
    constructor(valueHostsManager: IValueHostsManager, model: TExternalData)
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
    public write(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator)
        {
            let valueHost = vh as IFieldValueHost;
            this.writeField(valueHost);
        }
    }

    /**
     * Writes the fieldvalue from the given ValueHost to the external data.
     * Apply the rules to adjust or skip the value before writing it to the external data.
     *
     * @param source The ValueHost containing the value to write.
     * @param fieldName The name of the external data field to write to.
     * When not provided, it is resolved from the ValueHost's FieldValueHostConfig.propertyName or ValueHostConfig.name.
     */
    public writeField(source: IFieldValueHost, fieldName?: string): boolean 
    {
        if (!fieldName) {
            fieldName = source.getPropertyName();
            if (!fieldName) 
                return false;   // rare case: no property name to write to
        }
        let valueHostName = source.getName();
        this.logger.message(LoggingLevel.Debug, () => `Preparing to move value from ValueHost '${ valueHostName }' to field '${ fieldName }'.`);

        return this.setValueWithRule(source, fieldName);
    }

    /**
     * Gets the value from the source, applies the rules, and sets it into the external data field if appropriate.
     * @param source The source ValueHost to get the value from.
     * @param fieldName The name of the external data field to set.
     * @returns True if the value was successfully written, false otherwise.
     */
    public setValueWithRule(source: IFieldValueHost, fieldName: string): boolean
    {
        let fieldValue = source.getValue();
        let rule = this.getRule(source);
        if (rule)
        {
            let result = this.adjustValueByRule(fieldValue, rule, source);
            if (result.skip)
                return false;
            fieldValue = result.value;
        }

        // special case: if the value is undefined and there is no rule, we take no action
        else if (rule === undefined && fieldValue === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `ValueHost '${ source.getName() }' has no value and no rule applied to field '${ fieldName }'.`);
            return false;
        }
        this.setValueIntoExternalData(fieldName, fieldValue, source);
        this.logger.message(LoggingLevel.Info, () => `Field '${ fieldName }' value was assigned from ValueHost '${ source.getName() }'.`);
        return true;
    }

    /**
     * Resolve the rule for adjusting or omitting the field value.
     * This class uses valueHost.getWriterRule() to get the rule for the field.
     *
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * Often subclasses are used to avoid the need to setup rules directly in
     * FieldValueHostConfig.writerRule.
     *
     * @param valueHost
     * @returns The rule for the field, or undefined if no rule applies.
     */
    protected getRule(valueHost: IFieldValueHost): ValueAdapterRule | undefined
    {
        return valueHost.getWriterRule();
    }


    /**
     * Write the value to the external data field. This is called after the value has been adjusted by the rule.
     * It assumes the value is valid and can be assigned to the field.
     * It assumes that any child objects or arrays have already been created and are ready to receive the value.
     *
     * @param fieldName The field name on external data to set. This is in a syntax
     * supported by ObjectFinder, which can find child elements in objects and arrays.
     * @param value The value to assign to the external data field, including undefined if supplied.
     * @param valueHost The value host providing the value.
     */
    protected setValueIntoExternalData(fieldName: string, value: any, valueHost: IFieldValueHost): void
    {
        let result = this.services.objectFinderService.find(this.externalData, fieldName);
        if (result.object === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Field '${ result.propertyName }' does not exist in the external data.`);
            return;
        }
        // if the object is a class instance, we confirm that the property exists on the class
        // and log an error if it does not.
        // If the object is a plain object, we allow the property to be created if it does not exist.
        if (result.object.constructor !== Object && !(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Error, () => `Specified field '${ result.propertyName }' does not exist in the external data. It will not be set.`);
            return;
        }
        else if (!(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Info, () => `Specified field '${ result.propertyName }' does not exist in the external data. It will be created.`);
        }
        (result.object as any)[result.propertyName as string] = value;
    }
}
