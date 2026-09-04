/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/AbstractClasses
 */

import { ValueAdapterRule } from '../Interfaces/ValueAdapterService';
import { IFieldValueHost, FieldValueHostSetValueOptions } from '../Interfaces/FieldValueHost';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { IModelReader, ModelReaderOptions } from '../Interfaces/ModelReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ModelReaderWriterBase } from './ModelReaderWriterBase';

/**
 * Base class for model readers. It reads from the model's properties and writes
 * to the ValueHosts.
 *
 * - Supports objects and arrays as the model.
 * - Uses the ValueAdapterService to determine if a value should be adjusted or skipped when reading from the model.
 * - Uses the ObjectFinder to find the value of a model property using a path syntax.
 */

export abstract class ModelReaderBase<T extends object, TOptions extends ModelReaderOptions = ModelReaderOptions>
    extends ModelReaderWriterBase<T>
    implements IModelReader
{
    /**
     *
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param model - The model object to be read.
     */
    constructor(valueHostsManager: IValueHostsManager, model: T, options?: TOptions)
    {
        super(valueHostsManager, model);
        this._options = options ?? {} as TOptions;
    }

    protected get options(): TOptions
    {
        return this._options;
    }
    private _options: TOptions;

    /**
     * Reads all values from the model into the corresponding ValueHosts.
     * 
     * Loops through all ValueHosts to determine their values.
     * If the model has a value, it is assigned to the ValueHost.
     * Any value is run through the rule on FieldValueHostsConfig.modelReaderRule
     * to determine if the value should be modified or treated as unassigned.
     * All conversions are logged in debug level.
     * Any errors are logged in error level.
     *
     * Designed for subclasses to customize in the following ways:
     *   * 1. Override getModelPropertyValue to provide a value for the model property and
     *      any rule that applies to it. The default returns model[modelPropertyName].
     *   * 2. Override getRule to provide a rule for the model property that supersedes the
     *      FieldValueHostConfig.modelReaderRule. The default returns valueHost.getModelReaderRule().
     */
    public readFromModel(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator)
        {
            let valueHost = vh as IFieldValueHost;
            this.readFromProperty(valueHost);
        }
    }

    /**
     * Reads the value from the model, applies the rules, and sets it into the specified ValueHost if appropriate.
     * The model property name is resolved from the ValueHost's FieldValueHostConfig.propertyName or ValueHostConfig.name.
     * @param destination The destination ValueHost. It identifies the model property name to read from
     * with its FieldValueHostConfig.propertyName. If that is not set, it uses the ValueHostConfig.name.
     * @returns True if the value was successfully read, false otherwise.
     */
    public readFromProperty(destination: IFieldValueHost): boolean;
    /**
     * Reads the value of a specified model property, applies the rules, and sets it into the specified ValueHost if appropriate.
     * @param modelPropertyName The name of the model property to read.
     * @param destination The destination ValueHost.
     * @returns True if the value was successfully read, false otherwise.
     */
    public readFromProperty(modelPropertyName: string, destination: IFieldValueHost): boolean;
    
    public readFromProperty(arg1: string | IFieldValueHost, arg2?: IFieldValueHost): boolean
    {
        let modelPropertyName: string;
        let destination: IFieldValueHost;
        if (typeof arg1 === "string") {
            modelPropertyName = arg1;
            destination = arg2 as IFieldValueHost;

        } else {
            destination = arg1 as IFieldValueHost;
            modelPropertyName = destination.getPropertyName();
            if (!modelPropertyName)
                return false; // very unlikely since its value defaults to ValueHostConfig.name. So we don't waste code logging
        }

        let valueHostName = destination.getName();
        this.logger.message(LoggingLevel.Debug, () => `Reading model property '${ modelPropertyName }' for ValueHost '${ valueHostName }'.`);

        let modelPropertyResult = this.tryGetValueFromModel(modelPropertyName, destination);
        if (modelPropertyResult.skip)
        {
            this.logger.message(LoggingLevel.Warn, () => `Model property '${ modelPropertyName }' does not exist in the model. ValueHost '${ destination.getName() }' will be treated as unassigned.`);
            if (this.options.alignEnabled)
                destination.setEnabled(false);
            return false;
        }
        return this.setValueWithRule(modelPropertyName, modelPropertyResult.value, destination);
    }

    /**
     * Sets the value of a model property into a specified ValueHost.
     * It applies the rules supporting adjustments or skipping the value, and calling ValueHost.setValue if appropriate.
     * It is up to the caller to resolve the model property value.
     * 
     * @param modelPropertyName The name of the model property.
     * @param modelPropertyValue The value of the model property.
     * @param destination The destination ValueHost or its name.
     * @returns True if the value was successfully set, false otherwise.
     */
    public setValueWithRule(modelPropertyName: string, modelPropertyValue: any, destination: IFieldValueHost | string): boolean
    {
        let valueHost: IFieldValueHost;
        if (typeof destination === "string") {
            valueHost = this.valueHostsManager.getFieldValueHost(destination)!;
            if (!valueHost)
            {
                this.logger.message(LoggingLevel.Error, () => `Cannot find ValueHost '${ destination }' to assign model property '${ modelPropertyName }' value.`);
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
            let result = this.adjustValueByRule(modelPropertyValue, rule, valueHost);
            if (result.skip)
            {
                if (this.options.alignEnabled)
                    valueHost.setEnabled(false);
                return false;
            }
            modelPropertyValue = result.value;
        }

        // special case: if the model property is undefined and there is no rule, we take no action
        else if (rule === undefined && modelPropertyValue === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Model property '${ modelPropertyName }' value is undefined and no rule to handle it. No change to the ValueHost '${ valueHostName }'.`);
            if (this.options.alignEnabled)
                valueHost.setEnabled(false);
            return false;
        }

        // we have a value to assign.
        let setValueOptions = this.getSetValueOptions();
        if (modelPropertyValue !== undefined)
        {
            this.setValueIntoValueHost(valueHost, modelPropertyValue, setValueOptions);
            this.logger.message(LoggingLevel.Info, () => `Model property '${ modelPropertyName }' value assigned to ValueHost '${ valueHostName }'.`);
        }

        else
        {
            valueHost.setValueToUndefined(setValueOptions);
            this.logger.message(LoggingLevel.Info, () => `Model property '${ modelPropertyName }' value of undefined will be assigned to ValueHost '${ valueHostName }'.`);
        }
        if (this.options.alignEnabled)
            valueHost.setEnabled(true);
        return true;
    }

    /**
     * Resolve the value of the model property and any rule that applies to it.
     * This class uses model[modelPropertyName] to get the value.
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
     * @param modelPropertyName
     * @param valueHost
     * @returns The value of the model property or skip: true if the property does not exist in the model.
     */
    protected tryGetValueFromModel(modelPropertyName: string, valueHost: IFieldValueHost):
        {
            skip?: boolean;
            value?: any;
        }
    {
        let result = this.services.objectFinderService.find(this.model, modelPropertyName);
        if (result.object === undefined)
        {
            this.logger.message(LoggingLevel.Warn, () => `Cannot resolve this '${ modelPropertyName }' against the model.`);
            return { skip: true };
        }
        assertNotNull(result.propertyName, 'result.propertyName');
        // 'in' checks both own properties and the prototype chain (for class instances)
        if (!(result.propertyName! in result.object))
        {
            this.logger.message(LoggingLevel.Warn, () => `Model property '${ result.propertyName }' does not exist in the model. ValueHost '${ valueHost.getName() }' will be treated as unassigned.`);
            return { skip: true };
        }
        return { skip: false, value: (result.object as any)[result.propertyName!] };
    }

    /**
     * Resolve the rule for adjusting or omitting the value of the model property.
     * This class uses valueHost.getModelReaderRule() to get the rule.
     *
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * Often subclasses are used to avoid the need to setup rules directly in
     * FieldValueHostConfig.modelReaderRule.
     *
     * @param valueHost
     * @returns The rule for the model property, or undefined if no rule applies.
     */
    protected getRule(valueHost: IFieldValueHost): ValueAdapterRule | undefined
    {
        return valueHost.getModelReaderRule();
    }

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
