/**
 * @inheritdoc jivs-engine/ReaderWriter/Types
 * @module jivs-engine/ReaderWriter/AbstractClasses
 */

import { ValueAdapterRule } from '../Interfaces/ValueAdapterService';
import { IFieldValueHost, FieldValueHostSetValueOptions } from '../Interfaces/FieldValueHost';
import { LoggingLevel } from '../Interfaces/LoggingService';
import { IReader, ReaderOptions } from '../Interfaces/ReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ReaderWriterBase } from './ReaderWriterBase';

/**
 * Base class for readers. It reads from the external data source's fields and writes them
 * to the ValueHosts.
 * At this level, it does not incorporate any of the ValueAdapterService rules.
 * 
 * @typeParam TExternalData - The type of the external data. It can be an object/model, dictionary, or a class that hosts data.
 * @typeParam TOptions - The type of the reader options.
 */

export abstract class ReaderBase<TExternalData extends object, TOptions extends ReaderOptions = ReaderOptions>
    extends ReaderWriterBase<TExternalData>
    implements IReader
{
    /**
     *
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param externalData - The external data source from which to read.
     */
    constructor(valueHostsManager: IValueHostsManager, externalData: TExternalData, options?: TOptions)
    {
        super(valueHostsManager, externalData);
        this._options = options ?? {} as TOptions;
    }

    protected get options(): TOptions
    {
        return this._options;
    }
    private _options: TOptions;

    /**
     * Reads all values from the external data into the corresponding ValueHosts.
     * 
     * Loops through all ValueHosts to determine their values.
     * If the external data has an associated field with a value, it is assigned to the ValueHost.
     * 
     * The option.preliminaryValidation controls whether validation is invoked on all fields after reading.
     * It defaults to true if not specified.
     * 
     * The option.filter determines which ValueHosts are included in the reading process. If not specified, all ValueHosts are included.
     */
    public read(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator)
        {
            let valueHost = vh as IFieldValueHost;
            if (!this.options.filter || this.options.filter(valueHost))
            {
                this.readOne(valueHost);
            }
            
        }
        if (this.options.preliminaryValidation !== false)
        {
            this.valueHostsManager.validate({ preliminary: true });
        }
    }

    /**
     * Reads the value from the external data, applies the rules, and sets it into the specified ValueHost if appropriate.
     * The field name is resolved from the ValueHost's FieldValueHostConfig.propertyName or ValueHostConfig.name.
     * @param destination The destination ValueHost. It identifies the field name to read from
     * with its FieldValueHostConfig.propertyName. If that is not set, it uses the ValueHostConfig.name.
     * @returns True if the value was successfully read, false otherwise.
     */
    protected abstract readOne(destination: IFieldValueHost): boolean;

    /**
     * While setting the value may seem obvious: use valueHost.setValue(value, options),
     * this method is provided to allow subclasses to override the behavior.
     * In particular, if the source is string-based values from a form, they should come through
     * valueHost.setTextValue(textValue, options) instead of valueHost.setValue(value, options).
     * @param valueHost
     * @param value
     * @param setValueOptions
     */
    protected setValueIntoValueHost(valueHost: IFieldValueHost, value: any,
        setValueOptions: FieldValueHostSetValueOptions): void
    {
        valueHost.setValue(value, setValueOptions);
    }

    protected getSetValueOptions(): FieldValueHostSetValueOptions
    {
        return <FieldValueHostSetValueOptions> {
            disableFormatter: this.options.disableFormatter ?? false,
            skipValueChangedCallback: this.options.skipValueChangedCallback ?? false,
            validate: false,
            reset: true
        };
    }    
}

/**
 * Expands the ReaderBase to support ValueAdapterService rules.
 * The ValueAdapterService determines if a value should be adjusted or skipped before being set into the ValueHost.
 * 
 * @type TExternalData The type of the external data object that the reader will process.
 * @type TOptions The type of the reader options.
 */
export abstract class ValueRulesReaderBase<TExternalData extends object, TOptions extends ReaderOptions = ReaderOptions> extends ReaderBase<TExternalData, TOptions>
{
    constructor(valueHostsManager: IValueHostsManager, model: TExternalData, options?: TOptions)
    {
        super(valueHostsManager, model, options);
    }

    protected override readOne(destination: IFieldValueHost): boolean
    {
        return this.readField(destination);
    }

    /**
     * Reads the value from the external data, applies the rules, and sets it into the specified ValueHost if appropriate.
     * The external data's field is resolved from the ValueHost's FieldValueHostConfig.propertyName or ValueHostConfig.name.
     * @param destination The destination ValueHost. It identifies the field name to read from
     * with its FieldValueHostConfig.propertyName. If that is not set, it uses the ValueHostConfig.name.
     * @returns True if the value was successfully read, false otherwise.
     */
    public readField(destination: IFieldValueHost): boolean;
    /**
     * Reads the value of a specified external data field, applies the rules, and sets it into the specified ValueHost if appropriate.
     * @param fieldName The name of the external data field to read.
     * @param destination The destination ValueHost.
     * @returns True if the value was successfully read, false otherwise.
     */
    public readField(fieldName: string, destination: IFieldValueHost): boolean;

    public readField(arg1: string | IFieldValueHost, arg2?: IFieldValueHost): boolean
    {
        let fieldName: string;
        let destination: IFieldValueHost;
        if (typeof arg1 === "string")
        {
            fieldName = arg1;
            destination = arg2 as IFieldValueHost;

        } else
        {
            destination = arg1 as IFieldValueHost;
            fieldName = destination.getPropertyName();
            if (!fieldName)
                return false; // very unlikely since its value defaults to ValueHostConfig.name. So we don't waste code logging
        }

        let valueHostName = destination.getName();
        this.logger.message(LoggingLevel.Debug, () => `Reading field '${ fieldName }' for ValueHost '${ valueHostName }'.`);

        let modelPropertyResult = this.tryGetFieldValue(fieldName, destination);
        if (modelPropertyResult.skip)
        {
            this.logger.message(LoggingLevel.Warn, () => `Field '${ fieldName }' does not exist in the source data. ValueHost '${ destination.getName() }' will be treated as unassigned.`);
            if (this.options.alignEnabled)
                destination.setEnabled(false);
            return false;
        }
        return this.setValueWithRule(fieldName, modelPropertyResult.value, destination);
    }

    /**
     * Sets the value of a field into a specified ValueHost.
     * It applies the rules supporting adjustments or skipping the value, and calling ValueHost.setValue if appropriate.
     * It is up to the caller to resolve the field value.
     * 
     * @param fieldName The name of the field.
     * @param fieldValue The value of the field.
     * @param destination The destination ValueHost or its name.
     * @returns True if the value was successfully set, false otherwise.
     */
    public setValueWithRule(fieldName: string, fieldValue: any, destination: IFieldValueHost | string): boolean
    {
        let valueHost: IFieldValueHost;
        if (typeof destination === "string")
        {
            valueHost = this.valueHostsManager.getFieldValueHost(destination)!;
            if (!valueHost)
            {
                this.logger.message(LoggingLevel.Error, () => `Cannot find ValueHost '${ destination }' to assign field '${ fieldName }' value.`);
                return false;
            }
        }
        else
        {
            valueHost = destination;
        }
        let valueHostName = valueHost.getName();
        let rule = this.getRule(valueHost);
        if (rule)
        {
            let result = this.adjustValueByRule(fieldValue, rule, valueHost);
            if (result.skip)
            {
                if (this.options.alignEnabled)
                    valueHost.setEnabled(false);
                return false;
            }
            fieldValue = result.value;
        }

        // special case: if the field value is undefined and there is no rule, we take no action
        else if (rule === undefined && fieldValue === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Field '${ fieldName }' value is undefined and no rule to handle it. No change to the ValueHost '${ valueHostName }'.`);
            if (this.options.alignEnabled)
                valueHost.setEnabled(false);
            return false;
        }

        // we have a value to assign.
        let setValueOptions = this.getSetValueOptions();
        if (fieldValue !== undefined)
        {
            this.setValueIntoValueHost(valueHost, fieldValue, setValueOptions);
            this.logger.message(LoggingLevel.Info, () => `Field '${ fieldName }' value assigned to ValueHost '${ valueHostName }'.`);
        }

        else
        {
            valueHost.setValueToUndefined(setValueOptions);
            this.logger.message(LoggingLevel.Info, () => `Field '${ fieldName }' value of undefined will be assigned to ValueHost '${ valueHostName }'.`);
        }
        if (this.options.alignEnabled)
            valueHost.setEnabled(true);
        return true;
    }

    /**
     * Resolve the field value and any rule that applies to it.
     * This class uses the objectFinderService to locate the field value in the source data.
     *
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * While data adjustment is permitted, you could use the rules of the ValueAdapterService instead to handle that.
     *
     * Supports arrays and objects with child objects or arrays using the programming syntax
     * of dot notation and bracket notation. For example, 'prop1.prop2[0].prop3'
     * will resolve to the value of prop3 in the first element of the array prop2 in the object prop1.
     *
     * The syntax can be reworked by implementing IObjectFinderService.
     *
     * @param fieldName
     * @param valueHost
     * @returns The value of the field or skip: true if the property does not exist in the model.
     */
    protected tryGetFieldValue(fieldName: string, valueHost: IFieldValueHost):
        {
            skip?: boolean;
            value?: any;
        }
    {
        let result = this.services.objectFinderService.find(this.externalData, fieldName);
        if (result.object === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Cannot find a field named '${ fieldName }' in the source data.`);
            return { skip: true };
        }
        assertNotNull(result.propertyName, 'result.propertyName');
        // 'in' checks both own properties and the prototype chain (for class instances)
        if (!(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Warn, () => `Field '${ result.propertyName }' does not exist in the source data. ValueHost '${ valueHost.getName() }' will be treated as unassigned.`);
            return { skip: true };
        }
        return { skip: false, value: (result.object as any)[result.propertyName!] }; // Field value retrieved successfully
    }

    /**
     * Resolve the rule for adjusting or omitting the value of the field.
     * This class uses valueHost.getReaderRule() to get the rule.
     *
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * Often subclasses are used to avoid the need to setup rules directly in
     * FieldValueHostConfig.readerRule.
     *
     * @param valueHost
     * @returns The rule for the field, or undefined if no rule applies.
     */
    protected getRule(valueHost: IFieldValueHost): ValueAdapterRule | undefined
    {
        return valueHost.getReaderRule();
    }
}
