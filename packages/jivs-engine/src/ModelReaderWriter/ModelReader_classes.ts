/**
 * @inheritdoc jivs-engine/Interfaces/ModelReaderAndWriter
 * @model jivs-engine/AbstractClasses/ModelReaderBase
 */

import { DataCleanupResolution, DataCleanupRule } from '../Interfaces/DataCleanupService';
import { FieldValueHostSetValueOptions, IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IJivsServices } from '../Interfaces/JivsServices';
import { LoggingLevel } from '../Interfaces/LoggerService';
import { IModelReader, IObjectFinder } from '../Interfaces/ModelReaderAndWriter';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { assertNotNull } from '../Utilities/ErrorHandling';
import { LoggerFacade } from '../Utilities/LoggerFacade';
import { FieldValueHost } from '../ValueHosts/FieldValueHost';
import { ObjectFinder } from './ObjectFinder';

/**
 * Base class for model readers. It reads from the model's properties and writes
 * to the ValueHosts.
 * 
 * - Supports objects and arrays as the model.
 * - Uses the DataCleanupService to determine if a value should be adjusted or skipped when reading from the model.
 * - Uses the ObjectFinder to find the value of a model property using a path syntax.
 */
export abstract class ModelReaderBase<T extends object> implements IModelReader
{
    /**
     * 
     * @param valueHostsManager - The manager for the ValueHosts.
     * @param model - The model object to be read.
     * @param disableFormatter - See {@link ModelReaderBase.disableFormatter} for details.
     * @param skipValueChangedCallback - See {@link ModelReaderBase.skipValueChangedCallback} for details.
     */
    constructor(valueHostsManager: IValueHostsManager, model: T,
        disableFormatter: boolean = false,
        skipValueChangedCallback: boolean = false
    )
    {
        assertNotNull(valueHostsManager, 'valueHostsManager');
        assertNotNull(model, 'model');
        this._valueHostsManager = valueHostsManager;
        this._services = valueHostsManager.services;
        this._model = model;
        this._disableFormatter = disableFormatter;
        this._skipValueChangedCallback = skipValueChangedCallback;
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
    protected get model(): T {
        return this._model;
    }
    private _model: T;

    protected get services(): IJivsServices
    {
        return this._services;
    }
    private _services: IJivsServices;

    /**
     * Controls behavior of setValue to turn off its ability to 
     * convert the value to text through an associated DataTypeFormatter.
     * When true, do not convert the value to text. Just set the native value.
     * When false, other options remain to do the same thing:
     *   - valueHostsManager.behaviors.disableFormatterOnValueChange
     *   - FieldValueHostConfig.formatterLookupKey = null
     * This effectively sets the setValues(value, { disableFormatter: value }) option.
     */
    protected get disableFormatter(): boolean
    {
        return this._disableFormatter;
    }
    private _disableFormatter: boolean;

    /**
     * Controls behavior of setValue to skip the ValueHost's onValueChanged and onTextValueChanged callbacks.
     * When true, skip the callback. When false, call it if setup.
     * This effectively sets the setValues(value, { skipValueChangedCallback: value }) option.
     */
    protected get skipValueChangedCallback(): boolean
    {
        return this._skipValueChangedCallback;
    }
    private _skipValueChangedCallback: boolean;

    /**
     * Provides an API for logging, sending entries to the loggerService.
     */
    protected get logger(): LoggerFacade
    {
        if (!this._logger)
            this._logger = new LoggerFacade(this.services.loggerService,
                'modelreader', this, null, true);
        return this._logger;
    }
    private _logger: LoggerFacade | null = null;    

    /**
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
    public read(): void
    {
        let generator = this.valueHostsManager.enumerateValueHosts((valueHost) => valueHost instanceof FieldValueHost);
        for (let vh of generator) {
            let valueHost = vh as IFieldValueHost;
            let modelPropertyName = valueHost.getPropertyName();
            if (!modelPropertyName)
                continue;   // very unlikely since its value defaults to ValueHostConfig.name. So we don't waste code logging

            let valueHostName = valueHost.getName();
            this.logger.message(LoggingLevel.Debug, () => `Reading model property '${ modelPropertyName }' for ValueHost '${ valueHostName }'.`);
            let modelPropertyResult = this.tryGetValueFromModel(modelPropertyName, valueHost);
            if (modelPropertyResult.skip)
            {
                this.logger.message(LoggingLevel.Warn, () => `Model property '${ modelPropertyName }' does not exist in the model. ValueHost '${ valueHostName }' will be treated as unassigned.`);
                continue;
            }
            let modelPropertyValue = modelPropertyResult.value;
            let rule = this.getRule(valueHost);
            if (rule)
            {
                let result = this.adjustValueByRule(modelPropertyValue, rule, valueHost);
                if (result.skip)
                    continue;
                modelPropertyValue = result.value;
            }
            // special case: if the model property is undefined and there is no rule, we take no action
            else if (rule === undefined && modelPropertyValue === undefined)
            {
                this.logger.message(LoggingLevel.Warn, () => `Model property '${ modelPropertyName }' value is undefined and no rule to handle it. No change to the ValueHost '${ valueHostName }'.`);
                continue;
            }

            // we have a value to assign.
            let options: FieldValueHostSetValueOptions = {
                disableFormatter: this.disableFormatter,
                skipValueChangedCallback: this.skipValueChangedCallback,
                validate: false,
                reset: true
            };
            if (modelPropertyValue !== undefined)
            {
                this.setValueIntoValueHost(valueHost, modelPropertyValue, options);
                this.logger.message(LoggingLevel.Info, () => `Model property '${ modelPropertyName }' value assigned to ValueHost '${ valueHostName }'.`);
            }
            else
            {
                valueHost.setValueToUndefined(options);
                this.logger.message(LoggingLevel.Info, () => `Model property '${ modelPropertyName }' value of undefined will be assigned to ValueHost '${ valueHostName }'.`);
            }
        }
    }

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

    /**
     * Resolve the value of the model property and any rule that applies to it.
     * This class uses model[modelPropertyName] to get the value.
     * 
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * While data cleanup is permitted, you could use the rule feature instead to handle that.
     * 
     * Supports arrays and objects with child objects or arrays using the programming syntax
     * of dot notation and bracket notation. For example, 'prop1.prop2[0].prop3' 
     * will resolve to the value of prop3 in the first element of the array prop2 in the object prop1.
     * 
     * The syntax can be reworked by implementing IObjectFinder and overriding the objectFinder property.
     * 
     * @param modelPropertyName 
     * @param valueHost
     * @returns The value of the model property or skip: true if the property does not exist in the model.
     */
    protected tryGetValueFromModel(modelPropertyName: string, valueHost: IFieldValueHost):
        {
            skip?: boolean,
            value?: any
        }
    {
        let result = this.objectFinder.find(this.model, modelPropertyName);
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
     * This class uses valueHost.getModelReaderRule() to get the rule.
     * 
     * Designed to be subclassed to allow for different retrieval mechanisms.
     * Often subclasses are used to avoid the need to setup rules directly in
     * FieldValueHostConfig.modelReaderRule.
     * 
     * @param valueHost 
     * @returns The rule for the model property, or undefined if no rule applies.
     */
    protected getRule(valueHost: IFieldValueHost): DataCleanupRule | undefined
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
     * @param options 
     */
    protected setValueIntoValueHost(valueHost: IFieldValueHost, value: any, options: FieldValueHostSetValueOptions): void
    {
        valueHost.setValue(value, options);
    }
}

/**
 * Concrete implementation of ModelReaderBase for reading from a model object.
 * 
 * @template T - The type of the model object. Can be a class instance or a plain object.
 */
export class ModelReader<T extends object = object> extends ModelReaderBase<T>
{
    constructor(valueHostsManager: IValueHostsManager, model: T,
        disableFormatter: boolean = false,
        skipValueChangedCallback: boolean = false
    )
    {
        super(valueHostsManager, model, disableFormatter, skipValueChangedCallback);
    }

}

/**
 * Concrete implementation of ModelReaderBase for reading from a dictionary object.
 * 
 * @template T - The type of the dictionary object. Must be an object with string keys and any values.
 */
export class DictionaryReader<T extends { [key: string]: any; } = { [key: string]: any; }>
    extends ModelReaderBase<T>
{
    constructor(valueHostsManager: IValueHostsManager, model: T,
        disableFormatter: boolean = false,
        skipValueChangedCallback: boolean = false
    )
    {
        super(valueHostsManager, model, disableFormatter, skipValueChangedCallback);
    }
}

/**
 * Targets HTML forms. Supports dictionaries of string values that need to be converted to native values.
 * Writes the text values using FieldValueHost.setTextValue() instead of FieldValueHost.setValue().
 * That will allow the FieldValueHost to convert the text value to a native value using its DataTypeParser.
 * Each ValueHost must be setup for parsing features to work. 
 */
export class FormReader extends ModelReaderBase<{ [key: string]: string; }>
{
    constructor(valueHostsManager: IValueHostsManager, model: { [key: string]: string; },
        reformatTextValues: boolean = false,
        skipValueChangedCallback: boolean = false
    )
    {
        super(valueHostsManager, model, false, skipValueChangedCallback);
        this._reformatTextValues = reformatTextValues;
    }

    /**
     * When true, enables the reformatTextValues feature that can be used to reformat the text values in the form. 
     * When false, the text values are not reformatted. ValueHosts must be setup for both
     * parsing and formatting features to work. The reformatTextValues feature is useful for forms that
     * are used to edit existing data. It will reformat the text values in the form to match the
     * formatting rules of the ValueHosts.
     * Even if enabled, individual FieldValueHostConfig.reformatTextValue can block this when false.
     */
    protected get reformatTextValues(): boolean
    {
        return this._reformatTextValues;
    }
    private _reformatTextValues: boolean;

    override setValueIntoValueHost(valueHost: IFieldValueHost, value: any, options: FieldValueHostSetValueOptions): void
    {
        options.disableParser = false; // ensure parser is enabled for text values
        let saved = this.valueHostsManager.behaviors.reformatTextValue;
        this.valueHostsManager.behaviors.reformatTextValue = this._reformatTextValues;
        try
        {
            valueHost.setTextValue(value, options);
        }
        finally
        {
            this.valueHostsManager.behaviors.reformatTextValue = saved;
        }

    }
}