/**
 * @inheritdoc jivs-engine/ModelReaderWriter/Types
 * @module jivs-engine/ModelReaderWriter/ConcreteClasses
 */

import { FieldValueHostSetValueOptions, IFieldValueHost } from '../Interfaces/FieldValueHost';
import { IValueHostsManager } from '../Interfaces/ValueHostsManager';
import { ModelReaderBase } from './ModelReaderBase';

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